"""
DB query functions for alumni domain (covers composite register too).
"""
from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError

from models.alumni import Alumni
from models.users import User, UserType
from models.student_records import StudentRecord
from models.courses import Course
from models.responses import AlumniFullProfile
from schemas.alumni import AlumniUpdate, AlumniPublic
from schemas.composite import (
    BatchAlumniRegistrationItem, BatchAlumniRegistrationItemSafeDisplay,
    BatchAlumniRegistrationResult, BatchAlumniRegisterResponse,
    BatchAlumniUpdateItem, BatchAlumniUpdateResult, BatchAlumniUpdateResponse,
    BatchAlumniDeleteResult, BatchAlumniDeleteResponse,
    BatchAlumniRestoreResult, BatchAlumniRestoreResponse,
)
from models.response_codes import ErrorCode, SuccessCode
from utils.auth import hash_password
from utils.logging import log_integrity_error
from utils.timezone import get_current_time_gmt8
from services.queries.transaction_logs_queries import create_transaction_log
from datetime import date


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------

def generate_user_id(session: Session) -> str:
    """Auto-increment USER-type user ID."""
    last_user = session.exec(
        select(User).where(User.user_type == UserType.USER).order_by(User.user_id.desc())
    ).first()
    new_num = (int(last_user.user_id.split("-")[1]) + 1) if last_user else 1
    return f"USER-{new_num:06d}"


def generate_alumni_id(session: Session) -> str:
    """Auto-increment ALMN-xxxxxx alumni ID."""
    last_alumni = session.exec(
        select(Alumni).order_by(Alumni.alumni_id.desc())
    ).first()
    if last_alumni and last_alumni.alumni_id.startswith("ALMN-"):
        new_num = int(last_alumni.alumni_id.split("-")[1]) + 1
    else:
        new_num = 1
    return f"ALMN-{new_num:06d}"


# ---------------------------------------------------------------------------
# Full profile builder (reused across multiple endpoints)
# ---------------------------------------------------------------------------

def build_full_profile(session: Session, alumni: Alumni) -> AlumniFullProfile:
    """Build an AlumniFullProfile by joining User, StudentRecord, and Course."""
    student = None
    course = None
    if alumni.student_code:
        student = session.exec(
            select(StudentRecord).where(StudentRecord.student_code == alumni.student_code)
        ).first()
        if student:
            course = session.exec(
                select(Course).where(Course.course_code == student.course_code)
            ).first()

    user = None
    if alumni.user_code:
        user = session.exec(
            select(User).where(User.user_code == alumni.user_code)
        ).first()

    return AlumniFullProfile(
        alumni_id=alumni.alumni_id,
        last_name=alumni.last_name,
        first_name=alumni.first_name,
        middle_name=alumni.middle_name,
        gender=alumni.gender,
        age=alumni.age,
        birthdate=alumni.birthdate,
        consent_for_survey_ml=alumni.consent_for_survey_ml,
        user_id=user.user_id if user else None,
        username=user.username if user else None,
        email=user.email if user else None,
        student_id=student.student_id if student else None,
        year_graduated=student.year_graduated if student else None,
        gwa=student.gwa if student else None,
        avg_prof_grade=student.avg_prof_grade if student else None,
        avg_elec_grade=student.avg_elec_grade if student else None,
        ojt_grade=student.ojt_grade if student else None,
        leadership_pos=student.leadership_pos if student else None,
        act_member_pos=student.act_member_pos if student else None,
        course_id=course.course_id if course else None,
        course_name=course.course_name if course else None,
        created_at=alumni.created_at,
        updated_at=alumni.updated_at,
    )


# ---------------------------------------------------------------------------
# Cascade helpers
# ---------------------------------------------------------------------------

def _cascade_soft_delete_alumni(session: Session, alumni: Alumni) -> None:
    student_records = session.exec(
        select(StudentRecord).where(StudentRecord.alumni_code == alumni.alumni_code)
    ).all()
    for student in student_records:
        if not student.is_deleted:
            student.is_deleted = True
            student.deleted_at = get_current_time_gmt8()
            session.add(student)


def _cascade_restore_alumni(session: Session, alumni: Alumni) -> None:
    student_records = session.exec(
        select(StudentRecord).where(
            (StudentRecord.alumni_code == alumni.alumni_code) &
            (StudentRecord.is_deleted == True)
        )
    ).all()
    for student in student_records:
        student.is_deleted = False
        student.deleted_at = None
        session.add(student)


