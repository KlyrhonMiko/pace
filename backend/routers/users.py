from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.users import (
    UserCreate, UserUpdate, UserPublic,
    UserBatchCreate, UserBatchUpdate, UserBatchDelete, UserBatchRestore,
)
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.auth import CurrentUser
from models.users import UserType
from models.pagination import PaginatedResponse, PaginationMetadata
from utils.auth import verify_password
from utils.rbac import require_admin, require_self_or_admin
from utils.logging import log_error, log_integrity_error, log_auth_error
from services.queries.users_queries import (
    get_user_by_id, get_user_by_id_any,
    create_user, update_user, soft_delete_user, restore_user,
    get_all_users,
    batch_create_users, batch_update_users, batch_delete_users, batch_restore_users,
)

router = APIRouter(prefix="/users", tags=["users"])
USERS_CACHE_NAMESPACE = "users"
USERS_LIST_TTL = 300
USERS_DETAIL_TTL = 300


# ---------------------------------------------------------------------------
# Batch endpoints (before /{user_id} to avoid conflicts)
# ---------------------------------------------------------------------------

@router.post("/batch")
def batch_create_users_route(
    batch_data: UserBatchCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch create users"""
    response = batch_create_users(
        session,
        batch_data.items,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(USERS_CACHE_NAMESPACE, "alumni")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.USERS_BATCH_CREATED.value,
        message=f"Batch create completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.patch("/batch")
def batch_update_users_route(
    batch_data: UserBatchUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch update users"""
    response = batch_update_users(
        session,
        batch_data.items,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(USERS_CACHE_NAMESPACE, "alumni")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.USERS_BATCH_UPDATED.value,
        message=f"Batch update completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.delete("/batch")
def batch_delete_users_route(
    batch_data: UserBatchDelete,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch delete users"""
    response = batch_delete_users(
        session,
        batch_data.ids,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(USERS_CACHE_NAMESPACE, "alumni")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.USERS_BATCH_DELETED.value,
        message=f"Batch delete completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.post("/batch/restore")
def batch_restore_users_route(
    data: UserBatchRestore,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Restore multiple soft-deleted users"""
    response = batch_restore_users(
        session,
        data.ids,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(USERS_CACHE_NAMESPACE, "alumni")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.USERS_BATCH_RESTORED.value,
        message=f"Restore operation completed: {response.successful} succeeded, {response.failed} failed",
        data=response
    )


# ---------------------------------------------------------------------------
# List endpoints
# ---------------------------------------------------------------------------

@router.get("")
def get_all_users_route(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None, description="Search by username or email"),
    user_type: str = Query(None, description="Filter by user type (USER, STAFF, ADMIN)"),
    include_deleted: bool = Query(False),
    sort_by: str = Query("user_id"),
    sort_order: str = Query("asc"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get all users with filtering, searching, and sorting"""
    cache_key = generate_cache_key(
        f"{USERS_CACHE_NAMESPACE}:list",
        limit=limit,
        offset=offset,
        search=search,
        user_type=user_type,
        include_deleted=include_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_users_list_response(
            session, limit, offset, search, user_type, include_deleted, sort_by, sort_order
        ),
        ttl=USERS_LIST_TTL,
    )


@router.get("/deleted/list")
def get_deleted_users(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    sort_by: str = Query("deleted_at"),
    sort_order: str = Query("desc"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get all soft-deleted users"""
    cache_key = generate_cache_key(
        f"{USERS_CACHE_NAMESPACE}:deleted",
        limit=limit,
        offset=offset,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_deleted_users_response(session, limit, offset, search, sort_by, sort_order),
        ttl=USERS_LIST_TTL,
    )


@router.get("/all/list")
def get_all_users_including_deleted(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    user_type: str = Query(None),
    sort_by: str = Query("user_id"),
    sort_order: str = Query("asc"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get all users including soft-deleted"""
    cache_key = generate_cache_key(
        f"{USERS_CACHE_NAMESPACE}:all",
        limit=limit,
        offset=offset,
        search=search,
        user_type=user_type,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_all_users_response(session, limit, offset, search, user_type, sort_by, sort_order),
        ttl=USERS_LIST_TTL,
    )


# ---------------------------------------------------------------------------
# Single-record endpoints
# ---------------------------------------------------------------------------

@router.post("")
def create_user_route(
    user_data: UserCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Create a new user account"""
    try:
        new_user = create_user(
            session,
            user_data,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(USERS_CACHE_NAMESPACE, "alumni")
        return StandardResponse(
            success=True,
            code=SuccessCode.USER_CREATED.value,
            message=f"User {new_user.user_id} created successfully",
            data=UserPublic.model_validate(new_user)
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_users_email" in error_str or "users_email_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_EMAIL.value, "Email already in use"
        elif "ix_users_username" in error_str or "users_username_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_USERNAME.value, "Username already in use"
        else:
            code, msg = ErrorCode.INVALID_INPUT.value, "User with these details already exists"
        log_integrity_error("users", "create_user", code, msg, str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode='json'))


@router.get("/{user_id}")
def get_user(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_self_or_admin),
):
    """Get a specific user by user_id"""
    cache_key = generate_cache_key(f"{USERS_CACHE_NAMESPACE}:detail", user_id=user_id)
    return cache_get_or_set(
        cache_key,
        lambda: _build_user_detail_response(session, user_id),
        ttl=USERS_DETAIL_TTL,
    )


@router.patch("/{user_id}")
async def update_user_route(
    user_id: str,
    user_data: UserUpdate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_self_or_admin),
):
    """Update a user's information. If changing password, current_password is required."""
    payload = await request.json()
    restricted_fields = {"user_type", "is_deleted"}
    if current_user.user_type != UserType.ADMIN.value and restricted_fields.intersection(payload.keys()):
        raise HTTPException(
            status_code=403,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.FORBIDDEN.value,
                message="Only ADMIN can update user_type or is_deleted",
            ).model_dump(mode="json"),
        )

    user = get_user_by_id_any(session, user_id)
    if not user:
        log_error("users", "update_user", ErrorCode.USER_NOT_FOUND.value, f"User {user_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.USER_NOT_FOUND.value, message="User not found"
        ).model_dump(mode='json'))

    if user_data.password is not None:
        if user_data.current_password is None:
            log_error("users", "update_user", ErrorCode.MISSING_CURRENT_PASSWORD.value, "Current password required but not provided")
            raise HTTPException(status_code=400, detail=StandardResponse(
                success=False, code=ErrorCode.MISSING_CURRENT_PASSWORD.value,
                message="Current password required to change password"
            ).model_dump(mode='json'))
        if not verify_password(user_data.current_password, user.password):
            log_auth_error("update_user", user.username, ErrorCode.INVALID_CREDENTIALS.value, "Incorrect current password")
            raise HTTPException(status_code=401, detail=StandardResponse(
                success=False, code=ErrorCode.INVALID_CREDENTIALS.value,
                message="Current password is incorrect"
            ).model_dump(mode='json'))

    try:
        updated = update_user(
            session,
            user,
            user_data,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(USERS_CACHE_NAMESPACE, "alumni")
        return StandardResponse(
            success=True, code=SuccessCode.USER_UPDATED.value,
            message=f"User {updated.user_id} updated successfully",
            data=UserPublic.model_validate(updated)
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_users_email" in error_str or "users_email_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_EMAIL.value, "Email already in use"
        elif "ix_users_username" in error_str or "users_username_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_USERNAME.value, "Username already in use"
        else:
            code, msg = ErrorCode.INVALID_INPUT.value, "Update failed: Duplicate entry"
        log_integrity_error("users", "update_user", code, msg, str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode='json'))


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    password: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Delete a user account (requires password confirmation)"""
    user = get_user_by_id_any(session, user_id)
    if not user:
        log_error("users", "delete_user", ErrorCode.USER_NOT_FOUND.value, f"User {user_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.USER_NOT_FOUND.value, message="User not found"
        ).model_dump(mode='json'))

    if user.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.ALREADY_DELETED.value,
            message="User is already deleted, cannot delete again"
        ).model_dump(mode='json'))

    if not verify_password(password, user.password):
        log_auth_error("delete_user", user.username, ErrorCode.INVALID_CREDENTIALS.value, "Incorrect password on deletion")
        raise HTTPException(status_code=401, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_CREDENTIALS.value, message="Password is incorrect"
        ).model_dump(mode='json'))

    try:
        soft_delete_user(session, user, performed_by=current_user.user_code)
        invalidate_cache_namespaces(USERS_CACHE_NAMESPACE, "alumni")
        return StandardResponse(
            success=True, code=SuccessCode.USER_DELETED.value,
            message=f"User {user_id} deleted successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("users", "delete_user", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Delete failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))


@router.post("/{user_id}/restore")
def restore_user_route(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Restore a soft-deleted user"""
    user = get_user_by_id_any(session, user_id)
    if not user:
        log_error("users", "restore_user", ErrorCode.USER_NOT_FOUND.value, f"User {user_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.USER_NOT_FOUND.value, message="User not found"
        ).model_dump(mode='json'))

    if not user.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="User is not deleted, cannot restore"
        ).model_dump(mode='json'))

    try:
        restore_user(session, user, performed_by=current_user.user_code)
        invalidate_cache_namespaces(USERS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True, code=SuccessCode.USER_RESTORED.value,
            message=f"User {user_id} restored successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("users", "restore_user", ErrorCode.INVALID_INPUT.value, "Restore failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Restore failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))


