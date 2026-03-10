"""
DB query functions for core survey management (CRUD, status, lookups).
"""

import uuid
from sqlmodel import Session, select, func, and_, or_
from models.surveys import Survey, SurveyQuestion
from schemas.surveys import (
    SurveyCreate,
    SurveyUpdate,
    SurveyStatus,
)
from utils.timezone import get_current_time_gmt8
from services.queries.transaction_logs_queries import create_transaction_log


# ---------------------------------------------------------------------------
# ID generator
# ---------------------------------------------------------------------------


def generate_survey_id(session: Session) -> str:
    last_id = session.exec(
        select(Survey.survey_id).order_by(Survey.survey_id.desc()).limit(1)
    ).first()
    next_num = int(last_id.split("-")[1]) + 1 if last_id else 1
    return f"SRVY-{next_num:06d}"


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


def create_survey(
    session: Session,
    data: SurveyCreate,
    performed_by: str | None = None,
) -> Survey:
    survey = Survey(
        **data.dict(),
        survey_code=uuid.uuid4(),
        survey_id=generate_survey_id(session),
        status=SurveyStatus.DRAFT,
        created_at=get_current_time_gmt8(),
        updated_at=get_current_time_gmt8(),
    )
    session.add(survey)
    create_transaction_log(
        session,
        tl_name=f"CREATED survey {survey.survey_id}",
        after=survey,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(survey)
    return survey


def update_survey(
    session: Session,
    survey: Survey,
    data: SurveyUpdate,
    performed_by: str | None = None,
) -> Survey:
    before_state = survey.model_dump(mode="json")
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(survey, key, value)
    survey.updated_at = get_current_time_gmt8()
    session.add(survey)
    create_transaction_log(
        session,
        tl_name=f"UPDATED survey {survey.survey_id}",
        before=before_state,
        after=survey,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(survey)
    return survey


def soft_delete_survey(
    session: Session,
    survey: Survey,
    performed_by: str | None = None,
) -> None:
    survey.is_deleted = True
    survey.deleted_at = get_current_time_gmt8()
    session.add(survey)
    create_transaction_log(
        session,
        tl_name=f"DELETED survey {survey.survey_id}",
        after=survey,
        performed_by=performed_by,
    )
    session.commit()


def restore_survey(
    session: Session,
    survey: Survey,
    performed_by: str | None = None,
) -> Survey:
    survey.is_deleted = False
    survey.deleted_at = None
    session.add(survey)
    create_transaction_log(
        session,
        tl_name=f"RESTORED survey {survey.survey_id}",
        after=survey,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(survey)
    return survey


def set_survey_status(
    session: Session,
    survey: Survey,
    status: SurveyStatus,
    performed_by: str | None = None,
) -> Survey:
    before_state = {"status": survey.status.value if hasattr(survey.status, "value") else survey.status}
    survey.status = status
    survey.updated_at = get_current_time_gmt8()
    session.add(survey)
    create_transaction_log(
        session,
        tl_name=f"UPDATED survey status {survey.survey_id}",
        before=before_state,
        after={"status": status.value if hasattr(status, "value") else status},
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(survey)
    return survey
