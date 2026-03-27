import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from models.alumni import Alumni
from models.auth import CurrentUser
from models.users import UserType
from schemas.alumni_skills import (
    AlumniSkillsCreate, AlumniSkillsUpdate, AlumniSkillsPublic,
    AlumniSkillsBatchCreate, AlumniSkillsBatchUpdate,
)
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from utils.rbac import require_admin, require_authenticated
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
ALUMNI_SKILLS_CACHE_NAMESPACE = "alumni_skills"
ALUMNI_SKILLS_DETAIL_TTL = 300
ALUMNI_SKILLS_DETAIL_CACHE_VERSION = "v3"


def _resolve_alumni_for_auth(session: Session, alumni_id: str) -> Alumni | None:
    alumni_code = None
    try:
        alumni_code = uuid.UUID(str(alumni_id).strip())
    except (ValueError, AttributeError, TypeError):
        alumni_code = None

    if alumni_code is not None:
        return session.exec(
            select(Alumni).where(
                (Alumni.alumni_code == alumni_code) & (Alumni.is_deleted == False)
            )
        ).first()

    return session.exec(
        select(Alumni).where(
            (Alumni.alumni_id == alumni_id.upper()) & (Alumni.is_deleted == False)
        )
    ).first()


def _ensure_alumni_owner_or_staff_plus(current_user: CurrentUser, alumni_user_code: str | None) -> None:
    if current_user.user_type in {UserType.STAFF.value, UserType.ADMIN.value}:
        return

    if not current_user.user_code or not alumni_user_code or str(current_user.user_code) != str(alumni_user_code):
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="You are only allowed to access your own alumni skills",
            ).model_dump(mode="json"),
        )


# ---------------------------------------------------------------------------
# Batch endpoints (before /{alumni_id})
# ---------------------------------------------------------------------------

@router.post("/batch")
def batch_create_alumni_skills_route(
    batch_data: AlumniSkillsBatchCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch create alumni skill records"""
    response = batch_create_alumni_skills(
        session,
        batch_data.items,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(ALUMNI_SKILLS_CACHE_NAMESPACE)
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
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch update alumni skill records"""
    response = batch_update_alumni_skills(
        session,
        batch_data.items,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(ALUMNI_SKILLS_CACHE_NAMESPACE)
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
    alumni = _resolve_alumni_for_auth(session, data.alumni_id)
    if not alumni:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni not found",
            ).model_dump(mode="json"),
        )

    # _ensure_alumni_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

    try:
        skills = create_alumni_skills(
            session,
            data,
            performed_by=None,
        )
        invalidate_cache_namespaces(ALUMNI_SKILLS_CACHE_NAMESPACE)
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
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get the skills record for a specific alumni"""
    alumni = _resolve_alumni_for_auth(session, alumni_id)
    if alumni:
        _ensure_alumni_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

    cache_key = generate_cache_key(
        f"{ALUMNI_SKILLS_CACHE_NAMESPACE}:detail:{ALUMNI_SKILLS_DETAIL_CACHE_VERSION}",
        alumni_id=alumni_id,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_alumni_skills_response(session, alumni_id),
        ttl=ALUMNI_SKILLS_DETAIL_TTL,
    )


@router.patch("/{alumni_id}")
def update_alumni_skills_route(
    alumni_id: str,
    data: AlumniSkillsUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Update the skills record for a specific alumni"""
    alumni = _resolve_alumni_for_auth(session, alumni_id)
    if alumni:
        _ensure_alumni_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

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
        updated = update_alumni_skills(
            session,
            skills,
            data,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(ALUMNI_SKILLS_CACHE_NAMESPACE)
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
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Delete (hard delete) the skills record for a specific alumni"""
    alumni = _resolve_alumni_for_auth(session, alumni_id)
    if alumni:
        _ensure_alumni_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

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
        delete_alumni_skills(session, skills, performed_by=current_user.user_code)
        invalidate_cache_namespaces(ALUMNI_SKILLS_CACHE_NAMESPACE)
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


def _build_alumni_skills_response(session: Session, alumni_id: str) -> StandardResponse:
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
