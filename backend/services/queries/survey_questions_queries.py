"""
DB query functions for survey questions management.
"""

import uuid
from sqlmodel import Session, select, func, and_
from models.surveys import Survey, SurveyQuestion
from models.questions import Question
from schemas.surveys import SurveyQuestionCreate, SurveyQuestionWithDetails
from schemas.questions import QuestionPublic
from services.queries.transaction_logs_queries import create_transaction_log


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
    session: Session,
    survey: Survey,
    data: SurveyQuestionCreate,
    performed_by: str | None = None,
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
    create_transaction_log(
        session,
        tl_name=f"ADDED question to survey {survey.survey_id}",
        after={"survey_id": survey.survey_id, "question_id": data.question_id},
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(sq)
    return SurveyQuestionWithDetails(
        order_index=sq.order_index, question=QuestionPublic.model_validate(question)
    )


def add_questions_batch(
    session: Session,
    survey: Survey,
    items: list[SurveyQuestionCreate],
    performed_by: str | None = None,
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
    if added:
        create_transaction_log(
            session,
            tl_name=f"BATCH ADDED questions to survey {survey.survey_id}",
            after={"survey_id": survey.survey_id, "added": len(added), "failed": len(failed)},
            performed_by=performed_by,
        )
        session.commit()
    return added, failed


def remove_question_from_survey(
    session: Session,
    survey: Survey,
    question_id: str,
    performed_by: str | None = None,
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

    create_transaction_log(
        session,
        tl_name=f"REMOVED question from survey {survey.survey_id}",
        after={"survey_id": survey.survey_id, "question_id": question_id},
        performed_by=performed_by,
    )
    session.commit()


def reorder_survey_questions(
    session: Session,
    survey: Survey,
    order_map: dict,
    performed_by: str | None = None,
) -> None:
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
    create_transaction_log(
        session,
        tl_name=f"REORDERED survey questions {survey.survey_id}",
        after={"survey_id": survey.survey_id, "order_map": order_map},
        performed_by=performed_by,
    )
    session.commit()
