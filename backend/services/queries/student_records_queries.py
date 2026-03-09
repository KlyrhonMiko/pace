"""
DB query functions for student_records domain.
"""
from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError

from models.student_records import StudentRecord
from models.courses import Course
from models.alumni import Alumni
from schemas.student_records import (
    StudentRecordCreate, StudentRecordUpdate, StudentRecordPublic,
    StudentRecordCreateSafeDisplay, StudentRecordUpdateSafeDisplay,
    StudentRecordBatchCreateItem, StudentRecordBatchCreateResponse,
    StudentRecordBatchUpdateItem, StudentRecordBatchUpdateResult, StudentRecordBatchUpdateResponse,
    StudentRecordBatchDeleteResult, StudentRecordBatchDeleteResponse,
    StudentRecordBatchRestoreResult, StudentRecordBatchRestoreResponse,
)
from models.response_codes import ErrorCode, SuccessCode
from utils.logging import log_integrity_error
from utils.timezone import get_current_time_gmt8
from services.queries.transaction_logs_queries import create_transaction_log


# ---------------------------------------------------------------------------
# Single-record lookups
# ---------------------------------------------------------------------------

def get_student_record_by_alumni_id(
    session: Session,
    alumni_id: str,
) -> StudentRecord | None:
    return session.exec(
        select(StudentRecord)
        .join(Alumni, StudentRecord.alumni_code == Alumni.alumni_code)
        .where(
            (Alumni.alumni_id == alumni_id.upper())
            & (StudentRecord.is_deleted == False)
        )
    ).first()


def get_student_record_by_alumni_id_any(
    session: Session,
    alumni_id: str,
) -> StudentRecord | None:
    return session.exec(
        select(StudentRecord)
        .join(Alumni, StudentRecord.alumni_code == Alumni.alumni_code)
        .where(Alumni.alumni_id == alumni_id.upper())
    ).first()


def _resolve_course(session: Session, course_abbv: str) -> Course | None:
    return session.exec(
        select(Course).where(Course.course_abbv == course_abbv.upper())
    ).first()


def _resolve_alumni(session: Session, alumni_id: str) -> Alumni | None:
    return session.exec(
        select(Alumni).where(Alumni.alumni_id == alumni_id.upper())
    ).first()


# ---------------------------------------------------------------------------
# Single-record mutations
# ---------------------------------------------------------------------------

def create_student_record(
    session: Session,
    data: StudentRecordCreate,
    performed_by: str | None = None,
) -> StudentRecord:
    """Resolve Course + Alumni, create StudentRecord, update alumni.student_code."""
    course = _resolve_course(session, data.course_abbv)
    if not course:
        raise ValueError(f"COURSE_NOT_FOUND:{data.course_abbv}")

    alumni = _resolve_alumni(session, data.alumni_id)
    if not alumni:
        raise ValueError(f"ALUMNI_NOT_FOUND:{data.alumni_id}")

    student_dict = data.model_dump(exclude={"alumni_id", "course_abbv"})
    student_dict["course_code"] = course.course_code
    student_dict["alumni_code"] = alumni.alumni_code

    new_student = StudentRecord.model_validate(student_dict)
    session.add(new_student)
    alumni.student_code = None
    session.add(alumni)
    session.flush()
    alumni.student_code = new_student.student_code
    create_transaction_log(
        session,
        tl_name=f"CREATED student_record {new_student.student_id}",
        after=new_student,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(new_student)
    return new_student


def update_student_record(
    session: Session,
    student: StudentRecord,
    data: StudentRecordUpdate,
    performed_by: str | None = None,
) -> StudentRecord:
    if data.alumni_id is not None:
        alumni = _resolve_alumni(session, data.alumni_id)
        if not alumni:
            raise ValueError(f"ALUMNI_NOT_FOUND:{data.alumni_id}")
        student.alumni_code = alumni.alumni_code
        alumni.student_code = student.student_code
        session.add(alumni)

    if data.year_graduated is not None:
        student.year_graduated = data.year_graduated
    if data.gwa is not None:
        student.gwa = data.gwa
    if data.avg_prof_grade is not None:
        student.avg_prof_grade = data.avg_prof_grade
    if data.avg_elec_grade is not None:
        student.avg_elec_grade = data.avg_elec_grade
    if data.ojt_grade is not None:
        student.ojt_grade = data.ojt_grade
    if data.leadership_pos is not None:
        student.leadership_pos = data.leadership_pos
    if data.act_member_pos is not None:
        student.act_member_pos = data.act_member_pos

    session.add(student)
    create_transaction_log(
        session,
        tl_name=f"UPDATED student_record {student.student_id}",
        after=student,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(student)
    return student


def soft_delete_student_record(
    session: Session,
    student: StudentRecord,
    performed_by: str | None = None,
) -> None:
    student.is_deleted = True
    student.deleted_at = get_current_time_gmt8()
    session.add(student)
    create_transaction_log(
        session,
        tl_name=f"DELETED student_record {student.student_id}",
        after=student,
        performed_by=performed_by,
    )
    session.commit()


def restore_student_record(
    session: Session,
    student: StudentRecord,
    performed_by: str | None = None,
) -> None:
    student.is_deleted = False
    student.deleted_at = None
    session.add(student)
    create_transaction_log(
        session,
        tl_name=f"RESTORED student_record {student.student_id}",
        after=student,
        performed_by=performed_by,
    )
    session.commit()


# ---------------------------------------------------------------------------
# List / pagination
# ---------------------------------------------------------------------------

def get_all_student_records(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    year_graduated: int | None,
    min_gwa: float | None,
    max_gwa: float | None,
    course_abbv: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
    deleted_only: bool = False,
) -> tuple[list[StudentRecord], int]:
    if deleted_only:
        base_filter = StudentRecord.is_deleted == True
    elif include_deleted:
        base_filter = None
    else:
        base_filter = StudentRecord.is_deleted == False
    query = select(StudentRecord)
    count_q = select(func.count(StudentRecord.student_code))
    if base_filter is not None:
        query = query.where(base_filter)
        count_q = count_q.where(base_filter)

    if search:
        query = query.where(StudentRecord.student_id.ilike(f"%{search}%"))

    if year_graduated:
        query = query.where(StudentRecord.year_graduated == year_graduated)

    if min_gwa is not None:
        query = query.where(StudentRecord.gwa >= min_gwa)
    if max_gwa is not None:
        query = query.where(StudentRecord.gwa <= max_gwa)

    if course_abbv:
        course = _resolve_course(session, course_abbv)
        if course:
            query = query.where(StudentRecord.course_code == course.course_code)

    total = session.exec(count_q).one()

    desc = sort_order.lower() == "desc"
    if sort_by.lower() == "year_graduated":
        query = query.order_by(StudentRecord.year_graduated.desc() if desc else StudentRecord.year_graduated)
    elif sort_by.lower() == "gwa":
        query = query.order_by(StudentRecord.gwa.desc() if desc else StudentRecord.gwa)
    elif sort_by.lower() == "deleted_at":
        query = query.order_by(StudentRecord.deleted_at.desc() if desc else StudentRecord.deleted_at)
    else:
        query = query.order_by(StudentRecord.student_id.desc() if desc else StudentRecord.student_id)

    if limit > 0:
        query = query.offset(offset).limit(limit)

    return session.exec(query).all(), total


# ---------------------------------------------------------------------------
# Batch operations
# ---------------------------------------------------------------------------

def batch_create_student_records(
    session: Session,
    items: list[StudentRecordCreate],
    performed_by: str | None = None,
) -> StudentRecordBatchCreateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        safe = StudentRecordCreateSafeDisplay(
            student_id=item.student_id,
            course_abbv=item.course_abbv,
            alumni_id=item.alumni_id,
        )
        try:
            with session.begin_nested():
                course = _resolve_course(session, item.course_abbv)
                if not course:
                    results.append(StudentRecordBatchCreateItem(
                        index=index, item=safe, success=False,
                        code=ErrorCode.DEGREE_NOT_FOUND.value,
                        message=f"Course '{item.course_abbv}' not found", data=None,
                    ))
                    failed_count += 1
                    continue

                alumni = _resolve_alumni(session, item.alumni_id)
                if not alumni:
                    results.append(StudentRecordBatchCreateItem(
                        index=index, item=safe, success=False,
                        code=ErrorCode.ALUMNI_NOT_FOUND.value,
                        message=f"Alumni '{item.alumni_id}' not found", data=None,
                    ))
                    failed_count += 1
                    continue

                student_dict = item.model_dump(exclude={"alumni_id", "course_abbv"})
                student_dict["course_code"] = course.course_code
                student_dict["alumni_code"] = alumni.alumni_code
                new_student = StudentRecord.model_validate(student_dict)
                session.add(new_student)
                session.flush()
                alumni.student_code = new_student.student_code
                session.add(alumni)
                session.flush()
                session.refresh(new_student)

                results.append(StudentRecordBatchCreateItem(
                    index=index, item=safe, success=True,
                    code=SuccessCode.STUDENT_RECORD_CREATED.value,
                    message="Student record created successfully",
                    data=StudentRecordPublic.model_validate(new_student),
                ))
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if "ix_student_records_student_id" in error_str or "student_records_student_id_key" in error_str:
                code = ErrorCode.DUPLICATE_STUDENT_ID.value
                msg = f"Student ID '{item.student_id}' already exists"
            elif "student_records_alumni_code_key" in error_str:
                code = ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value
                msg = "This alumni already has a student record"
            else:
                code = ErrorCode.INVALID_INPUT.value
                msg = "Student record creation failed due to constraint violation"
            results.append(StudentRecordBatchCreateItem(
                index=index, item=safe, success=False, code=code, message=msg, data=None
            ))
            failed_count += 1

        except ValueError as e:
            results.append(StudentRecordBatchCreateItem(
                index=index, item=safe, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e), data=None,
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH CREATED student_records",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return StudentRecordBatchCreateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_update_student_records(
    session: Session,
    items: list[StudentRecordBatchUpdateItem],
    performed_by: str | None = None,
) -> StudentRecordBatchUpdateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        safe = StudentRecordUpdateSafeDisplay(
            alumni_id=item.alumni_id,
            year_graduated=item.year_graduated,
            gwa=item.gwa,
        )
        try:
            with session.begin_nested():
                student = get_student_record_by_alumni_id_any(session, item.alumni_id)
                if not student:
                    results.append(StudentRecordBatchUpdateResult(
                        index=index, item=safe, success=False,
                        code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                        message=f"Student record for alumni_id '{item.alumni_id}' not found", data=None,
                    ))
                    failed_count += 1
                    continue

                if item.year_graduated is not None:
                    student.year_graduated = item.year_graduated
                if item.gwa is not None:
                    student.gwa = item.gwa
                if item.avg_prof_grade is not None:
                    student.avg_prof_grade = item.avg_prof_grade
                if item.avg_elec_grade is not None:
                    student.avg_elec_grade = item.avg_elec_grade
                if item.ojt_grade is not None:
                    student.ojt_grade = item.ojt_grade
                if item.leadership_pos is not None:
                    student.leadership_pos = item.leadership_pos
                if item.act_member_pos is not None:
                    student.act_member_pos = item.act_member_pos

                session.add(student)
                session.flush()
                session.refresh(student)

                results.append(StudentRecordBatchUpdateResult(
                    index=index, item=safe, success=True,
                    code=SuccessCode.STUDENT_RECORD_UPDATED.value,
                    message="Student record updated successfully",
                    data=StudentRecordPublic.model_validate(student),
                ))
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if "student_records_alumni_code_key" in error_str:
                code = ErrorCode.ALUMNI_ALREADY_HAS_STUDENT_RECORD.value
                msg = "This alumni already has a student record"
            elif "ix_student_records_student_id" in error_str or "student_records_student_id_key" in error_str:
                code = ErrorCode.DUPLICATE_STUDENT_ID.value
                msg = "Student ID already in use"
            else:
                code = ErrorCode.INVALID_INPUT.value
                msg = "Student record update failed due to constraint violation"
            results.append(StudentRecordBatchUpdateResult(
                index=index, item=safe, success=False, code=code, message=msg, data=None
            ))
            failed_count += 1

        except ValueError as e:
            results.append(StudentRecordBatchUpdateResult(
                index=index, item=safe, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e), data=None,
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH UPDATED student_records",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return StudentRecordBatchUpdateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_delete_student_records(
    session: Session,
    ids: list[str],
    performed_by: str | None = None,
) -> StudentRecordBatchDeleteResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, alumni_id in enumerate(ids):
        try:
            student = get_student_record_by_alumni_id_any(session, alumni_id)
            if not student:
                results.append(StudentRecordBatchDeleteResult(
                    index=index, alumni_id=alumni_id, success=False,
                    code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                    message=f"Student record for alumni_id '{alumni_id}' not found",
                ))
                failed_count += 1
                continue

            if student.is_deleted:
                results.append(StudentRecordBatchDeleteResult(
                    index=index, alumni_id=alumni_id, success=False,
                    code=ErrorCode.ALREADY_DELETED.value,
                    message="Student record is already deleted, cannot delete again",
                ))
                failed_count += 1
                continue

            student.is_deleted = True
            student.deleted_at = get_current_time_gmt8()
            session.add(student)
            session.flush()

            results.append(StudentRecordBatchDeleteResult(
                index=index, alumni_id=alumni_id, success=True,
                code=SuccessCode.STUDENT_RECORD_DELETED.value,
                message="Student record deleted successfully",
            ))
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            results.append(StudentRecordBatchDeleteResult(
                index=index, alumni_id=alumni_id, success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Student record deletion failed due to constraint violation",
            ))
            failed_count += 1

        except ValueError as e:
            results.append(StudentRecordBatchDeleteResult(
                index=index, alumni_id=alumni_id, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e),
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH DELETED student_records",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return StudentRecordBatchDeleteResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_restore_student_records(
    session: Session,
    ids: list[str],
    performed_by: str | None = None,
) -> StudentRecordBatchRestoreResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, alumni_id in enumerate(ids):
        try:
            student = get_student_record_by_alumni_id_any(session, alumni_id)
            if not student:
                results.append(StudentRecordBatchRestoreResult(
                    index=index, alumni_id=alumni_id, success=False,
                    code=ErrorCode.STUDENT_RECORD_NOT_FOUND.value,
                    message=f"Student record for alumni_id '{alumni_id}' not found",
                ))
                failed_count += 1
                continue

            if not student.is_deleted:
                results.append(StudentRecordBatchRestoreResult(
                    index=index, alumni_id=alumni_id, success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"Student record for alumni_id '{alumni_id}' is not deleted",
                ))
                failed_count += 1
                continue

            student.is_deleted = False
            student.deleted_at = None
            session.add(student)
            session.flush()

            results.append(StudentRecordBatchRestoreResult(
                index=index, alumni_id=alumni_id, success=True,
                code=SuccessCode.STUDENT_RECORD_RESTORED.value,
                message="Student record restored successfully",
            ))
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            msg = "Restore failed: Constraint violation or related data issue"
            results.append(StudentRecordBatchRestoreResult(
                index=index, alumni_id=alumni_id, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=msg,
            ))
            log_integrity_error("student_records", "batch_restore", ErrorCode.INVALID_INPUT.value, msg, str(e))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH RESTORED student_records",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return StudentRecordBatchRestoreResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )
