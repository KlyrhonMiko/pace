"""
DB query functions for core survey management (CRUD, status, lookups).
"""
from sqlmodel import Session, select, func, and_, or_
from models.surveys import Survey, SurveyQuestion
from schemas.surveys import (
    SurveyCreate,
    SurveyUpdate,
    SurveyStatus,
)
from services.queries.audit import stamp_create, stamp_restore, stamp_soft_delete, stamp_update
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


def get_survey_question_count(session: Session, survey_ref_id) -> int:
    return session.exec(
        select(func.count(SurveyQuestion.id)).where(
            (SurveyQuestion.survey_ref_id == survey_ref_id)
            & (SurveyQuestion.is_deleted == False)
        )
    ).one()


def get_survey_question_counts_batch(
    session: Session, survey_ref_ids: list
) -> dict:
    """Fetch question counts for multiple surveys in one grouped query."""
    if not survey_ref_ids:
        return {}
    rows = session.exec(
        select(
            SurveyQuestion.survey_ref_id, func.count(SurveyQuestion.id)
        )
        .where(
            (SurveyQuestion.survey_ref_id.in_(survey_ref_ids))
            & (SurveyQuestion.is_deleted == False)
        )
        .group_by(SurveyQuestion.survey_ref_id)
    ).all()
    counts = {row[0]: row[1] for row in rows}
    # Surveys with 0 questions won't appear in the grouped result
    return {code: counts.get(code, 0) for code in survey_ref_ids}


# ---------------------------------------------------------------------------
# Survey CRUD
# ---------------------------------------------------------------------------


def list_surveys(
    session: Session, skip: int, limit: int, search: str | None, status: str | None
) -> tuple[list[Survey], int]:
    stmt = select(Survey).where(Survey.is_deleted == False)
    count_stmt = select(func.count(Survey.id)).where(
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
        survey_id=generate_survey_id(session),
        status=SurveyStatus.DRAFT,
    )
    stamp_create(survey, performed_by)
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
    stamp_update(survey)
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
    stamp_soft_delete(survey, performed_by)
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
    stamp_restore(survey)
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
    stamp_update(survey)
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