# ---------------------------------------------------------------------------
# Single-record lookups
# ---------------------------------------------------------------------------

def get_alumni_by_id(session: Session, alumni_id: str) -> Alumni | None:
    return session.exec(
        select(Alumni).where(
            (Alumni.alumni_id == alumni_id.upper()) & (Alumni.is_deleted == False)
        )
    ).first()


def get_alumni_by_id_any(session: Session, alumni_id: str) -> Alumni | None:
    return session.exec(
        select(Alumni).where(Alumni.alumni_id == alumni_id.upper())
    ).first()


# ---------------------------------------------------------------------------
# Single-record mutations
# ---------------------------------------------------------------------------

def register_complete_alumni(
    session: Session,
    username: str,
    email: str,
    password: str,   # already hashed by schema validator
    last_name: str,
    first_name: str,
    middle_name: str | None,
    gender: str,
    age: int,
    birthdate: date | None = None,
    consent_for_survey_ml: bool = False,
    performed_by: str | None = None,
) -> tuple[User, Alumni]:
    """Create User + Alumni atomically. Returns (new_user, new_alumni)."""
    user_id = generate_user_id(session)
    alumni_id = generate_alumni_id(session)

    new_user = User(
        user_id=user_id,
        username=username,
        email=email,
        password=password,
        user_type=UserType.USER,
    )
    session.add(new_user)
    session.flush()

    new_alumni = Alumni(
        alumni_id=alumni_id,
        last_name=last_name,
        first_name=first_name,
        middle_name=middle_name,
        gender=gender,
        age=age,
        birthdate=birthdate,
        consent_for_survey_ml=consent_for_survey_ml,
        user_code=new_user.user_code,
    )
    session.add(new_alumni)
    create_transaction_log(
        session,
        tl_name=f"CREATED alumni {new_alumni.alumni_id}",
        after={"user_id": new_user.user_id, "alumni_id": new_alumni.alumni_id},
        performed_by=performed_by,
    )
    session.commit()
    return new_user, new_alumni


def update_alumni(
    session: Session,
    alumni: Alumni,
    data: AlumniUpdate,
    performed_by: str | None = None,
) -> Alumni:
    if data.last_name is not None:
        alumni.last_name = data.last_name
    if data.first_name is not None:
        alumni.first_name = data.first_name
    if data.middle_name is not None:
        alumni.middle_name = data.middle_name
    if data.gender is not None:
        alumni.gender = data.gender.upper()
    if data.age is not None:
        alumni.age = data.age
    if data.birthdate is not None:
        alumni.birthdate = data.birthdate
    if data.consent_for_survey_ml is not None:
        alumni.consent_for_survey_ml = data.consent_for_survey_ml
    session.add(alumni)
    create_transaction_log(
        session,
        tl_name=f"UPDATED alumni {alumni.alumni_id}",
        after=alumni,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(alumni)
    return alumni


def soft_delete_alumni(
    session: Session,
    alumni: Alumni,
    performed_by: str | None = None,
) -> None:
    _cascade_soft_delete_alumni(session, alumni)
    alumni.is_deleted = True
    alumni.deleted_at = get_current_time_gmt8()
    session.add(alumni)
    create_transaction_log(
        session,
        tl_name=f"DELETED alumni {alumni.alumni_id}",
        after=alumni,
        performed_by=performed_by,
    )
    session.commit()


def restore_alumni(
    session: Session,
    alumni: Alumni,
    performed_by: str | None = None,
) -> None:
    _cascade_restore_alumni(session, alumni)
    alumni.is_deleted = False
    alumni.deleted_at = None
    session.add(alumni)
    create_transaction_log(
        session,
        tl_name=f"RESTORED alumni {alumni.alumni_id}",
        after=alumni,
        performed_by=performed_by,
    )
    session.commit()


# ---------------------------------------------------------------------------
# List / pagination
# ---------------------------------------------------------------------------

def get_all_alumni(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    gender: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
    deleted_only: bool = False,
) -> tuple[list[Alumni], int]:
    if deleted_only:
        base_filter = Alumni.is_deleted == True
    elif include_deleted:
        base_filter = None
    else:
        base_filter = Alumni.is_deleted == False
    query = select(Alumni)
    count_q = select(func.count(Alumni.alumni_code))
    if base_filter is not None:
        query = query.where(base_filter)
        count_q = count_q.where(base_filter)

    if search:
        like = f"%{search}%"
        query = query.where(
            (Alumni.first_name.ilike(like)) | (Alumni.last_name.ilike(like))
        )

    if gender:
        query = query.where(Alumni.gender == gender.upper())

    total = session.exec(count_q).one()

    desc = sort_order.lower() == "desc"
    if sort_by.lower() == "first_name":
        query = query.order_by(Alumni.first_name.desc() if desc else Alumni.first_name)
    elif sort_by.lower() == "last_name":
        query = query.order_by(Alumni.last_name.desc() if desc else Alumni.last_name)
    elif sort_by.lower() == "created_at":
        query = query.order_by(Alumni.created_at.desc() if desc else Alumni.created_at)
    elif sort_by.lower() == "deleted_at":
        query = query.order_by(Alumni.deleted_at.desc() if desc else Alumni.deleted_at)
    else:
        query = query.order_by(Alumni.alumni_id.desc() if desc else Alumni.alumni_id)

    if limit > 0:
        query = query.offset(offset).limit(limit)

    return session.exec(query).all(), total


# ---------------------------------------------------------------------------
# Batch operations
# ---------------------------------------------------------------------------

def batch_register_alumni(
    session: Session,
    items: list[BatchAlumniRegistrationItem],
    performed_by: str | None = None,
) -> BatchAlumniRegisterResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        safe = BatchAlumniRegistrationItemSafeDisplay(
            username=item.username,
            email=item.email,
            last_name=item.last_name,
            first_name=item.first_name,
            middle_name=item.middle_name,
            gender=item.gender,
            age=item.age,
            birthdate=item.birthdate,
            consent_for_survey_ml=item.consent_for_survey_ml,
        )
        try:
            with session.begin_nested():
                user_id = generate_user_id(session)
                alumni_id = generate_alumni_id(session)

                new_user = User(
                    user_id=user_id,
                    username=item.username,
                    email=item.email,
                    password=hash_password(item.password),
                    user_type=UserType.USER,
                )
                session.add(new_user)
                session.flush()
                session.refresh(new_user)

                new_alumni = Alumni(
                    alumni_id=alumni_id,
                    last_name=item.last_name,
                    first_name=item.first_name,
                    middle_name=item.middle_name,
                    gender=item.gender,
                    age=item.age,
                    birthdate=item.birthdate,
                    consent_for_survey_ml=item.consent_for_survey_ml,
                    user_code=new_user.user_code,
                )
                session.add(new_alumni)
                session.flush()
                session.refresh(new_alumni)

                results.append(BatchAlumniRegistrationResult(
                    index=index, item=safe, success=True,
                    code=SuccessCode.ALUMNI_CREATED.value,
                    message="Alumni profile created successfully",
                    user_id=user_id, alumni_id=alumni_id,
                ))
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if "ix_users_email" in error_str or "users_email_key" in error_str:
                code = ErrorCode.DUPLICATE_EMAIL.value
                msg = f"Email '{item.email}' already in use"
            elif "ix_users_username" in error_str or "users_username_key" in error_str:
                code = ErrorCode.DUPLICATE_USERNAME.value
                msg = f"Username '{item.username}' already in use"
            else:
                code = ErrorCode.REGISTRATION_FAILED.value
                msg = "Alumni registration failed due to constraint violation"
            results.append(BatchAlumniRegistrationResult(
                index=index, item=safe, success=False,
                code=code, message=msg, user_id=None, alumni_id=None,
            ))
            failed_count += 1

        except ValueError as e:
            results.append(BatchAlumniRegistrationResult(
                index=index, item=safe, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e),
                user_id=None, alumni_id=None,
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH REGISTERED alumni",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return BatchAlumniRegisterResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_update_alumni(
    session: Session,
    items: list[BatchAlumniUpdateItem],
    performed_by: str | None = None,
) -> BatchAlumniUpdateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        try:
            with session.begin_nested():
                alumni = get_alumni_by_id_any(session, item.alumni_id)
                if not alumni:
                    results.append(BatchAlumniUpdateResult(
                        index=index, alumni_id=item.alumni_id, success=False,
                        code=ErrorCode.ALUMNI_NOT_FOUND.value,
                        message=f"Alumni {item.alumni_id} not found", data=None,
                    ))
                    failed_count += 1
                    continue

                if item.last_name is not None:
                    alumni.last_name = item.last_name
                if item.first_name is not None:
                    alumni.first_name = item.first_name
                if item.middle_name is not None:
                    alumni.middle_name = item.middle_name
                if item.gender is not None:
                    alumni.gender = item.gender.upper()
                if item.age is not None:
                    alumni.age = item.age
                if item.birthdate is not None:
                    alumni.birthdate = item.birthdate
                if item.consent_for_survey_ml is not None:
                    alumni.consent_for_survey_ml = item.consent_for_survey_ml

                session.add(alumni)
                session.flush()
                session.refresh(alumni)

                profile = build_full_profile(session, alumni)
                results.append(BatchAlumniUpdateResult(
                    index=index, alumni_id=item.alumni_id, success=True,
                    code=SuccessCode.ALUMNI_UPDATED.value,
                    message="Alumni updated successfully",
                    data=profile.model_dump(),
                ))
                successful_count += 1

        except IntegrityError:
            results.append(BatchAlumniUpdateResult(
                index=index, alumni_id=item.alumni_id, success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Alumni update failed due to constraint violation", data=None,
            ))
            failed_count += 1

        except ValueError as e:
            results.append(BatchAlumniUpdateResult(
                index=index, alumni_id=item.alumni_id, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e), data=None,
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH UPDATED alumni",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return BatchAlumniUpdateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_delete_alumni(
    session: Session,
    ids: list[str],
    performed_by: str | None = None,
) -> BatchAlumniDeleteResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, alumni_id in enumerate(ids):
        try:
            alumni = get_alumni_by_id_any(session, alumni_id)
            if not alumni:
                results.append(BatchAlumniDeleteResult(
                    index=index, alumni_id=alumni_id, success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message=f"Alumni {alumni_id} not found",
                ))
                failed_count += 1
                continue

            if alumni.is_deleted:
                results.append(BatchAlumniDeleteResult(
                    index=index, alumni_id=alumni_id, success=False,
                    code=ErrorCode.ALREADY_DELETED.value,
                    message="Alumni is already deleted, cannot delete again",
                ))
                failed_count += 1
                continue

            _cascade_soft_delete_alumni(session, alumni)
            alumni.is_deleted = True
            alumni.deleted_at = get_current_time_gmt8()
            session.add(alumni)
            session.flush()

            results.append(BatchAlumniDeleteResult(
                index=index, alumni_id=alumni_id, success=True,
                code=SuccessCode.ALUMNI_DELETED.value,
                message="Alumni deleted successfully",
            ))
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            results.append(BatchAlumniDeleteResult(
                index=index, alumni_id=alumni_id, success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Alumni deletion failed due to constraint violation",
            ))
            failed_count += 1

        except ValueError as e:
            results.append(BatchAlumniDeleteResult(
                index=index, alumni_id=alumni_id, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e),
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH DELETED alumni",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return BatchAlumniDeleteResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_restore_alumni(
    session: Session,
    ids: list[str],
    performed_by: str | None = None,
) -> BatchAlumniRestoreResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, alumni_id in enumerate(ids):
        try:
            alumni = get_alumni_by_id_any(session, alumni_id)
            if not alumni:
                results.append(BatchAlumniRestoreResult(
                    index=index, alumni_id=alumni_id, success=False,
                    code=ErrorCode.ALUMNI_NOT_FOUND.value,
                    message=f"Alumni '{alumni_id}' not found",
                ))
                failed_count += 1
                continue

            if not alumni.is_deleted:
                results.append(BatchAlumniRestoreResult(
                    index=index, alumni_id=alumni_id, success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"Alumni '{alumni_id}' is not deleted",
                ))
                failed_count += 1
                continue

            _cascade_restore_alumni(session, alumni)
            alumni.is_deleted = False
            alumni.deleted_at = None
            session.add(alumni)
            session.flush()

            results.append(BatchAlumniRestoreResult(
                index=index, alumni_id=alumni_id, success=True,
                code=SuccessCode.ALUMNI_RESTORED.value,
                message="Alumni restored successfully",
            ))
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            msg = "Restore failed: Constraint violation or related data issue"
            results.append(BatchAlumniRestoreResult(
                index=index, alumni_id=alumni_id, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=msg,
            ))
            log_integrity_error("alumni", "batch_restore_alumni", ErrorCode.INVALID_INPUT.value, msg, str(e))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH RESTORED alumni",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return BatchAlumniRestoreResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )
