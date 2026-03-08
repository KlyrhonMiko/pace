"""
DB query functions for college_dept domain.
All session.exec / session.add / session.commit / session.rollback calls live here.
Routers call these functions; they do NOT contain any select/exec logic themselves.
"""

from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError

from models.college_dept import CollegeDept
from models.courses import Course
from schemas.college_dept import (
    CollegeDeptCreate,
    CollegeDeptUpdate,
    CollegeDeptPublic,
    CollegeDeptBatchCreateItem,
    CollegeDeptBatchCreateResponse,
    CollegeDeptBatchUpdateItem,
    CollegeDeptBatchUpdateResult,
    CollegeDeptBatchUpdateResponse,
    CollegeDeptBatchDeleteResult,
    CollegeDeptBatchDeleteResponse,
    CollegeDeptBatchRestoreResult,
    CollegeDeptBatchRestoreResponse,
)
from models.response_codes import ErrorCode, SuccessCode
from models.pagination import PaginationMetadata
from utils.logging import log_integrity_error
from utils.timezone import get_current_time_gmt8


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------


def generate_college_dept_id(session: Session) -> str:
    """Generate college_dept_id with auto-increment (format: CLG-000001)"""
    last = session.exec(
        select(CollegeDept).order_by(CollegeDept.college_dept_id.desc())
    ).first()

    if last and last.college_dept_id.startswith("CLG-"):
        new_num = int(last.college_dept_id.split("-")[1]) + 1
    else:
        new_num = 1

    return f"CLG-{new_num:06d}"


# ---------------------------------------------------------------------------
# Single-record operations
# ---------------------------------------------------------------------------


def get_college_dept_by_id(
    session: Session, college_dept_id: str
) -> CollegeDept | None:
    """Fetch a single active college department by its human-readable ID."""
    return session.exec(
        select(CollegeDept).where(
            (CollegeDept.college_dept_id == college_dept_id.upper())
            & (CollegeDept.is_deleted == False)
        )
    ).first()


def get_college_dept_by_id_any(
    session: Session, college_dept_id: str
) -> CollegeDept | None:
    """Fetch a college department by ID regardless of deletion status."""
    return session.exec(
        select(CollegeDept).where(
            CollegeDept.college_dept_id == college_dept_id.upper()
        )
    ).first()


def create_college_dept(session: Session, data: CollegeDeptCreate) -> CollegeDept:
    """Create a new college department and return the persisted record."""
    college_dept_id = generate_college_dept_id(session)
    college_dept_dict = data.model_dump()
    college_dept_dict["college_dept_id"] = college_dept_id
    new_dept = CollegeDept.model_validate(college_dept_dict)
    session.add(new_dept)
    session.commit()
    session.refresh(new_dept)
    return new_dept


def update_college_dept(
    session: Session, college_dept: CollegeDept, data: CollegeDeptUpdate
) -> CollegeDept:
    """Apply partial update to a college department and commit."""
    if data.college_dept_abbv is not None:
        college_dept.college_dept_abbv = data.college_dept_abbv
    if data.college_dept_name is not None:
        college_dept.college_dept_name = data.college_dept_name
    if data.college_dept_desc is not None:
        college_dept.college_dept_desc = data.college_dept_desc

    college_dept.updated_at = get_current_time_gmt8()
    session.add(college_dept)
    session.commit()
    session.refresh(college_dept)
    return college_dept


def soft_delete_college_dept(session: Session, college_dept: CollegeDept) -> None:
    """Soft-delete a college department (sets is_deleted=True)."""
    college_dept.is_deleted = True
    college_dept.deleted_at = get_current_time_gmt8()
    session.add(college_dept)
    session.commit()


def restore_college_dept(session: Session, college_dept: CollegeDept) -> None:
    """Restore a soft-deleted college department."""
    college_dept.is_deleted = False
    college_dept.deleted_at = None
    session.add(college_dept)
    session.commit()


def has_active_courses(session: Session, college_dept: CollegeDept) -> bool:
    """Return True if this department has at least one active (non-deleted) course."""
    result = session.exec(
        select(Course).where(
            (Course.college_dept_code == college_dept.college_dept_code)
            & (Course.is_deleted == False)
        )
    ).first()
    return result is not None


# ---------------------------------------------------------------------------
# List / pagination
# ---------------------------------------------------------------------------


def get_all_college_depts(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
    deleted_only: bool = False,
) -> tuple[list[CollegeDept], int]:
    """
    Return (records, total_count) with filtering, search, sort, and pagination.
    """
    if deleted_only:
        base_filter = CollegeDept.is_deleted == True
    elif include_deleted:
        base_filter = None
    else:
        base_filter = CollegeDept.is_deleted == False

    query = select(CollegeDept)
    count_q = select(func.count(CollegeDept.college_dept_code))
    if base_filter is not None:
        query = query.where(base_filter)
        count_q = count_q.where(base_filter)

    if search:
        like = f"%{search}%"
        query = query.where(
            (CollegeDept.college_dept_abbv.ilike(like))
            | (CollegeDept.college_dept_name.ilike(like))
            | (CollegeDept.college_dept_desc.ilike(like))
        )

    total = session.exec(count_q).one()

    desc = sort_order.lower() == "desc"
    if sort_by.lower() == "college_dept_abbv":
        query = query.order_by(
            CollegeDept.college_dept_abbv.desc()
            if desc
            else CollegeDept.college_dept_abbv
        )
    elif sort_by.lower() == "college_dept_name":
        query = query.order_by(
            CollegeDept.college_dept_name.desc()
            if desc
            else CollegeDept.college_dept_name
        )
    elif sort_by.lower() == "deleted_at":
        query = query.order_by(
            CollegeDept.deleted_at.desc() if desc else CollegeDept.deleted_at
        )
    else:
        query = query.order_by(
            CollegeDept.college_dept_id.desc() if desc else CollegeDept.college_dept_id
        )

    if limit > 0:
        query = query.offset(offset).limit(limit)

    return session.exec(query).all(), total


# ---------------------------------------------------------------------------
# Batch operations
# ---------------------------------------------------------------------------


