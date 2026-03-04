"""
DB query functions for surveys domain.
"""

import uuid
from typing import Optional, List
from sqlmodel import Session, select, func, and_, or_
from models.surveys import (
    Survey,
    SurveyQuestion,
    SurveyResponse,
    SurveyAnswer,
    SurveyInvitation,
    SurveyDistributionConfig,
)
from models.questions import Question
from schemas.surveys import (
    SurveyCreate,
    SurveyUpdate,
    SurveyPublic,
    SurveyQuestionCreate,
    SurveyQuestionWithDetails,
    SurveyDistributionConfigCreateRequest,
    SurveyDistributionConfigPublic,
    SurveyStatus,
    DistributionStatus,
)
from schemas.questions import QuestionPublic
from utils.timezone import get_current_time_gmt8


# ---------------------------------------------------------------------------
# ID generators
# ---------------------------------------------------------------------------


def generate_survey_id(session: Session) -> str:
    last_id = session.exec(
        select(Survey.survey_id).order_by(Survey.survey_id.desc()).limit(1)
    ).first()
    next_num = int(last_id.split("-")[1]) + 1 if last_id else 1
    return f"SRVY-{next_num:06d}"


def generate_response_id(session: Session) -> str:
    last_id = session.exec(
        select(SurveyResponse.response_id)
        .order_by(SurveyResponse.response_id.desc())
        .limit(1)
    ).first()
    next_num = int(last_id.split("-")[1]) + 1 if last_id else 1
    return f"SRSP-{next_num:06d}"


def generate_invitation_id(session: Session) -> str:
    last_id = session.exec(
        select(SurveyInvitation.invitation_id)
        .order_by(SurveyInvitation.invitation_id.desc())
        .limit(1)
    ).first()
    next_num = int(last_id.split("-")[1]) + 1 if last_id else 1
    return f"SINV-{next_num:06d}"


def generate_distribution_id(session: Session) -> str:
    last_id = session.exec(
        select(SurveyDistributionConfig.distribution_id)
        .order_by(SurveyDistributionConfig.distribution_id.desc())
        .limit(1)
    ).first()
    next_num = int(last_id.split("-")[1]) + 1 if last_id else 1
    return f"SDST-{next_num:06d}"


# ---------------------------------------------------------------------------
# Survey lookups
# ---------------------------------------------------------------------------


def get_survey_by_id(session: Session, survey_id: str) -> Survey | None:
    return session.exec(
        select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == False)
        )
    ).first()


def get_deleted_survey_by_id(session: Session, survey_id: str) -> Survey | None:
    return session.exec(
        select(Survey).where(
            and_(Survey.survey_id == survey_id, Survey.is_deleted == True)
        )
    ).first()


def check_duplicate_survey_title(session: Session, title: str) -> Survey | None:
    return session.exec(
        select(Survey).where(
            and_(func.lower(Survey.title) == title.lower(), Survey.is_deleted == False)
        )
    ).first()


def get_survey_question_count(session: Session, survey_code: uuid.UUID) -> int:
    return session.exec(
        select(func.count(SurveyQuestion.survey_question_code)).where(
            SurveyQuestion.survey_code == survey_code
        )
    ).one()


def get_survey_question_counts_batch(
    session: Session, survey_codes: list[uuid.UUID]
) -> dict[uuid.UUID, int]:
    """Fetch question counts for multiple surveys in one grouped query."""
    if not survey_codes:
        return {}
    rows = session.exec(
        select(
            SurveyQuestion.survey_code, func.count(SurveyQuestion.survey_question_code)
        )
        .where(SurveyQuestion.survey_code.in_(survey_codes))
        .group_by(SurveyQuestion.survey_code)
    ).all()
    counts = {row[0]: row[1] for row in rows}
    # Surveys with 0 questions won't appear in the grouped result
    return {code: counts.get(code, 0) for code in survey_codes}


# ---------------------------------------------------------------------------
# Survey CRUD
# ---------------------------------------------------------------------------


def list_surveys(
    session: Session, skip: int, limit: int, search: str | None, status: str | None
) -> tuple[list[Survey], int]:
    stmt = select(Survey).where(Survey.is_deleted == False)
    count_stmt = select(func.count(Survey.survey_code)).where(
        Survey.is_deleted == False
    )

    if search:
        stmt = stmt.where(
            or_(Survey.title.contains(search), Survey.description.contains(search))
        )
        count_stmt = count_stmt.where(
            or_(Survey.title.contains(search), Survey.description.contains(search))
        )
    if status:
        stmt = stmt.where(Survey.status == status)
        count_stmt = count_stmt.where(Survey.status == status)

    total = session.exec(count_stmt).one()
    surveys = session.exec(stmt.offset(skip).limit(limit)).all()
    return surveys, total


def create_survey(session: Session, data: SurveyCreate) -> Survey:
    survey = Survey(
        **data.dict(),
        survey_code=uuid.uuid4(),
        survey_id=generate_survey_id(session),
        status=SurveyStatus.DRAFT,
        created_at=get_current_time_gmt8(),
        updated_at=get_current_time_gmt8(),
    )
    session.add(survey)
    session.commit()
    session.refresh(survey)
    return survey


def update_survey(session: Session, survey: Survey, data: SurveyUpdate) -> Survey:
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(survey, key, value)
    survey.updated_at = get_current_time_gmt8()
    session.add(survey)
    session.commit()
    session.refresh(survey)
    return survey


def soft_delete_survey(session: Session, survey: Survey) -> None:
    survey.is_deleted = True
    survey.deleted_at = get_current_time_gmt8()
    session.add(survey)
    session.commit()


def restore_survey(session: Session, survey: Survey) -> Survey:
    survey.is_deleted = False
    survey.deleted_at = None
    session.add(survey)
    session.commit()
    session.refresh(survey)
    return survey


def set_survey_status(session: Session, survey: Survey, status: SurveyStatus) -> Survey:
    survey.status = status
    survey.updated_at = get_current_time_gmt8()
    session.add(survey)
    session.commit()
    session.refresh(survey)
    return survey


# ---------------------------------------------------------------------------
# Survey questions
# ---------------------------------------------------------------------------


def get_survey_questions_with_details(
    session: Session, survey_code: uuid.UUID
) -> list[SurveyQuestionWithDetails]:
    """Fetch all questions for a survey in ONE join query (no N+1)."""
    rows = session.exec(
        select(SurveyQuestion, Question)
        .join(Question, SurveyQuestion.question_code == Question.question_code)
        .where(SurveyQuestion.survey_code == survey_code)
        .order_by(SurveyQuestion.order_index)
    ).all()
    return [
        SurveyQuestionWithDetails(
            order_index=sq.order_index,
            question=QuestionPublic.model_validate(q),
        )
        for sq, q in rows
    ]


def add_question_to_survey(
    session: Session, survey: Survey, data: SurveyQuestionCreate
) -> SurveyQuestionWithDetails:
    """Raises ValueError on not-found or duplicate."""
    question = session.exec(
        select(Question).where(
            and_(Question.question_id == data.question_id, Question.is_deleted == False)
        )
    ).first()
    if not question:
        raise ValueError("QUESTION_NOT_FOUND")

    existing = session.exec(
        select(SurveyQuestion).where(
            and_(
                SurveyQuestion.survey_code == survey.survey_code,
                SurveyQuestion.question_code == question.question_code,
            )
        )
    ).first()
    if existing:
        raise ValueError("QUESTION_ALREADY_IN_SURVEY")

    order_index = data.order_index
    if order_index is None:
        max_order = session.exec(
            select(func.max(SurveyQuestion.order_index)).where(
                SurveyQuestion.survey_code == survey.survey_code
            )
        ).one()
        order_index = (max_order or 0) + 1

    sq = SurveyQuestion(
        survey_question_code=uuid.uuid4(),
        survey_code=survey.survey_code,
        question_code=question.question_code,
        order_index=order_index,
    )
    session.add(sq)
    session.commit()
    session.refresh(sq)
    return SurveyQuestionWithDetails(
        order_index=sq.order_index, question=QuestionPublic.model_validate(question)
    )


def add_questions_batch(
    session: Session, survey: Survey, items: list[SurveyQuestionCreate]
) -> tuple[list[SurveyQuestionWithDetails], list[dict]]:
    max_order = (
        session.exec(
            select(func.max(SurveyQuestion.order_index)).where(
                SurveyQuestion.survey_code == survey.survey_code
            )
        ).one()
        or 0
    )

    added, failed = [], []
    for idx, item in enumerate(items, start=1):
        try:
            question = session.exec(
                select(Question).where(
                    and_(
                        Question.question_id == item.question_id,
                        Question.is_deleted == False,
                    )
                )
            ).first()
            if not question:
                failed.append(
                    {
                        "index": idx,
                        "question_id": item.question_id,
                        "error": "QUESTION_NOT_FOUND",
                    }
                )
                continue

            dup = session.exec(
                select(SurveyQuestion).where(
                    and_(
                        SurveyQuestion.survey_code == survey.survey_code,
                        SurveyQuestion.question_code == question.question_code,
                    )
                )
            ).first()
            if dup:
                failed.append(
                    {
                        "index": idx,
                        "question_id": item.question_id,
                        "error": "Question already in survey",
                    }
                )
                continue

            order_index = item.order_index or (max_order + len(added) + 1)
            sq = SurveyQuestion(
                survey_question_code=uuid.uuid4(),
                survey_code=survey.survey_code,
                question_code=question.question_code,
                order_index=order_index,
            )
            session.add(sq)
            session.flush()
            added.append(
                SurveyQuestionWithDetails(
                    order_index=sq.order_index,
                    question=QuestionPublic.model_validate(question),
                )
            )
        except Exception as e:
            failed.append(
                {"index": idx, "question_id": item.question_id, "error": str(e)}
            )

    session.commit()
    return added, failed


def remove_question_from_survey(
    session: Session, survey: Survey, question_id: str
) -> None:
    """Raises ValueError on not found."""
    question = session.exec(
        select(Question).where(
            and_(Question.question_id == question_id, Question.is_deleted == False)
        )
    ).first()
    if not question:
        raise ValueError("QUESTION_NOT_FOUND")

    sq = session.exec(
        select(SurveyQuestion).where(
            and_(
                SurveyQuestion.survey_code == survey.survey_code,
                SurveyQuestion.question_code == question.question_code,
            )
        )
    ).first()
    if not sq:
        raise ValueError("SURVEY_QUESTION_NOT_FOUND")

    removed_order = sq.order_index
    session.delete(sq)

    # Reorder remaining
    lower = session.exec(
        select(SurveyQuestion)
        .where(
            and_(
                SurveyQuestion.survey_code == survey.survey_code,
                SurveyQuestion.order_index > removed_order,
            )
        )
        .order_by(SurveyQuestion.order_index)
    ).all()
    for remainder in lower:
        remainder.order_index -= 1
        session.add(remainder)

    session.commit()


def reorder_survey_questions(session: Session, survey: Survey, order_map: dict) -> None:
    """Reorder questions in a survey. order_map: {question_id: new_order_index}
    Uses a two-phase approach to avoid unique constraint violations on (survey_code, order_index).
    """
    if not order_map:
        return

    # 1. Fetch all questions in one query
    question_ids = list(order_map.keys())
    questions = session.exec(
        select(Question).where(Question.question_id.in_(question_ids))
    ).all()

    if not questions:
        return

    question_codes = [q.question_code for q in questions]
    question_code_to_id = {q.question_code: q.question_id for q in questions}

    # 2. Fetch all SurveyQuestion junctions in one query
    sqs = session.exec(
        select(SurveyQuestion).where(
            and_(
                SurveyQuestion.survey_code == survey.survey_code,
                SurveyQuestion.question_code.in_(question_codes),
            )
        )
    ).all()

    sqs_to_update = []
    for sq in sqs:
        q_id = question_code_to_id.get(sq.question_code)
        if q_id and q_id in order_map:
            sqs_to_update.append((sq, order_map[q_id]))

    # Phase 1: Set all to temporary negative values to avoid constraint conflicts
    for i, (sq, _) in enumerate(sqs_to_update):
        sq.order_index = -(i + 1000)
        session.add(sq)
    session.flush()

    # Phase 2: Set to final values
    for sq, final_order in sqs_to_update:
        sq.order_index = final_order
        session.add(sq)
    session.commit()


