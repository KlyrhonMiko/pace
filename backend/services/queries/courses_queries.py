"""
DB query functions for courses domain.
All session.exec / session.add / session.commit / session.rollback calls live here.
Routers call these functions; they do NOT contain any select/exec logic themselves.
"""

from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError

from models.courses import Course
from models.college_dept import CollegeDept
from models.student_records import StudentRecord
from models.alumni import Alumni
from schemas.courses import (
    CourseCreate,
    CourseUpdate,
    CoursePublic,
    CourseBatchCreateItem,
    CourseBatchCreateResponse,
    CourseBatchUpdateItem,
    CourseBatchUpdateResult,
    CourseBatchUpdateResponse,
    CourseBatchDeleteResult,
    CourseBatchDeleteResponse,
    CourseBatchRestoreResult,
    CourseBatchRestoreResponse,
)
from models.response_codes import ErrorCode, SuccessCode
from utils.logging import log_integrity_error
from services.queries.audit import stamp_create, stamp_restore, stamp_soft_delete, stamp_update
from services.queries.transaction_logs_queries import create_transaction_log


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------


def generate_course_id(session: Session) -> str:
    """Generate course_id with auto-increment (format: CRS-000001)"""
    last = session.exec(select(Course).order_by(Course.course_id.desc())).first()

    if last and last.course_id.startswith("CRS-"):
        new_num = int(last.course_id.split("-")[1]) + 1
    else:
        new_num = 1

    return f"CRS-{new_num:06d}"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def get_college_dept_by_abbv(session: Session, abbv: str) -> CollegeDept | None:
    """Look up a college department by abbreviation."""
    return session.exec(
        select(CollegeDept).where(CollegeDept.college_dept_abbv == abbv.upper())
    ).first()


def get_college_dept_by_ref_id(session: Session, college_dept_ref_id) -> CollegeDept | None:
    """Look up a college department by its internal UUID id."""
    return session.exec(
        select(CollegeDept).where(CollegeDept.id == college_dept_ref_id)
    ).first()


def build_course_public(
    course: Course, college_dept: CollegeDept | None, alumni_count: int = 0
) -> CoursePublic:
    """Build a CoursePublic response, resolving college dept display fields."""
    return CoursePublic(
        **course.model_dump(exclude={"college_dept_ref_id"}),
        college_dept_id=college_dept.college_dept_id if college_dept else "UNKNOWN",
        college_dept_abbv=college_dept.college_dept_abbv if college_dept else "UNK",
        college_dept_name=college_dept.college_dept_name
        if college_dept
        else "Unknown Department",
        alumni_count=alumni_count,
    )


def has_active_student_records(session: Session, course: Course) -> bool:
    """Return True if this course has at least one active student record."""
    result = session.exec(
        select(StudentRecord).where(
            (StudentRecord.course_ref_id == course.id)
            & (StudentRecord.is_deleted == False)
        )
    ).first()
    return result is not None


# ---------------------------------------------------------------------------
# Single-record operations
# ---------------------------------------------------------------------------


def get_course_by_id(session: Session, course_id: str) -> tuple[Course, int] | None:
    """Fetch a single active course by its human-readable ID with alumni count."""
    # Alumni count subquery for this specific course
    alumni_subq = (
        select(func.count(Alumni.id))
        .join(StudentRecord, StudentRecord.alumni_ref_id == Alumni.id)
        .join(Course, Course.id == StudentRecord.course_ref_id)
        .where(
            (Course.course_id == course_id.upper())
            & (Alumni.is_deleted == False)
        )
    ).scalar_subquery()

    query = select(Course, alumni_subq).where(
        (Course.course_id == course_id.upper())
        & (Course.is_deleted == False)
    )
    
    result = session.exec(query).first()
    if result:
        course, count = result
        return course, count or 0
    return None


def get_course_by_id_any(session: Session, course_id: str) -> Course | None:
    """Fetch a course by ID regardless of deletion status."""
    return session.exec(
        select(Course).where(Course.course_id == course_id.upper())
    ).first()


def create_course(
    session: Session,
    data: CourseCreate,
    performed_by: str | None = None,
) -> tuple[Course, CollegeDept]:
    """Create a new course, returning (course, college_dept) for response building."""
    college_dept = get_college_dept_by_abbv(session, data.college_dept_abbv)
    if not college_dept:
        raise ValueError(f"College department '{data.college_dept_abbv}' not found")

    course_id = generate_course_id(session)
    course_dict = data.model_dump(exclude={"college_dept_abbv"})
    course_dict["course_id"] = course_id
    course_dict["college_dept_ref_id"] = college_dept.id

    new_course = Course.model_validate(course_dict)
    stamp_create(new_course, performed_by)
    session.add(new_course)
    create_transaction_log(
        session,
        tl_name=f"CREATED course {new_course.course_id}",
        after=new_course,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(new_course)
    return new_course, college_dept


def update_course(
    session: Session,
    course: Course,
    data: CourseUpdate,
    performed_by: str | None = None,
) -> tuple[Course, CollegeDept]:
    """Apply partial update to a course and commit. Returns (course, college_dept)."""
    before_state = course.model_dump(mode="json")
    college_dept = None
    if data.college_dept_abbv is not None:
        college_dept = get_college_dept_by_abbv(session, data.college_dept_abbv)
        if not college_dept:
            raise ValueError(f"College department '{data.college_dept_abbv}' not found")
        course.college_dept_ref_id = college_dept.id

    if data.course_abbv is not None:
        course.course_abbv = data.course_abbv
    if data.course_name is not None:
        course.course_name = data.course_name
    if data.course_desc is not None:
        course.course_desc = data.course_desc

    stamp_update(course)
    session.add(course)
    create_transaction_log(
        session,
        tl_name=f"UPDATED course {course.course_id}",
        before=before_state,
        after=course,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(course)

    if college_dept is None:
        college_dept = get_college_dept_by_ref_id(session, course.college_dept_ref_id)

    return course, college_dept


def soft_delete_course(
    session: Session,
    course: Course,
    performed_by: str | None = None,
) -> None:
    """Soft-delete a course."""
    stamp_soft_delete(course, performed_by)
    session.add(course)
    create_transaction_log(
        session,
        tl_name=f"DELETED course {course.course_id}",
        after=course,
        performed_by=performed_by,
    )
    session.commit()


def restore_course(
    session: Session,
    course: Course,
    performed_by: str | None = None,
) -> None:
    """Restore a soft-deleted course."""
    stamp_restore(course)
    session.add(course)
    create_transaction_log(
        session,
        tl_name=f"RESTORED course {course.course_id}",
        after=course,
        performed_by=performed_by,
    )
    session.commit()


# ---------------------------------------------------------------------------
# List / pagination
# ---------------------------------------------------------------------------


def get_all_courses(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    college_dept_abbv: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
    deleted_only: bool = False,
) -> tuple[list[CoursePublic], int]:
    """
    Return (CoursePublic list, total_count) with filtering, search, sort, pagination.
    Resolves college dept names in one pass.
    """
    if deleted_only:
        base_filter = Course.is_deleted == True
    elif include_deleted:
        base_filter = None
    else:
        base_filter = Course.is_deleted == False

    # Alumni count subquery per course
    alumni_subq = (
        select(
            StudentRecord.course_ref_id,
            func.count(Alumni.id).label("alumni_count")
        )
        .join(Alumni, Alumni.id == StudentRecord.alumni_ref_id)
        .where(Alumni.is_deleted == False)
        .group_by(StudentRecord.course_ref_id)
        .subquery()
    )

    # Main query
    query = select(Course, func.coalesce(alumni_subq.c.alumni_count, 0))
    query = query.outerjoin(alumni_subq, alumni_subq.c.course_ref_id == Course.id)
    
    count_q = select(func.count(Course.id))

    if base_filter is not None:
        query = query.where(base_filter)
        count_q = count_q.where(base_filter)

    if search:
        like = f"%{search}%"
        query = query.where(
            (Course.course_abbv.ilike(like))
            | (Course.course_name.ilike(like))
            | (Course.course_desc.ilike(like))
        )
        count_q = count_q.where(
            (Course.course_abbv.ilike(like))
            | (Course.course_name.ilike(like))
            | (Course.course_desc.ilike(like))
        )

    if college_dept_abbv:
        dept = get_college_dept_by_abbv(session, college_dept_abbv)
        if dept:
            query = query.where(Course.college_dept_ref_id == dept.id)
            count_q = count_q.where(Course.college_dept_ref_id == dept.id)

    total = session.exec(count_q).one()

    desc = sort_order.lower() == "desc"
    if sort_by.lower() == "course_abbv":
        query = query.order_by(
            Course.course_abbv.desc() if desc else Course.course_abbv
        )
    elif sort_by.lower() == "course_name":
        query = query.order_by(
            Course.course_name.desc() if desc else Course.course_name
        )
    elif sort_by.lower() == "deleted_at":
        query = query.order_by(Course.deleted_at.desc() if desc else Course.deleted_at)
    elif sort_by.lower() == "alumni_count":
        query = query.order_by(
            alumni_subq.c.alumni_count.desc() if desc else alumni_subq.c.alumni_count
        )
    else:
        query = query.order_by(Course.course_id.desc() if desc else Course.course_id)

    if limit > 0:
        query = query.offset(offset).limit(limit)

    results = session.exec(query).all()
    result_list = []
    for course, count in results:
        dept = get_college_dept_by_ref_id(session, course.college_dept_ref_id)
        result_list.append(build_course_public(course, dept, alumni_count=count))

    return result_list, total


# ---------------------------------------------------------------------------
# Batch operations
# ---------------------------------------------------------------------------


def batch_create_courses(
    session: Session,
    items: list[CourseCreate],
    performed_by: str | None = None,
) -> CourseBatchCreateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        try:
            with session.begin_nested():
                college_dept = get_college_dept_by_abbv(session, item.college_dept_abbv)
                if not college_dept:
                    results.append(
                        CourseBatchCreateItem(
                            index=index,
                            item=item,
                            success=False,
                            code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value,
                            message=f"College department '{item.college_dept_abbv}' not found",
                            data=None,
                        )
                    )
                    failed_count += 1
                    continue

                course_id = generate_course_id(session)
                course_dict = item.model_dump(exclude={"college_dept_abbv"})
                course_dict["course_id"] = course_id
                course_dict["college_dept_ref_id"] = college_dept.id

                new_course = Course.model_validate(course_dict)
                stamp_create(new_course, performed_by)
                session.add(new_course)
                session.flush()
                session.refresh(new_course)

                results.append(
                    CourseBatchCreateItem(
                        index=index,
                        item=item,
                        success=True,
                        code=SuccessCode.COURSE_CREATED.value,
                        message="Course created successfully",
                        data=build_course_public(new_course, college_dept),
                    )
                )
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if (
                "ix_courses_course_abbv" in error_str
                or "courses_course_abbv_key" in error_str
            ):
                code = ErrorCode.DUPLICATE_COURSE_ABBV.value
                msg = f"Course abbreviation '{item.course_abbv}' already exists"
            elif (
                "ix_courses_course_name" in error_str
                or "courses_course_name_key" in error_str
            ):
                code = ErrorCode.DUPLICATE_COURSE_NAME.value
                msg = f"Course name '{item.course_name}' already exists"
            else:
                code = ErrorCode.INVALID_INPUT.value
                msg = "Course creation failed due to constraint violation"
            results.append(
                CourseBatchCreateItem(
                    index=index,
                    item=item,
                    success=False,
                    code=code,
                    message=msg,
                    data=None,
                )
            )
            failed_count += 1

        except ValueError as e:
            results.append(
                CourseBatchCreateItem(
                    index=index,
                    item=item,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=str(e),
                    data=None,
                )
            )
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH CREATED courses",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return CourseBatchCreateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_update_courses(
    session: Session,
    items: list[CourseBatchUpdateItem],
    performed_by: str | None = None,
) -> CourseBatchUpdateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        try:
            with session.begin_nested():
                course = session.exec(
                    select(Course).where(Course.course_id == item.course_id.upper())
                ).first()

                if not course:
                    results.append(
                        CourseBatchUpdateResult(
                            index=index,
                            course_id=item.course_id,
                            success=False,
                            code=ErrorCode.COURSE_NOT_FOUND.value,
                            message=f"Course '{item.course_id}' not found",
                            data=None,
                        )
                    )
                    failed_count += 1
                    continue

                college_dept = None
                if item.college_dept_abbv is not None:
                    college_dept = get_college_dept_by_abbv(
                        session, item.college_dept_abbv
                    )
                    if not college_dept:
                        results.append(
                            CourseBatchUpdateResult(
                                index=index,
                                course_id=item.course_id,
                                success=False,
                                code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value,
                                message=f"College department '{item.college_dept_abbv}' not found",
                                data=None,
                            )
                        )
                        failed_count += 1
                        continue
                    course.college_dept_ref_id = college_dept.id
                else:
                    college_dept = get_college_dept_by_ref_id(
                        session, course.college_dept_ref_id
                    )

                if item.course_abbv is not None:
                    course.course_abbv = item.course_abbv
                if item.course_name is not None:
                    course.course_name = item.course_name
                if item.course_desc is not None:
                    course.course_desc = item.course_desc

                stamp_update(course)
                session.add(course)
                session.flush()
                session.refresh(course)

                results.append(
                    CourseBatchUpdateResult(
                        index=index,
                        course_id=item.course_id,
                        success=True,
                        code=SuccessCode.COURSE_UPDATED.value,
                        message="Course updated successfully",
                        data=build_course_public(course, college_dept),
                    )
                )
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if (
                "ix_courses_course_abbv" in error_str
                or "courses_course_abbv_key" in error_str
            ):
                code = ErrorCode.DUPLICATE_COURSE_ABBV.value
                msg = "Course abbreviation already in use"
            elif (
                "ix_courses_course_name" in error_str
                or "courses_course_name_key" in error_str
            ):
                code = ErrorCode.DUPLICATE_COURSE_NAME.value
                msg = "Course name already in use"
            else:
                code = ErrorCode.INVALID_INPUT.value
                msg = "Update failed due to constraint violation"
            results.append(
                CourseBatchUpdateResult(
                    index=index,
                    course_id=item.course_id,
                    success=False,
                    code=code,
                    message=msg,
                    data=None,
                )
            )
            failed_count += 1

        except ValueError as e:
            results.append(
                CourseBatchUpdateResult(
                    index=index,
                    course_id=item.course_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=str(e),
                    data=None,
                )
            )
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH UPDATED courses",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return CourseBatchUpdateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_delete_courses(
    session: Session,
    ids: list[str],
    performed_by: str | None = None,
) -> CourseBatchDeleteResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, course_id in enumerate(ids):
        try:
            course = session.exec(
                select(Course).where(Course.course_id == course_id.upper())
            ).first()

            if not course:
                results.append(
                    CourseBatchDeleteResult(
                        index=index,
                        course_id=course_id,
                        success=False,
                        code=ErrorCode.COURSE_NOT_FOUND.value,
                        message=f"Course '{course_id}' not found",
                    )
                )
                failed_count += 1
                continue

            if course.is_deleted:
                results.append(
                    CourseBatchDeleteResult(
                        index=index,
                        course_id=course_id,
                        success=False,
                        code=ErrorCode.ALREADY_DELETED.value,
                        message="Course is already deleted, cannot delete again",
                    )
                )
                failed_count += 1
                continue

            if has_active_student_records(session, course):
                results.append(
                    CourseBatchDeleteResult(
                        index=index,
                        course_id=course_id,
                        success=False,
                        code=ErrorCode.CANNOT_DELETE_COURSE_WITH_ACTIVE_STUDENT_RECORDS.value,
                        message="Cannot delete course with active student records",
                    )
                )
                failed_count += 1
                continue

            stamp_soft_delete(course, performed_by)
            session.add(course)
            session.flush()

            results.append(
                CourseBatchDeleteResult(
                    index=index,
                    course_id=course_id,
                    success=True,
                    code=SuccessCode.COURSE_DELETED.value,
                    message="Course deleted successfully",
                )
            )
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            results.append(
                CourseBatchDeleteResult(
                    index=index,
                    course_id=course_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Delete failed: Constraint violation or related data exists",
                )
            )
            failed_count += 1

        except Exception as e:
            session.rollback()
            results.append(
                CourseBatchDeleteResult(
                    index=index,
                    course_id=course_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"Delete failed: {str(e)}",
                )
            )
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH DELETED courses",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return CourseBatchDeleteResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_restore_courses(
    session: Session,
    ids: list[str],
    performed_by: str | None = None,
) -> CourseBatchRestoreResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, course_id in enumerate(ids):
        try:
            course = session.exec(
                select(Course).where(Course.course_id == course_id.upper())
            ).first()

            if not course:
                results.append(
                    CourseBatchRestoreResult(
                        index=index,
                        course_id=course_id,
                        success=False,
                        code=ErrorCode.COURSE_NOT_FOUND.value,
                        message=f"Course '{course_id}' not found",
                    )
                )
                failed_count += 1
                continue

            if not course.is_deleted:
                results.append(
                    CourseBatchRestoreResult(
                        index=index,
                        course_id=course_id,
                        success=False,
                        code=ErrorCode.INVALID_INPUT.value,
                        message=f"Course '{course_id}' is not deleted",
                    )
                )
                failed_count += 1
                continue

            stamp_restore(course)
            session.add(course)
            session.flush()

            results.append(
                CourseBatchRestoreResult(
                    index=index,
                    course_id=course_id,
                    success=True,
                    code=SuccessCode.COURSE_RESTORED.value,
                    message="Course restored successfully",
                )
            )
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            msg = "Restore failed: Constraint violation or related data issue"
            results.append(
                CourseBatchRestoreResult(
                    index=index,
                    course_id=course_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=msg,
                )
            )
            log_integrity_error(
                "courses",
                "batch_restore_courses",
                ErrorCode.INVALID_INPUT.value,
                msg,
                str(e),
            )
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH RESTORED courses",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return CourseBatchRestoreResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )
