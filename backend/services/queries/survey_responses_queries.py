"""
DB query functions for survey response submission and analytics.
"""

import uuid
from sqlmodel import Session, select, func, and_
from models.surveys import (
    Survey,
    SurveyQuestion,
    SurveyResponse,
    SurveyAnswer,
    SurveyInvitation,
)
from models.questions import Question
from schemas.surveys import SurveyInvitationStatus
from utils.timezone import get_current_time_gmt8
from services.queries.transaction_logs_queries import create_transaction_log


# ---------------------------------------------------------------------------
# ID generator
# ---------------------------------------------------------------------------


def generate_response_id(session: Session) -> str:
    last_id = session.exec(
        select(SurveyResponse.response_id)
        .order_by(SurveyResponse.response_id.desc())
        .limit(1)
    ).first()
    next_num = int(last_id.split("-")[1]) + 1 if last_id else 1
    return f"SRSP-{next_num:06d}"


# ---------------------------------------------------------------------------
# Survey response submission (Phase 1.5)
# ---------------------------------------------------------------------------


def submit_survey_response(
    session: Session,
    survey: Survey,
    data,  # schemas.surveys.SurveySubmission
    performed_by: str | None = None,
) -> dict:
    """
    Create a SurveyResponse + SurveyAnswer rows for an alumni submission.

    Returns dict with response_id and answer_count on success.
    Raises ValueError for validation failures.
    """
    from models.alumni import Alumni

    now = get_current_time_gmt8()

    # 1. Resolve alumni if provided (non-anonymous)
    alumni_code = None
    if data.alumni_id:
        alumni = session.exec(
            select(Alumni).where(
                and_(
                    Alumni.alumni_id == data.alumni_id.upper(),
                    Alumni.is_deleted == False,
                )
            )
        ).first()
        if not alumni:
            raise ValueError("ALUMNI_NOT_FOUND")
        alumni_code = alumni.alumni_code

    # 2. Duplicate guard (if allow_multiple_responses is False)
    if not survey.allow_multiple_responses and alumni_code:
        existing_response = session.exec(
            select(SurveyResponse).where(
                and_(
                    SurveyResponse.survey_code == survey.survey_code,
                    SurveyResponse.alumni_code == alumni_code,
                    SurveyResponse.is_deleted == False,
                )
            )
        ).first()
        if existing_response:
            raise ValueError("DUPLICATE_RESPONSE")

    # 3. Pre-fetch all survey questions in one query for validation
    survey_questions = session.exec(
        select(SurveyQuestion, Question)
        .join(Question, SurveyQuestion.question_code == Question.question_code)
        .where(SurveyQuestion.survey_code == survey.survey_code)
    ).all()

    # Build lookup maps: question_id → (question_code, question)
    question_map: dict[str, tuple[uuid.UUID, Question]] = {}
    for sq, q in survey_questions:
        question_map[q.question_id] = (q.question_code, q)

    # 4. Validate required questions are answered
    answered_question_ids = {item.question_id for item in data.answers}
    for q_id, (_, q) in question_map.items():
        if q.is_required and q_id not in answered_question_ids:
            raise ValueError(f"REQUIRED_QUESTION_MISSING:{q_id}")

    # 5. Validate all submitted answers reference valid survey questions
    for item in data.answers:
        if item.question_id not in question_map:
            raise ValueError(f"QUESTION_NOT_IN_SURVEY:{item.question_id}")

    # 6. Create SurveyResponse
    response = SurveyResponse(
        response_code=uuid.uuid4(),
        response_id=generate_response_id(session),
        survey_code=survey.survey_code,
        alumni_code=alumni_code,
        submitted_at=now,
        is_complete=True,
        is_deleted=False,
    )
    session.add(response)
    session.flush()

    # 7. Create SurveyAnswer rows
    for item in data.answers:
        question_code, _ = question_map[item.question_id]
        answer = SurveyAnswer(
            answer_code=uuid.uuid4(),
            response_code=response.response_code,
            question_code=question_code,
            answer_text=item.answer_text,
            answer_choice=item.answer_choice,
            answer_choices=item.answer_choices,
            answer_scale=item.answer_scale,
            answer_number=item.answer_number,
            answer_date=item.answer_date,
            answer_bool=item.answer_bool,
        )
        session.add(answer)

    # 8. Update invitation status if one exists
    if alumni_code:
        invitation = session.exec(
            select(SurveyInvitation).where(
                and_(
                    SurveyInvitation.survey_code == survey.survey_code,
                    SurveyInvitation.alumni_code == alumni_code,
                )
            )
        ).first()
        if invitation:
            invitation.status = SurveyInvitationStatus.RESPONDED
            invitation.responded_at = now
            session.add(invitation)

    # 9. Log and commit
    create_transaction_log(
        session,
        tl_name=f"SUBMITTED survey response {survey.survey_id}",
        after={
            "survey_id": survey.survey_id,
            "response_id": response.response_id,
            "answer_count": len(data.answers),
        },
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(response)

    return {
        "response_id": response.response_id,
        "answer_count": len(data.answers),
    }


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
    from utils.timezone import SORTABLE_DATETIME_FORMAT, format_datetime_gmt8

    def _fmt(dt):
        return format_datetime_gmt8(dt, fmt=SORTABLE_DATETIME_FORMAT)

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