# ---------------------------------------------------------------------------
# Distribution config
# ---------------------------------------------------------------------------


def get_distribution_config(
    session: Session, survey_code: uuid.UUID
) -> SurveyDistributionConfig | None:
    return session.exec(
        select(SurveyDistributionConfig).where(
            SurveyDistributionConfig.survey_code == survey_code
        )
    ).first()


def configure_distribution(
    session: Session, survey: Survey, data: SurveyDistributionConfigCreateRequest
) -> SurveyDistributionConfig:
    existing = get_distribution_config(session, survey.survey_code)
    if existing:
        existing.target_group = data.target_group
        existing.filters = data.filters
        existing.scheduled_send_at = data.scheduled_send_at
        existing.updated_at = get_current_time_gmt8()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        config = SurveyDistributionConfig(
            survey_code=survey.survey_code,
            target_group=data.target_group,
            filters=data.filters,
            scheduled_send_at=data.scheduled_send_at,
            distribution_code=uuid.uuid4(),
            distribution_id=generate_distribution_id(session),
            created_at=get_current_time_gmt8(),
            updated_at=get_current_time_gmt8(),
        )
        session.add(config)
        session.commit()
        session.refresh(config)
        return config


def update_distribution_config(
    session: Session,
    config: SurveyDistributionConfig,
    data: SurveyDistributionConfigCreateRequest,
) -> SurveyDistributionConfig:
    config.target_group = data.target_group
    config.filters = data.filters
    config.scheduled_send_at = data.scheduled_send_at
    config.updated_at = get_current_time_gmt8()
    session.add(config)
    session.commit()
    session.refresh(config)
    return config


# ---------------------------------------------------------------------------
# Distribution sending (Phase 1.4B)
# ---------------------------------------------------------------------------


def _resolve_recipients(session: Session, config: SurveyDistributionConfig):
    """Return Alumni queryset based on target_group + filters. Returns list of Alumni."""
    from models.alumni import Alumni
    from models.student_records import StudentRecord
    from models.courses import Course
    import json

    stmt = select(Alumni).where(Alumni.is_deleted == False)

    if config.target_group == DistributionTargetGroup.ALL_ALUMNI:
        pass  # no additional filter

    elif config.target_group == DistributionTargetGroup.SPECIFIC_COURSE:
        filters = json.loads(config.filters) if config.filters else {}
        courses = filters.get("courses", [])
        if courses:
            # Join: Alumni.student_code → StudentRecord.student_code → Course.course_code
            stmt = (
                stmt.join(
                    StudentRecord, StudentRecord.student_code == Alumni.student_code
                )
                .join(Course, Course.course_code == StudentRecord.course_code)
                .where(Course.course_abbv.in_(courses))
            )

    elif config.target_group == DistributionTargetGroup.GRADUATION_YEAR_RANGE:
        filters = json.loads(config.filters) if config.filters else {}
        year_min = filters.get("year_min")
        year_max = filters.get("year_max")
        if year_min is not None and year_max is not None:
            stmt = stmt.join(
                StudentRecord, StudentRecord.student_code == Alumni.student_code
            ).where(
                and_(
                    StudentRecord.year_graduated >= year_min,
                    StudentRecord.year_graduated <= year_max,
                )
            )

    elif config.target_group == DistributionTargetGroup.CUSTOM_LIST:
        filters = json.loads(config.filters) if config.filters else {}
        alumni_ids = filters.get("alumni_ids", [])
        if alumni_ids:
            stmt = stmt.where(Alumni.alumni_id.in_(alumni_ids))

    return session.exec(stmt).all()


def send_survey_invitations(
    session: Session, survey: Survey, config: SurveyDistributionConfig
) -> tuple[int, list]:
    """
    Create SurveyInvitation records for all resolved recipients.
    Skips alumni who already have an invitation for this survey.
    Returns (sent_count, new_invitations_list).
    Note: actual email delivery is a future integration; this creates the invitation records.
    """
    from models.alumni import Alumni
    from models.users import User

    recipients = _resolve_recipients(session, config)
    if not recipients:
        return 0, []

    created = []
    for alumni in recipients:
        # Skip if already invited
        existing_inv = session.exec(
            select(SurveyInvitation).where(
                and_(
                    SurveyInvitation.survey_code == survey.survey_code,
                    SurveyInvitation.alumni_code == alumni.alumni_code,
                )
            )
        ).first()
        if existing_inv:
            continue

        # Resolve email from linked User record
        email = ""
        if alumni.user_code:
            user = session.exec(
                select(User).where(User.user_code == alumni.user_code)
            ).first()
            if user:
                email = user.email or ""

        inv = SurveyInvitation(
            invitation_code=uuid.uuid4(),
            invitation_id=generate_invitation_id(session),
            survey_code=survey.survey_code,
            alumni_code=alumni.alumni_code,
            recipient_email=email,
            status=SurveyInvitationStatus.SENT,
            sent_at=get_current_time_gmt8(),
            created_at=get_current_time_gmt8(),
        )
        session.add(inv)
        session.flush()
        created.append(inv)

    # Mark config as SENT
    config.status = DistributionStatus.SENT
    config.sent_at = get_current_time_gmt8()
    config.total_recipients = session.exec(
        select(func.count(SurveyInvitation.invitation_code)).where(
            SurveyInvitation.survey_code == survey.survey_code
        )
    ).one()
    config.updated_at = get_current_time_gmt8()
    session.add(config)
    session.commit()

    return len(created), created


def send_survey_reminders(session: Session, survey: Survey) -> tuple[int, list]:
    """
    Identify alumni who received invitations but have not responded, and mark them for reminder.
    Returns (reminder_count, invitation_list_to_remind).
    Note: actual email delivery is a future integration.
    """
    # Get all SENT invitations (those without a responded_at)
    pending_invs = session.exec(
        select(SurveyInvitation).where(
            and_(
                SurveyInvitation.survey_code == survey.survey_code,
                SurveyInvitation.status == SurveyInvitationStatus.SENT,
                SurveyInvitation.responded_at == None,
            )
        )
    ).all()

    # In a real system we'd re-send emails here; for now we just return the count
    # and re-timestamp sent_at to indicate a reminder was sent
    now = get_current_time_gmt8()
    for inv in pending_invs:
        inv.sent_at = now
        session.add(inv)

    if pending_invs:
        session.commit()

    return len(pending_invs), pending_invs


def get_distribution_stats(
    session: Session, survey_code: uuid.UUID, config: SurveyDistributionConfig
) -> dict:
    """Compute distribution statistics: sent, responded, response_rate, etc."""
    total = session.exec(
        select(func.count(SurveyInvitation.invitation_code)).where(
            SurveyInvitation.survey_code == survey_code
        )
    ).one()

    responded = session.exec(
        select(func.count(SurveyInvitation.invitation_code)).where(
            and_(
                SurveyInvitation.survey_code == survey_code,
                SurveyInvitation.responded_at != None,
            )
        )
    ).one()

    opened = session.exec(
        select(func.count(SurveyInvitation.invitation_code)).where(
            and_(
                SurveyInvitation.survey_code == survey_code,
                SurveyInvitation.opened_at != None,
            )
        )
    ).one()

    pending = total - responded
    response_rate = round(responded / total, 4) if total > 0 else 0.0

    return {
        "distribution_id": config.distribution_id,
        "survey_code": str(survey_code),
        "total_recipients": total,
        "sent_count": total,
        "opened_count": opened,
        "responded_count": responded,
        "pending_count": pending,
        "response_rate": response_rate,
        "status": config.status.value,
        "sent_at": config.sent_at,
        "scheduled_send_at": config.scheduled_send_at,
    }


def get_non_respondents(
    session: Session, survey_code: uuid.UUID, skip: int, limit: int
) -> tuple[list, int]:
    """
    Return paginated list of alumni who received invitations but haven't responded.
    Each item: {alumni_id, first_name, last_name, invitation_id, sent_at}
    """
    from models.alumni import Alumni

    stmt = (
        select(SurveyInvitation, Alumni)
        .join(Alumni, Alumni.alumni_code == SurveyInvitation.alumni_code)
        .where(
            and_(
                SurveyInvitation.survey_code == survey_code,
                SurveyInvitation.responded_at == None,
                SurveyInvitation.status == SurveyInvitationStatus.SENT,
            )
        )
    )

    total = session.exec(
        select(func.count(SurveyInvitation.invitation_code))
        .join(Alumni, Alumni.alumni_code == SurveyInvitation.alumni_code)
        .where(
            and_(
                SurveyInvitation.survey_code == survey_code,
                SurveyInvitation.responded_at == None,
                SurveyInvitation.status == SurveyInvitationStatus.SENT,
            )
        )
    ).one()

    rows = session.exec(stmt.offset(skip).limit(limit)).all()

    result = []
    for inv, alumni in rows:
        result.append(
            {
                "alumni_id": alumni.alumni_id,
                "first_name": alumni.first_name,
                "last_name": alumni.last_name,
                "invitation_id": inv.invitation_id,
                "sent_at": inv.sent_at,
            }
        )

    return result, total


# ---------------------------------------------------------------------------
# Results & analytics (Phase 1.6)
# ---------------------------------------------------------------------------


def get_survey_results(session: Session, survey: Survey) -> dict:
    """
    Compute aggregated per-question statistics for a survey.
    Returns a dict matching SurveyResultsSummary.
    """
    from collections import Counter
    from statistics import mean, median
    from schemas.questions import QuestionType

    # Count totals
    total_responses = session.exec(
        select(func.count(SurveyResponse.response_code)).where(
            and_(
                SurveyResponse.survey_code == survey.survey_code,
                SurveyResponse.is_deleted == False,
            )
        )
    ).one()

    complete_responses = session.exec(
        select(func.count(SurveyResponse.response_code)).where(
            and_(
                SurveyResponse.survey_code == survey.survey_code,
                SurveyResponse.is_deleted == False,
                SurveyResponse.is_complete == True,
            )
        )
    ).one()

    completion_rate = (
        round(complete_responses / total_responses, 4) if total_responses > 0 else 0.0
    )

    # Get ordered questions for this survey
    sq_rows = session.exec(
        select(SurveyQuestion)
        .where(SurveyQuestion.survey_code == survey.survey_code)
        .order_by(SurveyQuestion.order_index)
    ).all()

    from models.questions import Question

    question_summaries = []

    for sq in sq_rows:
        question = session.exec(
            select(Question).where(Question.question_code == sq.question_code)
        ).first()
        if not question:
            continue

        # Fetch all answers for this question in this survey
        answers = session.exec(
            select(SurveyAnswer)
            .join(
                SurveyResponse,
                SurveyResponse.response_code == SurveyAnswer.response_code,
            )
            .where(
                and_(
                    SurveyAnswer.question_code == question.question_code,
                    SurveyResponse.survey_code == survey.survey_code,
                    SurveyResponse.is_deleted == False,
                )
            )
        ).all()

        total_answers = len(answers)
        summary: dict = {
            "question_id": question.question_id,
            "question_text": question.question_text,
            "question_type": question.question_type.value,
            "total_answers": total_answers,
        }

        qtype = question.question_type

        if qtype == QuestionType.MULTIPLE_CHOICE:
            counts = Counter(a.answer_choice for a in answers if a.answer_choice)
            summary["choice_distribution"] = dict(counts)

        elif qtype == QuestionType.MULTI_SELECT:
            import json as _json

            all_choices = []
            for a in answers:
                if a.answer_choices:
                    try:
                        choices = _json.loads(a.answer_choices)
                        if isinstance(choices, list):
                            all_choices.extend(choices)
                    except Exception:
                        pass
            summary["choice_distribution"] = dict(Counter(all_choices))

        elif qtype == QuestionType.SCALE:
            values = [a.answer_scale for a in answers if a.answer_scale is not None]
            if values:
                summary["average"] = round(mean(values), 2)
                dist = Counter(str(v) for v in values)
                # Ensure all scale values in range are represented
                for v in range(question.scale_min or 1, (question.scale_max or 5) + 1):
                    dist.setdefault(str(v), 0)
                summary["distribution"] = dict(sorted(dist.items()))
            else:
                summary["average"] = None
                summary["distribution"] = {}

        elif qtype == QuestionType.NUMBER:
            values = [a.answer_number for a in answers if a.answer_number is not None]
            if values:
                summary["average"] = round(mean(values), 2)
                summary["min_value"] = min(values)
                summary["max_value"] = max(values)
                summary["median_value"] = median(values)

        elif qtype == QuestionType.YES_NO:
            yes = sum(1 for a in answers if a.answer_bool is True)
            no = sum(1 for a in answers if a.answer_bool is False)
            summary["yes_count"] = yes
            summary["no_count"] = no

        elif qtype in (QuestionType.TEXT, QuestionType.DATE):
            unique_samples = list(
                dict.fromkeys(
                    str(a.answer_text or a.answer_date)
                    for a in answers
                    if (a.answer_text or a.answer_date) is not None
                )
            )
            summary["sample_answers"] = unique_samples[:10]

        question_summaries.append(summary)

    return {
        "survey_id": survey.survey_id,
        "title": survey.title,
        "total_responses": total_responses,
        "completion_rate": completion_rate,
        "question_summaries": question_summaries,
    }


