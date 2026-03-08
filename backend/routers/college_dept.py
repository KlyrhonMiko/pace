from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.college_dept import (
    CollegeDeptCreate, CollegeDeptUpdate, CollegeDeptPublic,
    CollegeDeptBatchCreate, CollegeDeptBatchUpdate, CollegeDeptBatchDelete, CollegeDeptBatchRestore,
)
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.pagination import PaginatedResponse, PaginationMetadata
from utils.logging import log_error, log_integrity_error
from services.queries.college_dept_queries import (
    get_college_dept_by_id, get_college_dept_by_id_any,
    create_college_dept, update_college_dept,
    soft_delete_college_dept, restore_college_dept, has_active_courses,
    get_all_college_depts,
    batch_create_college_depts, batch_update_college_depts,
    batch_delete_college_depts, batch_restore_college_depts,
)

router = APIRouter(prefix="/college-depts", tags=["college-depts"])
COLLEGE_DEPTS_CACHE_NAMESPACE = "college_depts"
COLLEGE_DEPTS_LIST_TTL = 1800
COLLEGE_DEPTS_DETAIL_TTL = 1800


# ---------------------------------------------------------------------------
# Batch endpoints (must be before /{id} to avoid path conflicts)
# ---------------------------------------------------------------------------

@router.post("/batch")
def batch_create_college_depts_route(
    batch_data: CollegeDeptBatchCreate,
    session: Session = Depends(get_session)
):
    """Batch create college departments"""
    response = batch_create_college_depts(session, batch_data.items)
    invalidate_cache_namespaces(COLLEGE_DEPTS_CACHE_NAMESPACE, "courses")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.COLLEGE_DEPTS_BATCH_CREATED.value,
        message=f"Batch create completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.patch("/batch")
def batch_update_college_depts_route(
    batch_data: CollegeDeptBatchUpdate,
    session: Session = Depends(get_session)
):
    """Batch update college departments"""
    response = batch_update_college_depts(session, batch_data.items)
    invalidate_cache_namespaces(COLLEGE_DEPTS_CACHE_NAMESPACE, "courses")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.COLLEGE_DEPTS_BATCH_UPDATED.value,
        message=f"Batch update completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.delete("/batch")
def batch_delete_college_depts_route(
    batch_data: CollegeDeptBatchDelete,
    session: Session = Depends(get_session)
):
    """Batch delete college departments"""
    response = batch_delete_college_depts(session, batch_data.ids)
    invalidate_cache_namespaces(COLLEGE_DEPTS_CACHE_NAMESPACE, "courses")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.COLLEGE_DEPTS_BATCH_DELETED.value,
        message=f"Batch delete completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.post("/batch/restore")
def batch_restore_college_depts_route(
    data: CollegeDeptBatchRestore,
    session: Session = Depends(get_session)
):
    """Restore multiple soft-deleted college departments"""
    response = batch_restore_college_depts(session, data.ids)
    invalidate_cache_namespaces(COLLEGE_DEPTS_CACHE_NAMESPACE, "courses")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.COLLEGE_DEPTS_BATCH_RESTORED.value,
        message=f"Restore operation completed: {response.successful} succeeded, {response.failed} failed",
        data=response
    )


# ---------------------------------------------------------------------------
# List endpoints
# ---------------------------------------------------------------------------

