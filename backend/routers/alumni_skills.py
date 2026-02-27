from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from schemas.alumni_skills import (
    AlumniSkillsCreate, AlumniSkillsUpdate, AlumniSkillsPublic,
    AlumniSkillsBatchCreate, AlumniSkillsBatchUpdate,
)
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from utils.logging import log_error, log_integrity_error
from services.queries.alumni_skills_queries import (
    get_alumni_skills_by_alumni_id,
    create_alumni_skills,
    update_alumni_skills,
    delete_alumni_skills,
    batch_create_alumni_skills,
    batch_update_alumni_skills,
)

router = APIRouter(prefix="/alumni-skills", tags=["alumni-skills"])


# ---------------------------------------------------------------------------
# Batch endpoints (before /{alumni_id})
# ---------------------------------------------------------------------------

@router.post("/batch")
def batch_create_alumni_skills_route(
    batch_data: AlumniSkillsBatchCreate,
    session: Session = Depends(get_session),
):
    """Batch create alumni skill records"""
    response = batch_create_alumni_skills(session, batch_data.items)
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.ALUMNI_SKILLS_BATCH_CREATED.value,
        message=f"Batch create completed: {response.successful} successful, {response.failed} failed",
        data=response,
    )


@router.patch("/batch")
def batch_update_alumni_skills_route(
    batch_data: AlumniSkillsBatchUpdate,
    session: Session = Depends(get_session),
):
    """Batch update alumni skill records"""
    response = batch_update_alumni_skills(session, batch_data.items)
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.ALUMNI_SKILLS_BATCH_UPDATED.value,
        message=f"Batch update completed: {response.successful} successful, {response.failed} failed",
        data=response,
    )


# ---------------------------------------------------------------------------
# Single-record endpoints
# ---------------------------------------------------------------------------

@router.post("")
def create_alumni_skills_route(
    data: AlumniSkillsCreate,
    session: Session = Depends(get_session),
):
    """Create a skills record for an alumni"""
    try:
        skills = create_alumni_skills(session, data)
        return StandardResponse(
            success=True,
            code=SuccessCode.ALUMNI_SKILLS_CREATED.value,
            message="Alumni skills record created successfully",
            data=AlumniSkillsPublic.model_validate(skills),
        )
    except ValueError as e:
        msg = str(e)
        if msg.startswith("ALUMNI_NOT_FOUND:"):
            code, detail = ErrorCode.ALUMNI_NOT_FOUND.value, "Alumni not found"
            log_error("alumni_skills", "create", code, detail)
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(success=False, code=code, message=detail).model_dump(mode="json"),
            )
        if msg.startswith("ALUMNI_SKILLS_ALREADY_EXISTS:"):
            code, detail = ErrorCode.ALUMNI_ALREADY_HAS_SKILLS_RECORD.value, "This alumni already has a skills record"
            log_error("alumni_skills", "create", code, detail)
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(success=False, code=code, message=detail).model_dump(mode="json"),
            )
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(success=False, code=ErrorCode.INVALID_INPUT.value, message=msg).model_dump(mode="json"),
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "alumni_skills_alumni_code_key" in error_str:
            code, msg = ErrorCode.ALUMNI_ALREADY_HAS_SKILLS_RECORD.value, "This alumni already has a skills record"
        elif "alumni_code" in error_str:
            code, msg = ErrorCode.ALUMNI_NOT_FOUND.value, "Specified alumni does not exist"
        else:
            code, msg = ErrorCode.INVALID_INPUT.value, "Skills record creation failed"
        log_integrity_error("alumni_skills", "create", code, msg, str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode="json"),
        )


@router.get("/{alumni_id}")
def get_alumni_skills_route(
    alumni_id: str,
    session: Session = Depends(get_session),
):
    """Get the skills record for a specific alumni"""
    skills = get_alumni_skills_by_alumni_id(session, alumni_id)
    if not skills:
        log_error("alumni_skills", "get", ErrorCode.ALUMNI_SKILLS_NOT_FOUND.value, f"Skills record for alumni {alumni_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_SKILLS_NOT_FOUND.value,
                message="Skills record not found for this alumni",
            ).model_dump(mode="json"),
        )
    return StandardResponse(
        success=True,
        code=SuccessCode.ALUMNI_SKILLS_RETRIEVED.value,
        message=f"Skills record for alumni '{alumni_id.upper()}' retrieved successfully",
        data=AlumniSkillsPublic.model_validate(skills),
    )


@router.patch("/{alumni_id}")
def update_alumni_skills_route(
    alumni_id: str,
    data: AlumniSkillsUpdate,
    session: Session = Depends(get_session),
):
    """Update the skills record for a specific alumni"""
    skills = get_alumni_skills_by_alumni_id(session, alumni_id)
    if not skills:
        log_error("alumni_skills", "update", ErrorCode.ALUMNI_SKILLS_NOT_FOUND.value, f"Skills record for alumni {alumni_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_SKILLS_NOT_FOUND.value,
                message="Skills record not found for this alumni",
            ).model_dump(mode="json"),
        )
    try:
        updated = update_alumni_skills(session, skills, data)
        return StandardResponse(
            success=True,
            code=SuccessCode.ALUMNI_SKILLS_UPDATED.value,
            message="Alumni skills record updated successfully",
            data=AlumniSkillsPublic.model_validate(updated),
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("alumni_skills", "update", ErrorCode.INVALID_INPUT.value, "Update failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value,
                message="Update failed: Constraint violation or invalid operation",
            ).model_dump(mode="json"),
        )


@router.delete("/{alumni_id}")
def delete_alumni_skills_route(
    alumni_id: str,
    session: Session = Depends(get_session),
):
    """Delete (hard delete) the skills record for a specific alumni"""
    skills = get_alumni_skills_by_alumni_id(session, alumni_id)
    if not skills:
        log_error("alumni_skills", "delete", ErrorCode.ALUMNI_SKILLS_NOT_FOUND.value, f"Skills record for alumni {alumni_id} not found")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_SKILLS_NOT_FOUND.value,
                message="Skills record not found for this alumni",
            ).model_dump(mode="json"),
        )
    try:
        delete_alumni_skills(session, skills)
        return StandardResponse(
            success=True,
            code=SuccessCode.ALUMNI_SKILLS_DELETED.value,
            message=f"Skills record for alumni '{alumni_id.upper()}' deleted successfully",
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("alumni_skills", "delete", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_INPUT.value,
                message="Delete failed: Constraint violation or invalid operation",
            ).model_dump(mode="json"),
        )