def export_survey_responses(session: Session, survey: Survey) -> dict:
    """
    Return raw data dump of all responses with all answers and joined question texts.
    """
    from models.questions import Question

    responses = session.exec(
        select(SurveyResponse)
        .where(
            and_(
                SurveyResponse.survey_code == survey.survey_code,
                SurveyResponse.is_deleted == False,
            )
        )
        .order_by(SurveyResponse.submitted_at)
    ).all()

    from models.alumni import Alumni
    from utils.timezone import get_current_time_gmt8
    from datetime import timezone as _tz
    from schemas.surveys import GMT8 as _GMT8

    def _fmt(dt):
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=_tz.utc)
        return dt.astimezone(_GMT8).strftime("%Y-%m-%d %H:%M:%S")

    output_responses = []
    for resp in responses:
        # Resolve alumni_id if response is not anonymous
        alumni_id = None
        if resp.alumni_code and not survey.is_anonymous:
            alumni = session.exec(
                select(Alumni).where(Alumni.alumni_code == resp.alumni_code)
            ).first()
            if alumni:
                alumni_id = alumni.alumni_id

        # Fetch answers
        answers = session.exec(
            select(SurveyAnswer).where(SurveyAnswer.response_code == resp.response_code)
        ).all()

        answer_list = []
        for ans in answers:
            q = session.exec(
                select(Question).where(Question.question_code == ans.question_code)
            ).first()
            answer_list.append(
                {
                    "question_id": q.question_id if q else None,
                    "question_text": q.question_text if q else None,
                    "question_type": q.question_type.value if q else None,
                    "answer_text": ans.answer_text,
                    "answer_choice": ans.answer_choice,
                    "answer_choices": ans.answer_choices,
                    "answer_scale": ans.answer_scale,
                    "answer_number": ans.answer_number,
                    "answer_date": _fmt(ans.answer_date),
                    "answer_bool": ans.answer_bool,
                }
            )

        output_responses.append(
            {
                "response_id": resp.response_id,
                "submitted_at": _fmt(resp.submitted_at),
                "is_complete": resp.is_complete,
                "alumni_id": alumni_id,
                "answers": answer_list,
            }
        )

    return {
        "survey_id": survey.survey_id,
        "title": survey.title,
        "total_responses": len(output_responses),
        "responses": output_responses,
    }
