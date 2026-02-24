from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from schemas.student_records import (
    StudentRecordCreate, StudentRecordUpdate, StudentRecordPublic,
    StudentRecordBatchCreate, StudentRecordBatchUpdate,
    StudentRecordBatchDelete, StudentRecordBatchRestore,
)
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.pagination import PaginatedResponse, PaginationMetadata
from utils.logging import log_error, log_integrity_error
from services.queries.student_records_queries import (
    get_student_by_id, get_student_by_id_any,
    create_student_record, update_student_record,
    soft_delete_student_record, restore_student_record,
    get_all_student_records,
    batch_create_student_records, batch_update_student_records,
    batch_delete_student_records, batch_restore_student_records,
)

router = APIRouter(prefix="/student-records", tags=["student-records"])


# ---------------------------------------------------------------------------
# Batch endpoints (before /{student_id})
# ---------------------------------------------------------------------------

@router.post("/batch")
def batch_create_student_records_route(
    batch_data: StudentRecordBatchCreate,
    session: Session = Depends(get_session)
):
    """Batch create student records"""
    response = batch_create_student_records(session, batch_data.items)
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.STUDENT_RECORDS_BATCH_CREATED.value,
        message=f"Batch create completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.patch("/batch")
def batch_update_student_records_route(
    batch_data: StudentRecordBatchUpdate,
    session: Session = Depends(get_session)
):
    """Batch update student records"""
    response = batch_update_student_records(session, batch_data.items)
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.STUDENT_RECORDS_BATCH_UPDATED.value,
        message=f"Batch update completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.delete("/batch")
def batch_delete_student_records_route(
    batch_data: StudentRecordBatchDelete,
    session: Session = Depends(get_session)
):
    """Batch delete student records"""
    response = batch_delete_student_records(session, batch_data.ids)
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.STUDENT_RECORDS_BATCH_DELETED.value,
        message=f"Batch delete completed: {response.successful} successful, {response.failed} failed",
        data=response
    )


@router.post("/batch/restore")
def batch_restore_student_records_route(
    data: StudentRecordBatchRestore,
    session: Session = Depends(get_session)
):
    """Restore multiple soft-deleted student records"""
    response = batch_restore_student_records(session, data.ids)
    return StandardResponse(
        success=response.failed == 0,
        code=SuccessCode.STUDENT_RECORDS_BATCH_RESTORED.value,
        message=f"Restore operation completed: {response.successful} succeeded, {response.failed} failed",
        data=response
    )


# ---------------------------------------------------------------------------
# List endpoints
# ---------------------------------------------------------------------------

@router.get("")
def get_all_student_records_route(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None, description="Search by student ID"),
    year_graduated: int = Query(None),
    min_gwa: float = Query(None),
    max_gwa: float = Query(None),
    course_abbv: str = Query(None),
    include_deleted: bool = Query(False),
    sort_by: str = Query("student_id"),
    sort_order: str = Query("asc"),
    session: Session = Depends(get_session)
):
    """Get all student records with filtering, searching, and sorting"""
    records, total = get_all_student_records(
        session, limit, offset, search, year_graduated,
        min_gwa, max_gwa, course_abbv, include_deleted, sort_by, sort_order
    )
    returned = len(records)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return StandardResponse(
        success=True,
        code=SuccessCode.STUDENT_RECORDS_RETRIEVED.value,
        message=f"Retrieved {returned} student records",
        data={"student_records": [StudentRecordPublic.model_validate(r) for r in records], "pagination": pagination}
    )


@router.get("/deleted/list")
def get_deleted_student_records(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    sort_by: str = Query("deleted_at"),
    sort_order: str = Query("desc"),
    session: Session = Depends(get_session)
):
    """Get all soft-deleted student records"""
    records, total = get_all_student_records(
        session, limit, offset, search, None, None, None, None,
        include_deleted=True, sort_by=sort_by, sort_order=sort_order
    )
    deleted = [r for r in records if r.is_deleted]
    returned = len(deleted)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.STUDENT_RECORDS_RETRIEVED.value,
        message=f"Retrieved {returned} deleted student records",
        data=[StudentRecordPublic.model_validate(r) for r in deleted],
        pagination=pagination
    )


@router.get("/all/list")
def get_all_student_records_including_deleted(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    year_graduated: int = Query(None),
    min_gwa: float = Query(None),
    max_gwa: float = Query(None),
    course_abbv: str = Query(None),
    sort_by: str = Query("student_id"),
    sort_order: str = Query("asc"),
    session: Session = Depends(get_session)
):
    """Get all student records including soft-deleted"""
    records, total = get_all_student_records(
        session, limit, offset, search, year_graduated,
        min_gwa, max_gwa, course_abbv, include_deleted=True,
        sort_by=sort_by, sort_order=sort_order
    )
    returned = len(records)
    pagination = PaginationMetadata(
        total=total, limit=limit, offset=offset, returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False
    )
    return PaginatedResponse(
        success=True,
        code=SuccessCode.STUDENT_RECORDS_RETRIEVED.value,
        message=f"Retrieved {returned} student records (including deleted)",
        data=[StudentRecordPublic.model_validate(r) for r in records],
        pagination=pagination
    )


# ---------------------------------------------------------------------------
# Single-record endpoints
# ---------------------------------------------------------------------------

@router.post("")
def create_student_record_route(
    student_data: StudentRecordCreate,
    session: Session = Depends(get_session)
):
    """Create a new student record linked to an alumni"""
    try:
        new_student = create_student_record(session, student_data)
        return StandardResponse(
            success=True,
            code=SuccessCode.STUDENT_RECORD_CREATED.value,
            message="Student record created successfully",
            data=StudentRecordPublic.model_validate(new_student)
        )
    except ValueError as e:
        msg = str(e)
        if msg.startswith("COURSE_NOT_FOUND:"):
            code, detail = ErrorCode.COURSE_NOT_FOUND.value, "Course not found"
            log_error("student_records", "create", code, detail)
            raise HTTPException(status_code=404, detail=StandardResponse(success=False, code=code, message=detail).model_dump(mode='json'))
        if msg.startswith("ALUMNI_NOT_FOUND:"):
            code, detail = ErrorCode.ALUMNI_NOT_FOUND.value, "Alumni not found"
            log_error("student_records", "create", code, detail)
            raise HTTPException(status_code=404, detail=StandardResponse(success=False, code=code, message=detail).model_dump(mode='json'))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=ErrorCode.INVALID_INPUT.value, message=msg).model_dump(mode='json'))
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "ix_student_records_student_id" in error_str or "student_records_student_id_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_STUDENT_ID.value, "Student ID already in use"
        elif "student_records_alumni_code_key" in error_str:
            code, msg = ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value, "This alumni already has a student record"
        elif "course_code" in error_str:
            code, msg = ErrorCode.COURSE_NOT_FOUND.value, "Specified course does not exist"
        elif "alumni_code" in error_str:
            code, msg = ErrorCode.ALUMNI_NOT_FOUND.value, "Specified alumni does not exist"
        else:
            code, msg = ErrorCode.INVALID_INPUT.value, "Student record creation failed"
        log_integrity_error("student_records", "create", code, msg, str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode='json'))


@router.get("/{student_id}")
def get_student_record(student_id: str, session: Session = Depends(get_session)):
    """Get a student record by student ID"""
    student = get_student_by_id(session, student_id)
    if not student:
        log_error("student_records", "get", ErrorCode.STUDENT_RECORD_NOT_FOUND.value, f"Student record {student_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value, message="Student record not found"
        ).model_dump(mode='json'))
    return StandardResponse(
        success=True, code=SuccessCode.STUDENT_RECORD_RETRIEVED.value,
        message=f"Student record {student_id} retrieved successfully",
        data=StudentRecordPublic.model_validate(student)
    )


@router.patch("/{student_id}")
def update_student_record_route(
    student_id: str,
    student_data: StudentRecordUpdate,
    session: Session = Depends(get_session)
):
    """Update a student record"""
    student = get_student_by_id_any(session, student_id)
    if not student:
        log_error("student_records", "update", ErrorCode.STUDENT_RECORD_NOT_FOUND.value, f"Student record {student_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value, message="Student record not found"
        ).model_dump(mode='json'))

    try:
        updated = update_student_record(session, student, student_data)
        return StandardResponse(
            success=True, code=SuccessCode.STUDENT_RECORD_UPDATED.value,
            message="Student record updated successfully",
            data=StudentRecordPublic.model_validate(updated)
        )
    except ValueError as e:
        msg = str(e)
        if msg.startswith("ALUMNI_NOT_FOUND:"):
            raise HTTPException(status_code=404, detail=StandardResponse(
                success=False, code=ErrorCode.ALUMNI_NOT_FOUND.value, message="Alumni not found"
            ).model_dump(mode='json'))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value, message=msg
        ).model_dump(mode='json'))
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "student_records_alumni_code_key" in error_str:
            code, msg = ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value, "This alumni already has a student record"
        elif "course_code" in error_str:
            code, msg = ErrorCode.COURSE_NOT_FOUND.value, "Specified course does not exist"
        elif "alumni_code" in error_str:
            code, msg = ErrorCode.ALUMNI_NOT_FOUND.value, "Specified alumni does not exist"
        elif "ix_student_records_student_id" in error_str or "student_records_student_id_key" in error_str:
            code, msg = ErrorCode.DUPLICATE_STUDENT_ID.value, "Student ID already in use"
        else:
            code, msg = ErrorCode.INVALID_INPUT.value, "Update failed: Invalid input or constraint violation"
        log_integrity_error("student_records", "update", code, msg, str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(success=False, code=code, message=msg).model_dump(mode='json'))


@router.delete("/{student_id}")
def delete_student_record(student_id: str, session: Session = Depends(get_session)):
    """Delete a student record"""
    student = get_student_by_id_any(session, student_id)
    if not student:
        log_error("student_records", "delete", ErrorCode.STUDENT_RECORD_NOT_FOUND.value, f"Student record {student_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value, message="Student record not found"
        ).model_dump(mode='json'))

    if student.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.ALREADY_DELETED.value,
            message="Student record is already deleted, cannot delete again"
        ).model_dump(mode='json'))

    try:
        soft_delete_student_record(session, student)
        return StandardResponse(
            success=True, code=SuccessCode.STUDENT_RECORD_DELETED.value,
            message=f"Student record {student_id} deleted successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("student_records", "delete", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Delete failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))


@router.post("/{student_id}/restore")
def restore_student_record_route(student_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted student record"""
    student = get_student_by_id_any(session, student_id)
    if not student:
        log_error("student_records", "restore", ErrorCode.STUDENT_RECORD_NOT_FOUND.value, f"Student record {student_id} not found")
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value, message="Student record not found"
        ).model_dump(mode='json'))

    if not student.is_deleted:
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Student record is not deleted, cannot restore"
        ).model_dump(mode='json'))

    try:
        restore_student_record(session, student)
        return StandardResponse(
            success=True, code=SuccessCode.STUDENT_RECORD_RESTORED.value,
            message=f"Student record {student_id} restored successfully"
        )
    except IntegrityError as e:
        session.rollback()
        log_integrity_error("student_records", "restore", ErrorCode.INVALID_INPUT.value, "Restore failed", str(e))
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT.value,
            message="Restore failed: Constraint violation or invalid operation"
        ).model_dump(mode='json'))