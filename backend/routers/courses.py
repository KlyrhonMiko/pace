from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.courses import (
    CourseCreate, CourseUpdate, CoursePublic,
    CourseBatchCreate, CourseBatchUpdate, CourseBatchDelete, CourseBatchRestore,
)
from models.auth import CurrentUser
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.pagination import PaginatedResponse, PaginationMetadata
from utils.rbac import require_admin, require_authenticated
from utils.logging import log_error, log_integrity_error
from services.queries.courses_queries import (
    get_course_by_id, get_course_by_id_any,
    create_course, update_course, soft_delete_course, restore_course,
    has_active_student_records, get_all_courses, build_course_public,
    batch_create_courses, batch_update_courses, batch_delete_courses, batch_restore_courses,
)

router = APIRouter(prefix="/courses", tags=["courses"])
COURSES_CACHE_NAMESPACE = "courses"
COURSES_LIST_TTL = 1800
COURSES_DETAIL_TTL = 1800


# ---------------------------------------------------------------------------
# Batch endpoints (must be before /{id} to avoid path conflicts)
# ---------------------------------------------------------------------------

@router.post("/batch")
def batch_create_courses_route(
    batch_data: CourseBatchCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch create courses"""
    response = batch_create_courses(
        session,
        batch_data.items,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(COURSES_CACHE_NAMESPACE, "alumni")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.COURSES_BATCH_CREATED.value,
        message=f"Batch create completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.patch("/batch")
def batch_update_courses_route(
    batch_data: CourseBatchUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch update courses"""
    response = batch_update_courses(
        session,
        batch_data.items,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(COURSES_CACHE_NAMESPACE, "alumni")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.COURSES_BATCH_UPDATED.value,
        message=f"Batch update completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.delete("/batch")
def batch_delete_courses_route(
    batch_data: CourseBatchDelete,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Batch delete courses"""
    response = batch_delete_courses(
        session,
        batch_data.ids,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(COURSES_CACHE_NAMESPACE, "alumni")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.COURSES_BATCH_DELETED.value,
        message=f"Batch delete completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.post("/batch/restore")
def batch_restore_courses_route(
    data: CourseBatchRestore,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Restore multiple soft-deleted courses"""
    response = batch_restore_courses(
        session,
        data.ids,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(COURSES_CACHE_NAMESPACE, "alumni")
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.COURSES_BATCH_RESTORED.value,
        message=f"Restore operation completed: {response.successful} succeeded, {response.failed} failed",
        data=response
    )


# ---------------------------------------------------------------------------
# List endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=StandardResponse)
def get_all_courses_route(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by course abbreviation or name"),
    college_dept_abbv: str = Query(None, description="Filter by college department abbreviation"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    sort_by: str = Query("course_id", description="Sort by field (course_id, course_abbv, course_name)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get all courses with filtering, searching, and sorting"""
    cache_key = generate_cache_key(
        f"{COURSES_CACHE_NAMESPACE}:list",
        limit=limit,
        offset=offset,
        search=search,
        college_dept_abbv=college_dept_abbv,
        include_deleted=include_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_courses_list_response(
            session, limit, offset, search, college_dept_abbv, include_deleted, sort_by, sort_order
        ),
        ttl=COURSES_LIST_TTL,
    )


@router.get("/deleted/list", response_model=PaginatedResponse)
def get_deleted_courses(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    sort_by: str = Query("deleted_at"),
    sort_order: str = Query("desc"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get all soft-deleted courses"""
    cache_key = generate_cache_key(
        f"{COURSES_CACHE_NAMESPACE}:deleted",
        limit=limit,
        offset=offset,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_deleted_courses_response(session, limit, offset, search, sort_by, sort_order),
        ttl=COURSES_LIST_TTL,
    )


@router.get("/all/list", response_model=PaginatedResponse)
def get_all_courses_including_deleted(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    college_dept_abbv: str = Query(None),
    sort_by: str = Query("course_id"),
    sort_order: str = Query("asc"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get all courses including soft-deleted"""
    cache_key = generate_cache_key(
        f"{COURSES_CACHE_NAMESPACE}:all",
        limit=limit,
        offset=offset,
        search=search,
        college_dept_abbv=college_dept_abbv,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return cache_get_or_set(
        cache_key,
        lambda: _build_all_courses_response(session, limit, offset, search, college_dept_abbv, sort_by, sort_order),
        ttl=COURSES_LIST_TTL,
    )


# ---------------------------------------------------------------------------
# Single-record endpoints
# ---------------------------------------------------------------------------

@router.post("")
def create_course_route(
    course_data: CourseCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Create a new course"""
    try:
        new_course, college_dept = create_course(
            session,
            course_data,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(COURSES_CACHE_NAMESPACE, "alumni")
        return StandardResponse(
            success=True,
            code=SuccessCode.COURSE_CREATED.value,
            message="Course created successfully",
            data=build_course_public(new_course, college_dept)
        )
    except ValueError as e:
        log_error("courses", "create_course", ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, str(e))
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, message=str(e)
        ).model_dump(mode='json'))
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_courses_course_id" in error_str or "courses_course_id_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_COURSE_ID.value, "Course ID already in use"
        elif "ix_courses_course_abbv" in error_str or "courses_course_abbv_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_COURSE_ABBV.value, "Course abbreviation already in use"
        elif "ix_courses_course_name" in error_str or "courses_course_name_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_COURSE_NAME.value, "Course name already in use"
        else:
            code, msg = ErrorCode.INVALID_INPUT.value, "Course with these details already exists"
        log_integrity_error("courses", "create_course", code, msg, str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode='json'))


@router.get("/{course_id}", response_model=StandardResponse)
def get_course(
    course_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Get a specific course by course_id"""
    cache_key = generate_cache_key(f"{COURSES_CACHE_NAMESPACE}:detail", course_id=course_id)
    return cache_get_or_set(
        cache_key,
        lambda: _build_course_detail_response(session, course_id),
        ttl=COURSES_DETAIL_TTL,
    )


@router.patch("/{course_id}")
def update_course_route(
    course_id: str,
    course_data: CourseUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Update course information"""
    course = get_course_by_id_any(session, course_id)
    if not course:
        log_error("courses", "update_course", ErrorCode.COURSE_NOT_FOUND.value, f"Course {course_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COURSE_NOT_FOUND.value, message="Course not found"
        ).model_dump(mode='json'))

    try:
        updated_course, college_dept = update_course(
            session,
            course,
            course_data,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(COURSES_CACHE_NAMESPACE, "alumni")
        return StandardResponse(
            success=True, code=SuccessCode.COURSE_UPDATED.value,
            message="Course updated successfully",
            data=build_course_public(updated_course, college_dept)
        )
    except ValueError as e:
        log_error("courses", "update_course", ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, str(e))
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, message=str(e)
        ).model_dump(mode='json'))
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_courses_course_abbv" in error_str or "courses_course_abbv_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_COURSE_ABBV.value, "Course abbreviation already in use"
        elif "ix_courses_course_name" in error_str or "courses_course_name_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_COURSE_NAME.value, "Course name already in use"
        else:
            code, msg = ErrorCode.INVALID_INPUT.value, "Update failed: Invalid input or constraint violation"
        log_integrity_error("courses", "update_course", code, msg, str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode='json'))


@router.delete("/{course_id}")
def delete_course(
    course_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Delete a course"""
    course = get_course_by_id_any(session, course_id)
    if not course:
        log_error("courses", "delete_course", ErrorCode.COURSE_NOT_FOUND.value, f"Course {course_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COURSE_NOT_FOUND.value, message="Course not found"
        ).model_dump(mode='json'))

    if course.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.ALREADY_DELETED.value,
            message="Course is already deleted, cannot delete again"
        ).model_dump(mode='json'))

    if has_active_student_records(session, course):
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.CANNOT_DELETE_COURSE_WITH_ACTIVE_STUDENT_RECORDS.value,
            message="Cannot delete course with active student records"
        ).model_dump(mode='json'))

    try:
        soft_delete_course(session, course, performed_by=current_user.user_code)
        invalidate_cache_namespaces(COURSES_CACHE_NAMESPACE, "alumni")
        return StandardResponse(
            success=True, code=SuccessCode.COURSE_DELETED.value,
            message=f"Course {course_id} deleted successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("courses", "delete_course", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Delete failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))


@router.post("/{course_id}/restore")
def restore_course_route(
    course_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Restore a soft-deleted course"""
    course = get_course_by_id_any(session, course_id)
    if not course:
        log_error("courses", "restore_course", ErrorCode.COURSE_NOT_FOUND.value, f"Course {course_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COURSE_NOT_FOUND.value, message="Course not found"
        ).model_dump(mode='json'))

    if not course.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Course is not deleted, cannot restore"
        ).model_dump(mode='json'))

    try:
        restore_course(session, course, performed_by=current_user.user_code)
        invalidate_cache_namespaces(COURSES_CACHE_NAMESPACE, "alumni")
        return StandardResponse(
            success=True, code=SuccessCode.COURSE_RESTORED.value,
            message=f"Course {course_id} restored successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("courses", "restore_course", ErrorCode.INVALID_INPUT.value, "Restore failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Restore failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))


def _build_courses_list_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    college_dept_abbv: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
) -> StandardResponse:
    courses, total = get_all_courses(
        session, limit, offset, search, college_dept_abbv, include_deleted, sort_by, sort_order
    )
    returned = len(courses)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return StandardResponse(
        success=True,
        code=SuccessCode.COURSES_RETRIEVED.value,
        message=f"Retrieved {returned} courses",
        data={"courses": courses, "pagination": pagination}
    )


def _build_deleted_courses_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    sort_by: str,
    sort_order: str,
) -> PaginatedResponse:
    courses, total = get_all_courses(
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
    returned = len(courses)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.COURSES_RETRIEVED.value,
        message=f"Retrieved {returned} deleted courses",
        data=courses,
        pagination=pagination
    )


def _build_all_courses_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    college_dept_abbv: str | None,
    sort_by: str,
    sort_order: str,
) -> PaginatedResponse:
    courses, total = get_all_courses(
        session, limit, offset, search, college_dept_abbv, include_deleted=True,
        sort_by=sort_by, sort_order=sort_order
    )
    returned = len(courses)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.COURSES_RETRIEVED.value,
        message=f"Retrieved {returned} courses (including deleted)",
        data=courses,
        pagination=pagination
    )


def _build_course_detail_response(session: Session, course_id: str) -> StandardResponse:
    course = get_course_by_id(session, course_id)
    if not course:
        log_error("courses", "get_course", ErrorCode.COURSE_NOT_FOUND.value, f"Course {course_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.COURSE_NOT_FOUND.value, message="Course not found"
        ).model_dump(mode='json'))

    from services.queries.courses_queries import get_college_dept_by_code
    college_dept = get_college_dept_by_code(session, course.college_dept_code)
    return StandardResponse(
        success=True, code=SuccessCode.COURSE_RETRIEVED.value,
        message=f"Course {course_id} retrieved successfully",
        data=build_course_public(course, college_dept)
    )
