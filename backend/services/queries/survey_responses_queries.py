"""
DB query functions for survey response submission and analytics.
"""
from sqlmodel import Session, select, func, and_
from models.surveys import (
    Survey,
    SurveyQuestion,
    SurveyResponse,
)
from models.questions import Question
from utils.timezone import get_current_time_gmt8
from services.queries.audit import stamp_create
from services.queries.transaction_logs_queries import create_transaction_log
from services.queries.user_activities_queries import create_user_activity, ActivityType


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
    alumni_ref_id = None
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
        alumni_ref_id = alumni.id

    # 2. Duplicate guard (if allow_multiple_responses is False)
    if not survey.allow_multiple_responses and alumni_ref_id:
        existing_response = session.exec(
            select(SurveyResponse).where(
                and_(
                    SurveyResponse.survey_ref_id == survey.id,
                    SurveyResponse.alumni_ref_id == alumni_ref_id,
                    SurveyResponse.is_deleted == False,
                )
            )
        ).first()
        if existing_response:
            raise ValueError("DUPLICATE_RESPONSE")

    # 3. Pre-fetch all survey questions in one query for validation
    survey_questions = session.exec(
        select(SurveyQuestion, Question)
        .join(Question, SurveyQuestion.question_ref_id == Question.id)
        .where(
            (SurveyQuestion.survey_ref_id == survey.id)
            & (SurveyQuestion.is_deleted == False)
            & (Question.is_deleted == False)
        )
    ).all()

    # Build lookup maps: question_id → question
    question_map: dict[str, Question] = {}
    for sq, q in survey_questions:
        question_map[q.question_id] = q

    # 4. Validate required questions are answered
    answered_question_ids = {item.question_id for item in data.answers}
    for q_id, q in question_map.items():
        if q.is_required and q_id not in answered_question_ids:
            raise ValueError(f"REQUIRED_QUESTION_MISSING:{q_id}")

    # 5. Validate all submitted answers reference valid survey questions
    for item in data.answers:
        if item.question_id not in question_map:
            raise ValueError(f"QUESTION_NOT_IN_SURVEY:{item.question_id}")

    # 6. Create SurveyResponse
    response = SurveyResponse(
        response_id=generate_response_id(session),
        survey_ref_id=survey.id,
        alumni_ref_id=alumni_ref_id,
        submitted_at=now,
        is_complete=True,
        is_deleted=False,
    )
    stamp_create(response, performed_by or alumni_ref_id)
    session.add(response)
    session.flush()

    # 7. Add answers to JSON column
    # Answers are stored as a JSON list keyed by question_id.
    answers_json = []
    for item in data.answers:
        q = question_map[item.question_id]
        
        answer_dict = {
            "question_id": item.question_id,
            "question_text": q.question_text,
            "question_type": q.question_type.value,
        }
        
        from schemas.questions import QuestionType
        
        qtype = q.question_type
        if qtype == QuestionType.TEXT:
            answer_dict["answer_text"] = item.answer_text
        elif qtype == QuestionType.MULTIPLE_CHOICE:
            answer_dict["answer_choice"] = item.answer_choice
        elif qtype == QuestionType.MULTI_SELECT:
            answer_dict["answer_choices"] = item.answer_choices
        elif qtype == QuestionType.SCALE:
            answer_dict["answer_scale"] = item.answer_scale
        elif qtype == QuestionType.NUMBER:
            answer_dict["answer_number"] = item.answer_number
        elif qtype == QuestionType.DATE:
            answer_dict["answer_date"] = item.answer_date.isoformat() if item.answer_date else None
        elif qtype == QuestionType.YES_NO:
            answer_dict["answer_bool"] = item.answer_bool

        answers_json.append(answer_dict)
        
    response.answers = answers_json

    # 8. Log and commit
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
    if performed_by:
        create_user_activity(
            session,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.SUBMIT_SURVEY,
            description=f"Submitted survey: {survey.title}",
            activity_metadata={"survey_id": survey.survey_id, "response_id": response.response_id}
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
        select(func.count(SurveyResponse.id)).where(
            and_(
                SurveyResponse.survey_ref_id == survey.id,
                SurveyResponse.is_deleted == False,
            )
        )
    ).one()

    complete_responses = session.exec(
        select(func.count(SurveyResponse.id)).where(
            and_(
                SurveyResponse.survey_ref_id == survey.id,
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
        .where(SurveyQuestion.survey_ref_id == survey.id)
        .order_by(SurveyQuestion.order_index)
    ).all()

    # Fetch all valid responses for this survey once
    responses = session.exec(
        select(SurveyResponse).where(
            and_(
                SurveyResponse.survey_ref_id == survey.id,
                SurveyResponse.is_deleted.is_(False),
            )
        )
    ).all()

    question_summaries = []

    for sq in sq_rows:
        question = session.exec(
            select(Question).where(Question.id == sq.question_ref_id)
        ).first()
        if not question:
            continue

        q_id_str = question.question_id
        answers = []
        for r in responses:
            if not r.answers:
                continue
            for a in r.answers:
                if a.get("question_id") == q_id_str:
                    answers.append(a)

        total_answers = len(answers)
        summary: dict = {
            "question_id": question.question_id,
            "question_text": question.question_text,
            "question_type": question.question_type.value,
            "total_answers": total_answers,
        }

        qtype = question.question_type

        if qtype == QuestionType.MULTIPLE_CHOICE:
            counts = Counter(a.get("answer_choice") for a in answers if a.get("answer_choice"))
            summary["choice_distribution"] = dict(counts)

        elif qtype == QuestionType.MULTI_SELECT:
            import json as _json

            all_choices = []
            for a in answers:
                val = a.get("answer_choices")
                if val:
                    try:
                        # Sometimes frontend sends JSON string, sometimes parsed list
                        choices = _json.loads(val) if isinstance(val, str) else val
                        if isinstance(choices, list):
                            all_choices.extend(choices)
                    except Exception:
                        pass
            summary["choice_distribution"] = dict(Counter(all_choices))

        elif qtype == QuestionType.SCALE:
            values = [a.get("answer_scale") for a in answers if a.get("answer_scale") is not None]
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
            values = [a.get("answer_number") for a in answers if a.get("answer_number") is not None]
            if values:
                summary["average"] = round(mean(values), 2)
                summary["min_value"] = min(values)
                summary["max_value"] = max(values)
                summary["median_value"] = median(values)

        elif qtype == QuestionType.YES_NO:
            yes = sum(1 for a in answers if a.get("answer_bool") is True)
            no = sum(1 for a in answers if a.get("answer_bool") is False)
            summary["yes_count"] = yes
            summary["no_count"] = no

        elif qtype in (QuestionType.TEXT, QuestionType.DATE):
            unique_samples = list(
                dict.fromkeys(
                    str(a.get("answer_text") or a.get("answer_date"))
                    for a in answers
                    if (a.get("answer_text") or a.get("answer_date")) is not None
                )
            )
            summary["sample_answers"] = unique_samples[:10]

        question_summaries.append(summary)

    return {
        "survey_id": survey.survey_id,
        "title": survey.title,
        "status": survey.status.value if hasattr(survey.status, "value") else survey.status,
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
                SurveyResponse.survey_ref_id == survey.id,
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
        # Resolve alumni info if response is not anonymous
        alumni_id = None
        alumni_name = "Anonymous"
        if resp.alumni_ref_id and not survey.is_anonymous:
            alumni = session.exec(
                select(Alumni).where(Alumni.id == resp.alumni_ref_id)
            ).first()
            if alumni:
                alumni_id = alumni.alumni_id
                alumni_name = f"{alumni.first_name} {alumni.last_name}"

        # Fetch answers
        from datetime import datetime
        answers = resp.answers or []

        answer_list = []
        for ans in answers:
            # If answer_date string is present, try to format it, otherwise leave as is
            ans_date = ans.get("answer_date")
            if ans_date and isinstance(ans_date, str):
                try:
                    dt = datetime.fromisoformat(ans_date)
                    ans_date = _fmt(dt)
                except ValueError:
                    pass

            answer_list.append(
                {
                    "question_id": ans.get("question_id"),
                    "question_text": ans.get("question_text"),
                    "question_type": ans.get("question_type"),
                    "answer_text": ans.get("answer_text"),
                    "answer_choice": ans.get("answer_choice"),
                    "answer_choices": ans.get("answer_choices"),
                    "answer_scale": ans.get("answer_scale"),
                    "answer_number": ans.get("answer_number"),
                    "answer_date": ans_date,
                    "answer_bool": ans.get("answer_bool"),
                }
            )

        output_responses.append(
            {
                "response_id": resp.response_id,
                "submitted_at": _fmt(resp.submitted_at),
                "is_complete": resp.is_complete,
                "alumni_id": alumni_id,
                "alumni_name": alumni_name,
                "answers": answer_list,
            }
        )

    return {
        "survey_id": survey.survey_id,
        "title": survey.title,
        "total_responses": len(output_responses),
        "responses": output_responses,
    }