@router.get("")
def get_all_college_depts_route(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by abbreviation or name"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    sort_by: str = Query("college_dept_id", description="Sort by field (college_dept_id, college_dept_abbv, college_dept_name)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """Get all college departments with filtering, searching, and sorting"""
    cache_key = generate_cache_key(
        f"{COLLEGE_DEPTS_CACHE_NAMESPACE}:list",
        limit=limit,
        offset=offset,
        search=search,
        include_deleted=include_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_college_depts_list_response(
            session, limit, offset, search, include_deleted, sort_by, sort_order
        ),
        ttl=COLLEGE_DEPTS_LIST_TTL,
    )


@router.get("/deleted/list")
def get_deleted_college_depts(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    sort_by: str = Query("deleted_at"),
    sort_order: str = Query("desc"),
    session: Session = Depends(get_session)
):
    """Get all soft-deleted college departments"""
    cache_key = generate_cache_key(
        f"{COLLEGE_DEPTS_CACHE_NAMESPACE}:deleted",
        limit=limit,
        offset=offset,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_deleted_college_depts_response(session, limit, offset, search, sort_by, sort_order),
        ttl=COLLEGE_DEPTS_LIST_TTL,
    )


@router.get("/all/list")
def get_all_college_depts_including_deleted(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    sort_by: str = Query("college_dept_id"),
    sort_order: str = Query("asc"),
    session: Session = Depends(get_session)
):
    """Get all college departments including soft-deleted"""
    cache_key = generate_cache_key(
        f"{COLLEGE_DEPTS_CACHE_NAMESPACE}:all",
        limit=limit,
        offset=offset,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_all_college_depts_response(session, limit, offset, search, sort_by, sort_order),
        ttl=COLLEGE_DEPTS_LIST_TTL,
    )


# ---------------------------------------------------------------------------
# Single-record endpoints
# ---------------------------------------------------------------------------

@router.post("")
def create_college_dept_route(
    college_dept_data: CollegeDeptCreate,
    session: Session = Depends(get_session)
):
    """Create a new college department"""
    try:
        new_dept = create_college_dept(session, college_dept_data)
        invalidate_cache_namespaces(COLLEGE_DEPTS_CACHE_NAMESPACE, "courses")
        return StandardResponse(
            success=True,
            code=SuccessCode.COLLEGE_DEPT_CREATED.value,
            message="College department created successfully",
            data=CollegeDeptPublic.model_validate(new_dept)
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_college_depts_college_dept_id" in error_str or "college_depts_college_dept_id_key" in error_str:
            code = ErrorCode.DUPLICATE_COLLEGE_DEPT_ID.value
            msg = "College department ID already in use"
        elif "ix_college_depts_college_dept_abbv" in error_str or "college_depts_college_dept_abbv_key" in error_str:
            code = ErrorCode.DUPLICATE_COLLEGE_DEPT_ABBV.value
            msg = "College department abbreviation already in use"
        elif "ix_college_depts_college_dept_name" in error_str or "college_depts_college_dept_name_key" in error_str:
            code = ErrorCode.DUPLICATE_COLLEGE_DEPT_NAME.value
            msg = "College department name already in use"
        else:
            code = ErrorCode.INVALID_INPUT.value
            msg = "College department with these details already exists"
        log_integrity_error("college_depts", "create_college_dept", code, msg, str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode='json'))


@router.get("/{college_dept_id}")
def get_college_dept(college_dept_id: str, session: Session = Depends(get_session)):
    """Get a specific college department by college_dept_id"""
    cache_key = generate_cache_key(f"{COLLEGE_DEPTS_CACHE_NAMESPACE}:detail", college_dept_id=college_dept_id)
    return cache_get_or_set(
        cache_key,
        lambda: _build_college_dept_detail_response(session, college_dept_id),
        ttl=COLLEGE_DEPTS_DETAIL_TTL,
    )


@router.patch("/{college_dept_id}")
def update_college_dept_route(
    college_dept_id: str,
    college_dept_data: CollegeDeptUpdate,
    session: Session = Depends(get_session)
):
    """Update college department information"""
    dept = get_college_dept_by_id_any(session, college_dept_id)
    if not dept:
        log_error("college_depts", "update_college_dept", ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, f"College department {college_dept_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, message="College department not found"
        ).model_dump(mode='json'))

    try:
        updated = update_college_dept(session, dept, college_dept_data)
        invalidate_cache_namespaces(COLLEGE_DEPTS_CACHE_NAMESPACE, "courses")
        return StandardResponse(
            success=True, code=SuccessCode.COLLEGE_DEPT_UPDATED.value,
            message="College department updated successfully",
            data=CollegeDeptPublic.model_validate(updated)
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_college_depts_college_dept_abbv" in error_str or "college_depts_college_dept_abbv_key" in error_str:
            code = ErrorCode.DUPLICATE_COLLEGE_DEPT_ABBV.value
            msg = "College department abbreviation already in use"
        elif "ix_college_depts_college_dept_name" in error_str or "college_depts_college_dept_name_key" in error_str:
            code = ErrorCode.DUPLICATE_COLLEGE_DEPT_NAME.value
            msg = "College department name already in use"
        else:
            code = ErrorCode.INVALID_INPUT.value
            msg = "Update failed: Invalid input or constraint violation"
        log_integrity_error("college_depts", "update_college_dept", code, msg, str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode='json'))


