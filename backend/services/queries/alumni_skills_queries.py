"""
DB query functions for alumni_skills domain.
"""
import uuid

from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

from models.alumni_skills import AlumniSkills
from models.alumni import Alumni
from schemas.alumni_skills import (
    AlumniSkillsCreate, AlumniSkillsUpdate, AlumniSkillsPublic,
    AlumniSkillsSafeDisplay,
    AlumniSkillsBatchCreateItem, AlumniSkillsBatchCreateResponse,
    AlumniSkillsBatchUpdateItem, AlumniSkillsBatchUpdateResult, AlumniSkillsBatchUpdateResponse,
)
from models.response_codes import ErrorCode, SuccessCode
from utils.timezone import get_current_time_gmt8
from services.queries.transaction_logs_queries import create_transaction_log


# ---------------------------------------------------------------------------
# Lookups
# ---------------------------------------------------------------------------

def _resolve_alumni(session: Session, alumni_id: str) -> Alumni | None:
    return session.exec(
        select(Alumni).where(
            (Alumni.alumni_id == alumni_id.upper()) &
            (Alumni.is_deleted == False)
        )
    ).first()


def _resolve_alumni_by_code(session: Session, alumni_code: uuid.UUID) -> Alumni | None:
    return session.exec(
        select(Alumni).where(
            (Alumni.alumni_code == alumni_code) &
            (Alumni.is_deleted == False)
        )
    ).first()


def _parse_alumni_code(identifier: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(identifier).strip())
    except (ValueError, AttributeError, TypeError):
        return None


def get_alumni_skills_by_alumni_id(session: Session, alumni_id: str) -> AlumniSkills | None:
    alumni_code = _parse_alumni_code(alumni_id)
    if alumni_code is not None:
        alumni = _resolve_alumni_by_code(session, alumni_code)
        if not alumni:
            return None
        return get_alumni_skills_by_alumni_code(session, alumni.alumni_code)

    alumni = _resolve_alumni(session, alumni_id)
    if not alumni:
        return None
    return get_alumni_skills_by_alumni_code(session, alumni.alumni_code)


def get_alumni_skills_by_alumni_code(session: Session, alumni_code) -> AlumniSkills | None:
    return session.exec(
        select(AlumniSkills).where(AlumniSkills.alumni_code == alumni_code)
    ).first()


# ---------------------------------------------------------------------------
# Single-record mutations
# ---------------------------------------------------------------------------

def create_alumni_skills(
    session: Session,
    data: AlumniSkillsCreate,
    performed_by: str | None = None,
) -> AlumniSkills:
    """Resolve alumni_id → alumni_code, then create the AlumniSkills record."""
    alumni = _resolve_alumni(session, data.alumni_id)
    if not alumni:
        raise ValueError(f"ALUMNI_NOT_FOUND:{data.alumni_id}")

    # Check for existing record (1-to-1 guard)
    existing = get_alumni_skills_by_alumni_code(session, alumni.alumni_code)
    if existing:
        raise ValueError(f"ALUMNI_SKILLS_ALREADY_EXISTS:{data.alumni_id}")

    skills = AlumniSkills(
        alumni_code=alumni.alumni_code,
        soft_skills_ave=data.soft_skills_ave,
        hard_skills_ave=data.hard_skills_ave,
        program_skills=data.program_skills,
    )
    session.add(skills)
    create_transaction_log(
        session,
        tl_name=f"CREATED alumni_skills {data.alumni_id}",
        after=skills,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(skills)
    return skills


def update_alumni_skills(
    session: Session,
    skills: AlumniSkills,
    data: AlumniSkillsUpdate,
    performed_by: str | None = None,
) -> AlumniSkills:
    if data.soft_skills_ave is not None:
        skills.soft_skills_ave = data.soft_skills_ave
    if data.hard_skills_ave is not None:
        skills.hard_skills_ave = data.hard_skills_ave
    if data.program_skills is not None:
        skills.program_skills = data.program_skills
    skills.updated_at = get_current_time_gmt8()
    session.add(skills)
    create_transaction_log(
        session,
        tl_name="UPDATED alumni_skills",
        after=skills,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(skills)
    return skills


def delete_alumni_skills(
    session: Session,
    skills: AlumniSkills,
    performed_by: str | None = None,
) -> None:
    create_transaction_log(
        session,
        tl_name="DELETED alumni_skills",
        before=skills,
        performed_by=performed_by,
    )
    session.delete(skills)
    session.commit()


# ---------------------------------------------------------------------------
# Batch operations
# ---------------------------------------------------------------------------

def batch_create_alumni_skills(
    session: Session,
    items: list[AlumniSkillsCreate],
    performed_by: str | None = None,
) -> AlumniSkillsBatchCreateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        safe = AlumniSkillsSafeDisplay(alumni_id=item.alumni_id)
        try:
            with session.begin_nested():
                alumni = _resolve_alumni(session, item.alumni_id)
                if not alumni:
                    results.append(AlumniSkillsBatchCreateItem(
                        index=index, item=safe, success=False,
                        code=ErrorCode.ALUMNI_NOT_FOUND.value,
                        message=f"Alumni '{item.alumni_id}' not found", data=None,
                    ))
                    failed_count += 1
                    continue

                existing = get_alumni_skills_by_alumni_code(session, alumni.alumni_code)
                if existing:
                    results.append(AlumniSkillsBatchCreateItem(
                        index=index, item=safe, success=False,
                        code=ErrorCode.ALUMNI_ALREADY_HAS_SKILLS_RECORD.value,
                        message=f"Alumni '{item.alumni_id}' already has a skills record", data=None,
                    ))
                    failed_count += 1
                    continue

                skills = AlumniSkills(
                    alumni_code=alumni.alumni_code,
                    soft_skills_ave=item.soft_skills_ave,
                    hard_skills_ave=item.hard_skills_ave,
                    program_skills=item.program_skills,
                )
                session.add(skills)
                session.flush()
                session.refresh(skills)

                results.append(AlumniSkillsBatchCreateItem(
                    index=index, item=safe, success=True,
                    code=SuccessCode.ALUMNI_SKILLS_CREATED.value,
                    message="Alumni skills record created successfully",
                    data=AlumniSkillsPublic.model_validate(skills),
                ))
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if "alumni_skills_alumni_code_key" in error_str:
                code = ErrorCode.ALUMNI_ALREADY_HAS_SKILLS_RECORD.value
                msg = "Alumni already has a skills record"
            else:
                code = ErrorCode.INVALID_INPUT.value
                msg = "Skills record creation failed due to constraint violation"
            results.append(AlumniSkillsBatchCreateItem(
                index=index, item=safe, success=False, code=code, message=msg, data=None
            ))
            failed_count += 1

        except ValueError as e:
            results.append(AlumniSkillsBatchCreateItem(
                index=index, item=safe, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e), data=None,
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH CREATED alumni_skills",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return AlumniSkillsBatchCreateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_update_alumni_skills(
    session: Session,
    items: list[AlumniSkillsBatchUpdateItem],
    performed_by: str | None = None,
) -> AlumniSkillsBatchUpdateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        safe = AlumniSkillsSafeDisplay(alumni_id=item.alumni_id)
        try:
            with session.begin_nested():
                skills = get_alumni_skills_by_alumni_id(session, item.alumni_id)
                if not skills:
                    results.append(AlumniSkillsBatchUpdateResult(
                        index=index, item=safe, success=False,
                        code=ErrorCode.ALUMNI_SKILLS_NOT_FOUND.value,
                        message=f"Skills record for alumni '{item.alumni_id}' not found", data=None,
                    ))
                    failed_count += 1
                    continue

                if item.soft_skills_ave is not None:
                    skills.soft_skills_ave = item.soft_skills_ave
                if item.hard_skills_ave is not None:
                    skills.hard_skills_ave = item.hard_skills_ave
                if item.program_skills is not None:
                    skills.program_skills = item.program_skills
                skills.updated_at = get_current_time_gmt8()

                session.add(skills)
                session.flush()
                session.refresh(skills)

                results.append(AlumniSkillsBatchUpdateResult(
                    index=index, item=safe, success=True,
                    code=SuccessCode.ALUMNI_SKILLS_UPDATED.value,
                    message="Alumni skills record updated successfully",
                    data=AlumniSkillsPublic.model_validate(skills),
                ))
                successful_count += 1

        except IntegrityError as e:
            results.append(AlumniSkillsBatchUpdateResult(
                index=index, item=safe, success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Skills record update failed due to constraint violation", data=None,
            ))
            failed_count += 1

        except ValueError as e:
            results.append(AlumniSkillsBatchUpdateResult(
                index=index, item=safe, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e), data=None,
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH UPDATED alumni_skills",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return AlumniSkillsBatchUpdateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )
