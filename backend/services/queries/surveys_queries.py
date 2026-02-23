"""
DB query functions for surveys domain.
"""
import uuid
from typing import Optional, List
from sqlmodel import Session, select, func, and_, or_
from models.surveys import (
    Survey, SurveyQuestion, SurveyResponse, SurveyAnswer,
    SurveyInvitation, SurveyDistributionConfig
)
from models.questions import Question
from schemas.surveys import (
    SurveyCreate, SurveyUpdate, SurveyPublic,
    SurveyQuestionCreate, SurveyQuestionWithDetails,
    SurveyDistributionConfigCreateRequest, SurveyDistributionConfigPublic,
    SurveyStatus, DistributionStatus,
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
    next_num = int(last_id.split('-')[1]) + 1 if last_id else 1
    return f"SRVY-{next_num:06d}"


def generate_response_id(session: Session) -> str:
    last_id = session.exec(
        select(SurveyResponse.response_id).order_by(SurveyResponse.response_id.desc()).limit(1)
    ).first()
    next_num = int(last_id.split('-')[1]) + 1 if last_id else 1
    return f"SRSP-{next_num:06d}"


def generate_invitation_id(session: Session) -> str:
    last_id = session.exec(
        select(SurveyInvitation.invitation_id).order_by(SurveyInvitation.invitation_id.desc()).limit(1)
    ).first()
    next_num = int(last_id.split('-')[1]) + 1 if last_id else 1
    return f"SINV-{next_num:06d}"


def generate_distribution_id(session: Session) -> str:
    last_id = session.exec(
        select(SurveyDistributionConfig.distribution_id)
        .order_by(SurveyDistributionConfig.distribution_id.desc()).limit(1)
    ).first()
    next_num = int(last_id.split('-')[1]) + 1 if last_id else 1
    return f"SDST-{next_num:06d}"


# ---------------------------------------------------------------------------
# Survey lookups
# ---------------------------------------------------------------------------

def get_survey_by_id(session: Session, survey_id: str) -> Survey | None:
    return session.exec(
        select(Survey).where(and_(Survey.survey_id == survey_id, Survey.is_deleted == False))
    ).first()


def get_deleted_survey_by_id(session: Session, survey_id: str) -> Survey | None:
    return session.exec(
        select(Survey).where(and_(Survey.survey_id == survey_id, Survey.is_deleted == True))
    ).first()


def check_duplicate_survey_title(session: Session, title: str) -> Survey | None:
    return session.exec(
        select(Survey).where(
            and_(func.lower(Survey.title) == title.lower(), Survey.is_deleted == False)
        )
    ).first()


def get_survey_question_count(session: Session, survey_code: uuid.UUID) -> int:
    return session.exec(
        select(func.count(SurveyQuestion.survey_question_code))
        .where(SurveyQuestion.survey_code == survey_code)
    ).one()


# ---------------------------------------------------------------------------
# Survey CRUD
# ---------------------------------------------------------------------------

def list_surveys(
    session: Session, skip: int, limit: int,
    search: str | None, status: str | None
) -> tuple[list[Survey], int]:
    stmt = select(Survey).where(Survey.is_deleted == False)
    count_stmt = select(func.count(Survey.survey_code)).where(Survey.is_deleted == False)

    if search:
        stmt = stmt.where(or_(Survey.title.contains(search), Survey.description.contains(search)))
        count_stmt = count_stmt.where(or_(Survey.title.contains(search), Survey.description.contains(search)))
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
        updated_at=get_current_time_gmt8()
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
    sq_rows = session.exec(
        select(SurveyQuestion)
        .where(SurveyQuestion.survey_code == survey_code)
        .order_by(SurveyQuestion.order_index)
    ).all()
    result = []
    for sq in sq_rows:
        question = session.exec(
            select(Question).where(Question.question_code == sq.question_code)
        ).first()
        if question:
            result.append(SurveyQuestionWithDetails(
                order_index=sq.order_index,
                question=QuestionPublic.model_validate(question)
            ))
    return result


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
            select(func.max(SurveyQuestion.order_index))
            .where(SurveyQuestion.survey_code == survey.survey_code)
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
        order_index=sq.order_index,
        question=QuestionPublic.model_validate(question)
    )


def add_questions_batch(
    session: Session, survey: Survey, items: list[SurveyQuestionCreate]
) -> tuple[list[SurveyQuestionWithDetails], list[dict]]:
    max_order = session.exec(
        select(func.max(SurveyQuestion.order_index))
        .where(SurveyQuestion.survey_code == survey.survey_code)
    ).one() or 0

    added, failed = [], []
    for idx, item in enumerate(items, start=1):
        try:
            question = session.exec(
                select(Question).where(
                    and_(Question.question_id == item.question_id, Question.is_deleted == False)
                )
            ).first()
            if not question:
                failed.append({"index": idx, "question_id": item.question_id, "error": "QUESTION_NOT_FOUND"})
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
                failed.append({"index": idx, "question_id": item.question_id, "error": "Question already in survey"})
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
            added.append(SurveyQuestionWithDetails(
                order_index=sq.order_index,
                question=QuestionPublic.model_validate(question)
            ))
        except Exception as e:
            failed.append({"index": idx, "question_id": item.question_id, "error": str(e)})

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
        select(SurveyQuestion).where(
            and_(
                SurveyQuestion.survey_code == survey.survey_code,
                SurveyQuestion.order_index > removed_order,
            )
        ).order_by(SurveyQuestion.order_index)
    ).all()
    for remainder in lower:
        remainder.order_index -= 1
        session.add(remainder)

    session.commit()


def reorder_survey_questions(
    session: Session, survey: Survey, order_map: dict
) -> None:
    for sq_code_str, order_index in order_map.items():
        sq = session.exec(
            select(SurveyQuestion).where(
                SurveyQuestion.survey_question_code == uuid.UUID(sq_code_str)
            )
        ).first()
        if sq and sq.survey_code == survey.survey_code:
            sq.order_index = order_index
            session.add(sq)
    session.commit()


# ---------------------------------------------------------------------------
# Distribution config
# ---------------------------------------------------------------------------

def get_distribution_config(session: Session, survey_code: uuid.UUID) -> SurveyDistributionConfig | None:
    return session.exec(
        select(SurveyDistributionConfig)
        .where(SurveyDistributionConfig.survey_code == survey_code)
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
    session: Session, config: SurveyDistributionConfig, data: SurveyDistributionConfigCreateRequest
) -> SurveyDistributionConfig:
    config.target_group = data.target_group
    config.filters = data.filters
    config.scheduled_send_at = data.scheduled_send_at
    config.updated_at = get_current_time_gmt8()
    session.add(config)
    session.commit()
    session.refresh(config)
    return config