@router.delete("/{college_dept_id}")
def delete_college_dept(college_dept_id: str, session: Session = Depends(get_session)):
    """Delete a college department"""
    dept = get_college_dept_by_id_any(session, college_dept_id)
    if not dept:
        log_error("college_depts", "delete_college_dept", ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, f"College department {college_dept_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, message="College department not found"
        ).model_dump(mode='json'))

    if dept.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.ALREADY_DELETED.value,
            message="College department is already deleted, cannot delete again"
        ).model_dump(mode='json'))

    if has_active_courses(session, dept):
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.CANNOT_DELETE_COLLEGE_DEPT_WITH_ACTIVE_COURSES.value,
            message="Cannot delete college department with active courses"
        ).model_dump(mode='json'))

    try:
        soft_delete_college_dept(session, dept)
        invalidate_cache_namespaces(COLLEGE_DEPTS_CACHE_NAMESPACE, "courses")
        return StandardResponse(
            success=True, code=SuccessCode.COLLEGE_DEPT_DELETED.value,
            message=f"College department {college_dept_id} deleted successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("college_depts", "delete_college_dept", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Delete failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))


@router.post("/{college_dept_id}/restore")
def restore_college_dept_route(college_dept_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted college department"""
    dept = get_college_dept_by_id_any(session, college_dept_id)
    if not dept:
        log_error("college_depts", "restore_college_dept", ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, f"College department {college_dept_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, message="College department not found"
        ).model_dump(mode='json'))

    if not dept.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="College department is not deleted, cannot restore"
        ).model_dump(mode='json'))

    try:
        restore_college_dept(session, dept)
        invalidate_cache_namespaces(COLLEGE_DEPTS_CACHE_NAMESPACE, "courses")
        return StandardResponse(
            success=True, code=SuccessCode.COLLEGE_DEPT_RESTORED.value,
            message=f"College department {college_dept_id} restored successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("college_depts", "restore_college_dept", ErrorCode.INVALID_INPUT.value, "Restore failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Restore failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))


def _build_college_depts_list_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
) -> StandardResponse:
    college_depts, total = get_all_college_depts(
        session, limit, offset, search, include_deleted, sort_by, sort_order
    )
    returned = len(college_depts)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return StandardResponse(
        success=True,
        code=SuccessCode.COLLEGE_DEPTS_RETRIEVED.value,
        message=f"Retrieved {returned} college departments",
        data={"college_depts": [CollegeDeptPublic.model_validate(d) for d in college_depts], "pagination": pagination}
    )


def _build_deleted_college_depts_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    sort_by: str,
    sort_order: str,
) -> PaginatedResponse:
    college_depts, total = get_all_college_depts(
        session,
        limit,
        offset,
        search,
        include_deleted=True,
        sort_by=sort_by,
        sort_order=sort_order,
        deleted_only=True,
    )
    returned = len(college_depts)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.COLLEGE_DEPTS_RETRIEVED.value,
        message=f"Retrieved {returned} deleted college departments",
        data=[CollegeDeptPublic.model_validate(d) for d in college_depts],
        pagination=pagination
    )


def _build_all_college_depts_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    sort_by: str,
    sort_order: str,
) -> PaginatedResponse:
    college_depts, total = get_all_college_depts(
        session, limit, offset, search, include_deleted=True,
        sort_by=sort_by, sort_order=sort_order
    )
    returned = len(college_depts)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.COLLEGE_DEPTS_RETRIEVED.value,
        message=f"Retrieved {returned} college departments (including deleted)",
        data=[CollegeDeptPublic.model_validate(d) for d in college_depts],
        pagination=pagination
    )


def _build_college_dept_detail_response(session: Session, college_dept_id: str) -> StandardResponse:
    dept = get_college_dept_by_id(session, college_dept_id)
    if not dept:
        log_error("college_depts", "get_college_dept", ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, f"College department {college_dept_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, message="College department not found"
        ).model_dump(mode='json'))
    return StandardResponse(
        success=True, code=SuccessCode.COLLEGE_DEPT_RETRIEVED.value,
        message=f"College department {college_dept_id} retrieved successfully",
        data=CollegeDeptPublic.model_validate(dept)
    )