def batch_create_college_depts(
    session: Session,
    items: list[CollegeDeptCreate],
) -> CollegeDeptBatchCreateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        try:
            with session.begin_nested():
                college_dept_id = generate_college_dept_id(session)
                dept_dict = item.model_dump()
                dept_dict["college_dept_id"] = college_dept_id
                new_dept = CollegeDept.model_validate(dept_dict)
                session.add(new_dept)
                session.flush()
                session.refresh(new_dept)

                results.append(
                    CollegeDeptBatchCreateItem(
                        index=index,
                        item=item,
                        success=True,
                        code=SuccessCode.COLLEGE_DEPT_CREATED.value,
                        message="College department created successfully",
                        data=CollegeDeptPublic.model_validate(new_dept),
                    )
                )
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if (
                "ix_college_depts_college_dept_abbv" in error_str
                or "college_depts_college_dept_abbv_key" in error_str
            ):
                code = ErrorCode.DUPLICATE_COLLEGE_DEPT_ABBV.value
                msg = f"College department abbreviation '{item.college_dept_abbv}' already exists"
            elif (
                "ix_college_depts_college_dept_name" in error_str
                or "college_depts_college_dept_name_key" in error_str
            ):
                code = ErrorCode.DUPLICATE_COLLEGE_DEPT_NAME.value
                msg = (
                    f"College department name '{item.college_dept_name}' already exists"
                )
            else:
                code = ErrorCode.INVALID_INPUT.value
                msg = "College department creation failed due to constraint violation"
            results.append(
                CollegeDeptBatchCreateItem(
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
                CollegeDeptBatchCreateItem(
                    index=index,
                    item=item,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=str(e),
                    data=None,
                )
            )
            failed_count += 1

    session.commit()
    return CollegeDeptBatchCreateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_update_college_depts(
    session: Session,
    items: list[CollegeDeptBatchUpdateItem],
) -> CollegeDeptBatchUpdateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        try:
            with session.begin_nested():
                dept = session.exec(
                    select(CollegeDept).where(
                        CollegeDept.college_dept_id == item.college_dept_id.upper()
                    )
                ).first()

                if not dept:
                    results.append(
                        CollegeDeptBatchUpdateResult(
                            index=index,
                            college_dept_id=item.college_dept_id,
                            success=False,
                            code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value,
                            message=f"College department '{item.college_dept_id}' not found",
                            data=None,
                        )
                    )
                    failed_count += 1
                    continue

                if item.college_dept_abbv is not None:
                    dept.college_dept_abbv = item.college_dept_abbv
                if item.college_dept_name is not None:
                    dept.college_dept_name = item.college_dept_name
                if item.college_dept_desc is not None:
                    dept.college_dept_desc = item.college_dept_desc

                dept.updated_at = get_current_time_gmt8()
                session.add(dept)
                session.flush()
                session.refresh(dept)

                results.append(
                    CollegeDeptBatchUpdateResult(
                        index=index,
                        college_dept_id=item.college_dept_id,
                        success=True,
                        code=SuccessCode.COLLEGE_DEPT_UPDATED.value,
                        message="College department updated successfully",
                        data=CollegeDeptPublic.model_validate(dept),
                    )
                )
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if (
                "ix_college_depts_college_dept_abbv" in error_str
                or "college_depts_college_dept_abbv_key" in error_str
            ):
                code = ErrorCode.DUPLICATE_COLLEGE_DEPT_ABBV.value
                msg = "College department abbreviation already in use"
            elif (
                "ix_college_depts_college_dept_name" in error_str
                or "college_depts_college_dept_name_key" in error_str
            ):
                code = ErrorCode.DUPLICATE_COLLEGE_DEPT_NAME.value
                msg = "College department name already in use"
            else:
                code = ErrorCode.INVALID_INPUT.value
                msg = "Update failed due to constraint violation"
            results.append(
                CollegeDeptBatchUpdateResult(
                    index=index,
                    college_dept_id=item.college_dept_id,
                    success=False,
                    code=code,
                    message=msg,
                    data=None,
                )
            )
            failed_count += 1

        except ValueError as e:
            results.append(
                CollegeDeptBatchUpdateResult(
                    index=index,
                    college_dept_id=item.college_dept_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=str(e),
                    data=None,
                )
            )
            failed_count += 1

    session.commit()
    return CollegeDeptBatchUpdateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_delete_college_depts(
    session: Session,
    ids: list[str],
) -> CollegeDeptBatchDeleteResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, college_dept_id in enumerate(ids):
        try:
            dept = session.exec(
                select(CollegeDept).where(
                    CollegeDept.college_dept_id == college_dept_id.upper()
                )
            ).first()

            if not dept:
                results.append(
                    CollegeDeptBatchDeleteResult(
                        index=index,
                        college_dept_id=college_dept_id,
                        success=False,
                        code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value,
                        message=f"College department '{college_dept_id}' not found",
                    )
                )
                failed_count += 1
                continue

            if dept.is_deleted:
                results.append(
                    CollegeDeptBatchDeleteResult(
                        index=index,
                        college_dept_id=college_dept_id,
                        success=False,
                        code=ErrorCode.ALREADY_DELETED.value,
                        message="College department is already deleted, cannot delete again",
                    )
                )
                failed_count += 1
                continue

            if has_active_courses(session, dept):
                results.append(
                    CollegeDeptBatchDeleteResult(
                        index=index,
                        college_dept_id=college_dept_id,
                        success=False,
                        code=ErrorCode.CANNOT_DELETE_COLLEGE_DEPT_WITH_ACTIVE_COURSES.value,
                        message="Cannot delete college department with active courses",
                    )
                )
                failed_count += 1
                continue

            dept.is_deleted = True
            dept.deleted_at = get_current_time_gmt8()
            session.add(dept)
            session.flush()

            results.append(
                CollegeDeptBatchDeleteResult(
                    index=index,
                    college_dept_id=college_dept_id,
                    success=True,
                    code=SuccessCode.COLLEGE_DEPT_DELETED.value,
                    message="College department deleted successfully",
                )
            )
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            results.append(
                CollegeDeptBatchDeleteResult(
                    index=index,
                    college_dept_id=college_dept_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Delete failed: Constraint violation or related data exists",
                )
            )
            failed_count += 1

        except Exception as e:
            session.rollback()
            results.append(
                CollegeDeptBatchDeleteResult(
                    index=index,
                    college_dept_id=college_dept_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"Delete failed: {str(e)}",
                )
            )
            failed_count += 1

    session.commit()
    return CollegeDeptBatchDeleteResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_restore_college_depts(
    session: Session,
    ids: list[str],
) -> CollegeDeptBatchRestoreResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, college_dept_id in enumerate(ids):
        try:
            dept = session.exec(
                select(CollegeDept).where(
                    CollegeDept.college_dept_id == college_dept_id.upper()
                )
            ).first()

            if not dept:
                results.append(
                    CollegeDeptBatchRestoreResult(
                        index=index,
                        college_dept_id=college_dept_id,
                        success=False,
                        code=ErrorCode.COLLEGE_DEPT_NOT_FOUND.value,
                        message=f"College department '{college_dept_id}' not found",
                    )
                )
                failed_count += 1
                continue

            if not dept.is_deleted:
                results.append(
                    CollegeDeptBatchRestoreResult(
                        index=index,
                        college_dept_id=college_dept_id,
                        success=False,
                        code=ErrorCode.INVALID_INPUT.value,
                        message=f"College department '{college_dept_id}' is not deleted",
                    )
                )
                failed_count += 1
                continue

            dept.is_deleted = False
            dept.deleted_at = None
            session.add(dept)
            session.flush()

            results.append(
                CollegeDeptBatchRestoreResult(
                    index=index,
                    college_dept_id=college_dept_id,
                    success=True,
                    code=SuccessCode.COLLEGE_DEPT_RESTORED.value,
                    message="College department restored successfully",
                )
            )
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            msg = "Restore failed: Constraint violation or related data issue"
            results.append(
                CollegeDeptBatchRestoreResult(
                    index=index,
                    college_dept_id=college_dept_id,
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=msg,
                )
            )
            log_integrity_error(
                "college_depts",
                "batch_restore_college_depts",
                ErrorCode.INVALID_INPUT.value,
                msg,
                str(e),
            )
            failed_count += 1

    session.commit()
    return CollegeDeptBatchRestoreResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )
