from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.alumni import AlumniUpdate, AlumniPublic
from schemas.composite import (
    CompleteAlumniRegistration,
    BatchAlumniRegister, BatchAlumniUpdate, BatchAlumniDelete, BatchAlumniRestore,
)
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.auth import CurrentUser
from models.users import UserType
from models.pagination import PaginatedResponse, PaginationMetadata
from utils.rbac import require_admin, require_authenticated, require_staff_or_admin
from utils.logging import log_error, log_integrity_error
from services.queries.alumni_queries import (
    get_alumni_by_id, get_alumni_by_id_any,
    register_complete_alumni, update_alumni, soft_delete_alumni, restore_alumni,
    get_all_alumni, build_full_profile,
    batch_register_alumni, batch_update_alumni, batch_delete_alumni, batch_restore_alumni,
)

router = APIRouter(prefix="/alumni", tags=["alumni"])
ALUMNI_CACHE_NAMESPACE = "alumni"
ALUMNI_LIST_TTL = 300
ALUMNI_DETAIL_TTL = 300


def _ensure_alumni_owner_or_staff_plus(current_user: CurrentUser, alumni_user_code: str | None) -> None:
    if current_user.user_type in {UserType.STAFF.value, UserType.ADMIN.value}:
        return

    if not current_user.user_code or not alumni_user_code or str(current_user.user_code) != str(alumni_user_code):
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="You are only allowed to access your own alumni profile",
            ).model_dump(mode="json"),
        )


# ---------------------------------------------------------------------------
# Registration endpoints
# ---------------------------------------------------------------------------

@router.post("/register")
def register_complete_alumni_route(
    data: CompleteAlumniRegistration,
    session: Session = Depends(get_session)
):
    """
    Create a complete alumni profile in one transaction:
    1. Create User account
    2. Create Alumni profile (linked to User)
    """
    try:
        new_user, new_alumni = register_complete_alumni(
            session,
            username=data.username,
            email=data.email,
            password=data.password,
            last_name=data.last_name,
            first_name=data.first_name,
            middle_name=data.middle_name,
            gender=data.gender,
            age=data.age,
            birthdate=data.birthdate,
            consent_for_survey_ml=data.consent_for_survey_ml,
        )
        invalidate_cache_namespaces(ALUMNI_CACHE_NAMESPACE, "users")
        return StandardResponse(
            success=True,
            code=SuccessCode.ALUMNI_CREATED.value,
            message="Alumni profile created successfully",
            data={"user_id": new_user.user_id, "alumni_id": new_alumni.alumni_id}
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_users_email" in error_str or "users_email_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_EMAIL.value, "Email already in use"
        elif "ix_users_username" in error_str or "users_username_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_USERNAME.value, "Username already in use"
        elif "ix_alumni_alumni_id" in error_str or "alumni_alumni_id_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_ALUMNI_ID.value, "Alumni ID already in use"
        else:
            code, msg = ErrorCode.REGISTRATION_FAILED.value, "Registration failed"
        log_integrity_error("alumni", "register_complete_alumni", code, msg, str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode='json'))
    except Exception as e:
        session.rollback()
        log_error("alumni", "register_complete_alumni", ErrorCode.REGISTRATION_FAILED.value, f"Unexpected error: {str(e)}", e)
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.REGISTRATION_FAILED.value, message="Registration failed"
        ).model_dump(mode='json'))


@router.post("/batch/register")
def batch_register_alumni_route(
    batch_data: BatchAlumniRegister,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch create alumni profiles (creates both User and Alumni for each item)"""
    response = batch_register_alumni(
        session,
        batch_data.items,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(ALUMNI_CACHE_NAMESPACE, "users")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.ALUMNI_BATCH_REGISTERED.value,
        message=f"Batch registration completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


# ---------------------------------------------------------------------------
# Batch CRUD endpoints (before /{alumni_id})
# ---------------------------------------------------------------------------

@router.patch("/batch")
def batch_update_alumni_route(
    batch_data: BatchAlumniUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch update alumni records"""
    response = batch_update_alumni(
        session,
        batch_data.items,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(ALUMNI_CACHE_NAMESPACE)
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.ALUMNI_BATCH_UPDATED.value,
        message=f"Batch update completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.delete("/batch")
def batch_delete_alumni_route(
    batch_data: BatchAlumniDelete,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch delete alumni records"""
    response = batch_delete_alumni(
        session,
        batch_data.ids,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(ALUMNI_CACHE_NAMESPACE)
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.ALUMNI_BATCH_DELETED.value,
        message=f"Batch delete completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.post("/batch/restore")
def batch_restore_alumni_route(
    data: BatchAlumniRestore,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Restore multiple soft-deleted alumni"""
    response = batch_restore_alumni(
        session,
        data.ids,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(ALUMNI_CACHE_NAMESPACE)
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.ALUMNI_BATCH_RESTORED.value,
        message=f"Restore operation completed: {response.successful} succeeded, {response.failed} failed",
        data=response
    )


# ---------------------------------------------------------------------------
# List endpoints
# ---------------------------------------------------------------------------

@router.get("")
def get_all_alumni_route(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None, description="Search by first name or last name"),
    gender: str = Query(None, description="Filter by gender (M, F, Other)"),
    include_deleted: bool = Query(False),
    sort_by: str = Query("alumni_id"),
    sort_order: str = Query("asc"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Get all alumni records with filtering, searching, and sorting"""
    cache_key = generate_cache_key(
        f"{ALUMNI_CACHE_NAMESPACE}:list",
        user_type=current_user.user_type,
        limit=limit,
        offset=offset,
        search=search,
        gender=gender,
        include_deleted=include_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_alumni_list_response(
            session, limit, offset, search, gender, include_deleted, sort_by, sort_order
        ),
        ttl=ALUMNI_LIST_TTL,
    )


@router.get("/deleted/list")
def get_deleted_alumni(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    sort_by: str = Query("deleted_at"),
    sort_order: str = Query("desc"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get all soft-deleted alumni"""
    cache_key = generate_cache_key(
        f"{ALUMNI_CACHE_NAMESPACE}:deleted",
        limit=limit,
        offset=offset,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_deleted_alumni_response(session, limit, offset, search, sort_by, sort_order),
        ttl=ALUMNI_LIST_TTL,
    )


@router.get("/all/list")
def get_all_alumni_including_deleted(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    gender: str = Query(None),
    sort_by: str = Query("alumni_id"),
    sort_order: str = Query("asc"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get all alumni including soft-deleted"""
    cache_key = generate_cache_key(
        f"{ALUMNI_CACHE_NAMESPACE}:all",
        limit=limit,
        offset=offset,
        search=search,
        gender=gender,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_all_alumni_response(session, limit, offset, search, gender, sort_by, sort_order),
        ttl=ALUMNI_LIST_TTL,
    )


@router.get("/me", response_model=StandardResponse)
def get_my_alumni_profile(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get the current authenticated user's alumni profile"""
    if current_user.user_type != UserType.USER.value:
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="Only alumni can access this endpoint"
            ).model_dump(mode='json')
        )

    if not current_user.user_code:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni profile link not found"
            ).model_dump(mode='json')
        )

    # Use the new query service
    from services.queries.alumni_queries import get_alumni_by_user_code
    alumni = get_alumni_by_user_code(session, str(current_user.user_code))
    
    if not alumni:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ALUMNI_NOT_FOUND.value,
                message="Alumni profile not found"
            ).model_dump(mode='json')
        )

    return StandardResponse(
        success=True,
        code=SuccessCode.ALUMNI_RETRIEVED.value,
        message=f"Alumni {alumni.alumni_id} retrieved successfully",
        data=build_full_profile(session, alumni)
    )


# ---------------------------------------------------------------------------
# Single-record endpoints
# ---------------------------------------------------------------------------