def _build_users_list_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    user_type: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
) -> StandardResponse:
    users, total = get_all_users(
        session, limit, offset, search, user_type, include_deleted, sort_by, sort_order
    )
    returned = len(users)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return StandardResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message=f"Retrieved {returned} users",
        data={"users": [UserPublic.model_validate(u) for u in users], "pagination": pagination}
    )


def _build_deleted_users_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    sort_by: str,
    sort_order: str,
) -> PaginatedResponse:
    users, total = get_all_users(
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
    returned = len(users)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message=f"Retrieved {returned} deleted users",
        data=[UserPublic.model_validate(u) for u in users],
        pagination=pagination
    )


def _build_all_users_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    user_type: str | None,
    sort_by: str,
    sort_order: str,
) -> PaginatedResponse:
    users, total = get_all_users(
        session, limit, offset, search, user_type, include_deleted=True,
        sort_by=sort_by, sort_order=sort_order
    )
    returned = len(users)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message=f"Retrieved {returned} users (including deleted)",
        data=[UserPublic.model_validate(u) for u in users],
        pagination=pagination
    )


def _build_user_detail_response(session: Session, user_id: str) -> StandardResponse:
    user = get_user_by_id(session, user_id)
    if not user:
        log_error("users", "get_user", ErrorCode.USER_NOT_FOUND.value, f"User {user_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.USER_NOT_FOUND.value, message="User not found"
        ).model_dump(mode='json'))
    return StandardResponse(
        success=True, code=SuccessCode.USER_RETRIEVED.value,
        message=f"User {user_id} retrieved successfully",
        data=UserPublic.model_validate(user)
    )