@router.get("/{alumni_id}")
def get_alumni(
    alumni_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get specific alumni by alumni_id with full profile"""
    alumni = get_alumni_by_id(session, alumni_id)
    if not alumni:
        log_error("alumni", "get_alumni", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {alumni_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.ALUMNI_NOT_FOUND.value, message="Alumni not found"
        ).model_dump(mode='json'))

    _ensure_alumni_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

    cache_key = generate_cache_key(
        f"{ALUMNI_CACHE_NAMESPACE}:detail",
        alumni_id=alumni_id,
        user_type=current_user.user_type,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_alumni_detail_response(session, alumni_id),
        ttl=ALUMNI_DETAIL_TTL,
    )


@router.patch("/{alumni_id}")
def update_alumni_route(
    alumni_id: str,
    alumni_data: AlumniUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Update alumni information"""
    alumni = get_alumni_by_id_any(session, alumni_id)
    if not alumni:
        log_error("alumni", "update_alumni", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {alumni_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.ALUMNI_NOT_FOUND.value, message="Alumni not found"
        ).model_dump(mode='json'))

    _ensure_alumni_owner_or_staff_plus(current_user, str(alumni.user_code) if alumni.user_code else None)

    try:
        updated = update_alumni(
            session,
            alumni,
            alumni_data,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(ALUMNI_CACHE_NAMESPACE)
        return StandardResponse(
            success=True, code=SuccessCode.ALUMNI_UPDATED.value,
            message=f"Alumni {alumni_id} updated successfully",
            data=build_full_profile(session, updated)
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("alumni", "update_alumni", ErrorCode.INVALID_INPUT.value, "Update failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Update failed: Invalid input or duplicate entry"
        ).model_dump(mode='json'))


@router.delete("/{alumni_id}")
def delete_alumni(
    alumni_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Delete an alumni record"""
    alumni = get_alumni_by_id_any(session, alumni_id)
    if not alumni:
        log_error("alumni", "delete_alumni", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {alumni_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.ALUMNI_NOT_FOUND.value, message="Alumni not found"
        ).model_dump(mode='json'))

    if alumni.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.ALREADY_DELETED.value,
            message="Alumni is already deleted, cannot delete again"
        ).model_dump(mode='json'))

    try:
        soft_delete_alumni(session, alumni, performed_by=current_user.user_code)
        invalidate_cache_namespaces(ALUMNI_CACHE_NAMESPACE)
        return StandardResponse(
            success=True, code=SuccessCode.ALUMNI_DELETED.value,
            message=f"Alumni {alumni_id} deleted successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("alumni", "delete_alumni", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Delete failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))


@router.post("/{alumni_id}/restore")
def restore_alumni_route(
    alumni_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Restore a soft-deleted alumni record"""
    alumni = get_alumni_by_id_any(session, alumni_id)
    if not alumni:
        log_error("alumni", "restore_alumni", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {alumni_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.ALUMNI_NOT_FOUND.value, message="Alumni not found"
        ).model_dump(mode='json'))

    if not alumni.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Alumni is not deleted, cannot restore"
        ).model_dump(mode='json'))

    try:
        restore_alumni(session, alumni, performed_by=current_user.user_code)
        invalidate_cache_namespaces(ALUMNI_CACHE_NAMESPACE)
        return StandardResponse(
            success=True, code=SuccessCode.ALUMNI_RESTORED.value,
            message=f"Alumni {alumni_id} restored successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("alumni", "restore_alumni", ErrorCode.INVALID_INPUT.value, "Restore failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Restore failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))


def _build_alumni_list_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    gender: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
) -> StandardResponse:
    alumni_list, total = get_all_alumni(
        session, limit, offset, search, gender, include_deleted, sort_by, sort_order
    )
    profiles = [build_full_profile(session, a) for a in alumni_list]
    returned = len(profiles)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return StandardResponse(
        success=True,
        code=SuccessCode.ALUMNI_LIST_RETRIEVED.value,
        message=f"Retrieved {returned} alumni",
        data={"alumni": profiles, "pagination": pagination}
    )


def _build_deleted_alumni_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    sort_by: str,
    sort_order: str,
) -> PaginatedResponse:
    alumni_list, total = get_all_alumni(
        session,
        limit,
        offset,
        search,
        None,
        include_deleted=True,
        sort_by=sort_by,
        sort_order=sort_order,
        deleted_only=True,
    )
    returned = len(alumni_list)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.ALUMNI_LIST_RETRIEVED.value,
        message=f"Retrieved {returned} deleted alumni",
        data=[AlumniPublic.model_validate(a) for a in alumni_list],
        pagination=pagination
    )


def _build_all_alumni_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    gender: str | None,
    sort_by: str,
    sort_order: str,
) -> PaginatedResponse:
    alumni_list, total = get_all_alumni(
        session, limit, offset, search, gender, include_deleted=True,
        sort_by=sort_by, sort_order=sort_order
    )
    returned = len(alumni_list)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.ALUMNI_LIST_RETRIEVED.value,
        message=f"Retrieved {returned} alumni (including deleted)",
        data=[AlumniPublic.model_validate(a) for a in alumni_list],
        pagination=pagination
    )


def _build_alumni_detail_response(session: Session, alumni_id: str) -> StandardResponse:
    alumni = get_alumni_by_id(session, alumni_id)
    if not alumni:
        log_error("alumni", "get_alumni", ErrorCode.ALUMNI_NOT_FOUND.value, f"Alumni {alumni_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.ALUMNI_NOT_FOUND.value, message="Alumni not found"
        ).model_dump(mode='json'))

    return StandardResponse(
        success=True, code=SuccessCode.ALUMNI_RETRIEVED.value,
        message=f"Alumni {alumni_id} retrieved successfully",
        data=build_full_profile(session, alumni)
    )
