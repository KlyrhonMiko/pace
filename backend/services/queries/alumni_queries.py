"""
DB query functions for alumni domain (covers composite register too).
"""
import uuid
from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError

from models.alumni import Alumni
from models.alumni_resumes import AlumniResume
from models.users import User, UserType
from models.student_records import StudentRecord
from models.courses import Course
from models.responses import AlumniFullProfile
from schemas.alumni import AlumniUpdate, ResumeSave
from schemas.composite import (
    BatchAlumniRegistrationItem, BatchAlumniRegistrationItemSafeDisplay,
    BatchAlumniRegistrationResult, BatchAlumniRegisterResponse,
    BatchAlumniUpdateItem, BatchAlumniUpdateResult, BatchAlumniUpdateResponse,
    BatchAlumniDeleteResult, BatchAlumniDeleteResponse,
    BatchAlumniRestoreResult, BatchAlumniRestoreResponse,
)
from models.response_codes import ErrorCode, SuccessCode
from utils.crypto import hash_password_for_storage
from utils.logging import log_integrity_error
from utils.timezone import get_current_time_gmt8
from services.queries.audit import stamp_create, stamp_restore, stamp_soft_delete, stamp_update
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
    if alumni.student_ref_id:
        student = session.exec(
            select(StudentRecord).where(StudentRecord.id == alumni.student_ref_id)
        ).first()
        if student:
            course = session.exec(
                select(Course).where(Course.id == student.course_ref_id)
            ).first()

    user = None
    if alumni.user_ref_id:
        user = session.exec(
            select(User).where(User.id == alumni.user_ref_id)
        ).first()

    # Calculate completeness
    completeness = calculate_profile_completeness(alumni, student)

    return AlumniFullProfile(
        id=alumni.id,
        alumni_id=alumni.alumni_id,
        last_name=alumni.last_name,
        first_name=alumni.first_name,
        middle_name=alumni.middle_name,
        gender=alumni.gender,
        age=alumni.age,
        birthdate=alumni.birthdate,
        consent_for_survey_ml=alumni.consent_for_survey_ml,
        employment_status=alumni.employment_status,
        employment_sector=alumni.employment_sector,
        salary_package=alumni.salary_package,
        offers_received=alumni.offers_received,
        skills=alumni.skills,
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
        profile_completeness=min(completeness, 100),
        created_at=alumni.created_at,
        updated_at=alumni.updated_at,
    )


# ---------------------------------------------------------------------------
# Cascade helpers
# ---------------------------------------------------------------------------

def _cascade_soft_delete_alumni(
    session: Session, alumni: Alumni, performed_by: str | None = None
) -> None:
    student_records = session.exec(
        select(StudentRecord).where(StudentRecord.alumni_ref_id == alumni.id)
    ).all()
    for student in student_records:
        if not student.is_deleted:
            stamp_soft_delete(student, performed_by)
            session.add(student)


def _cascade_restore_alumni(session: Session, alumni: Alumni) -> None:
    student_records = session.exec(
        select(StudentRecord).where(
            (StudentRecord.alumni_ref_id == alumni.id) &
            StudentRecord.is_deleted
        )
    ).all()
    for student in student_records:
        if student.is_deleted:
            stamp_restore(student)
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


def get_alumni_by_user_ref_id(session: Session, user_ref_id: uuid.UUID) -> Alumni | None:
    """Retrieve an alumni record by the associated internal user id."""
    return session.exec(
        select(Alumni).where(
            (Alumni.user_ref_id == user_ref_id) & (Alumni.is_deleted == False)
        )
    ).first()


# ---------------------------------------------------------------------------
# Single-record mutations
# ---------------------------------------------------------------------------

def register_complete_alumni(
    session: Session,
    username: str,
    email: str,
    password: str,
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
        password=hash_password_for_storage(password),
        user_type=UserType.USER,
    )
    stamp_create(new_user, performed_by)
    session.add(new_user)
    session.flush()
    if performed_by is None and new_user.created_by is None:
        new_user.created_by = new_user.id

    new_alumni = Alumni(
        alumni_id=alumni_id,
        last_name=last_name,
        first_name=first_name,
        middle_name=middle_name,
        gender=gender,
        age=age,
        birthdate=birthdate,
        consent_for_survey_ml=consent_for_survey_ml,
        user_ref_id=new_user.id,
    )
    stamp_create(new_alumni, performed_by or new_user.id)
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
    before_state = alumni.model_dump(mode="json")
    provided = data.model_fields_set
    if "last_name" in provided and data.last_name is not None:
        alumni.last_name = data.last_name
    if "first_name" in provided and data.first_name is not None:
        alumni.first_name = data.first_name
    if "middle_name" in provided:
        alumni.middle_name = data.middle_name
    if "gender" in provided and data.gender is not None:
        alumni.gender = data.gender.upper()
    if "age" in provided and data.age is not None:
        alumni.age = data.age
    if "birthdate" in provided and data.birthdate is not None:
        alumni.birthdate = data.birthdate
    if "consent_for_survey_ml" in provided and data.consent_for_survey_ml is not None:
        alumni.consent_for_survey_ml = data.consent_for_survey_ml
    if "employment_status" in provided:
        alumni.employment_status = data.employment_status
    if "employment_sector" in provided:
        alumni.employment_sector = data.employment_sector
    if "salary_package" in provided:
        alumni.salary_package = data.salary_package
    if "offers_received" in provided:
        alumni.offers_received = data.offers_received
    if "skills" in provided:
        alumni.skills = data.skills
    stamp_update(alumni)
    session.add(alumni)
    create_transaction_log(
        session,
        tl_name=f"UPDATED alumni {alumni.alumni_id}",
        before=before_state,
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
    _cascade_soft_delete_alumni(session, alumni, performed_by)
    stamp_soft_delete(alumni, performed_by)
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
    stamp_restore(alumni)
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
    count_q = select(func.count(Alumni.id))
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
                    password=hash_password_for_storage(item.password),
                    user_type=UserType.USER,
                )
                stamp_create(new_user, performed_by)
                session.add(new_user)
                session.flush()
                session.refresh(new_user)
                if performed_by is None and new_user.created_by is None:
                    new_user.created_by = new_user.id

                new_alumni = Alumni(
                    alumni_id=alumni_id,
                    last_name=item.last_name,
                    first_name=item.first_name,
                    middle_name=item.middle_name,
                    gender=item.gender,
                    age=item.age,
                    birthdate=item.birthdate,
                    consent_for_survey_ml=item.consent_for_survey_ml,
                    user_ref_id=new_user.id,
                )
                stamp_create(new_alumni, performed_by or new_user.id)
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

                stamp_update(alumni)
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

        except IntegrityError as e:
            results.append(BatchAlumniUpdateResult(
                index=index, alumni_id=item.alumni_id, success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="Alumni update failed due to constraint violation", data=None,
            ))
            log_integrity_error("alumni", "batch_update_alumni", ErrorCode.INVALID_INPUT.value, "Update failed", str(e))
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

            _cascade_soft_delete_alumni(session, alumni, performed_by)
            stamp_soft_delete(alumni, performed_by)
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
            log_integrity_error("alumni", "batch_delete_alumni", ErrorCode.INVALID_INPUT.value, "Delete failed", str(e))
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
            stamp_restore(alumni)
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


def calculate_profile_completeness(alumni: Alumni, student: StudentRecord | None) -> int:
    """Centralized calculation for profile completeness percentage."""
    # List of fields that are considered essential for a "complete" profile
    alumni_fields = [
        alumni.first_name, alumni.last_name, alumni.gender,
        alumni.age, alumni.birthdate,
        alumni.employment_status, alumni.employment_sector,
        alumni.salary_package, alumni.offers_received
    ]
    # Note: middle_name and skills are excluded from core completeness to avoid 
    # penalizing users who don't have/need them.
    
    filled_alumni = sum(1 for f in alumni_fields if f is not None and f != "")
    
    student_fields = []
    if student:
        student_fields = [
            student.student_id, student.year_graduated, student.gwa,
            student.avg_prof_grade, student.avg_elec_grade, student.ojt_grade
        ]
    filled_student = sum(1 for f in student_fields if f is not None and f != "")
    
    total_fields = len(alumni_fields) + 6 # 6 student fields
    total_filled = filled_alumni + filled_student
    return min(int((total_filled / total_fields) * 100), 100) if total_fields > 0 else 0

def save_alumni_resume(
    session: Session,
    alumni_ref_id: uuid.UUID,
    data: ResumeSave,
    performed_by: str | None = None,
) -> AlumniResume:
    existing_alumni = session.exec(
        select(Alumni).where(Alumni.id == alumni_ref_id)
    ).first()
    if existing_alumni and hasattr(data.resume_data, 'skills'):
        skills_raw = data.resume_data.skills
        skills_parsed = [s if isinstance(s, str) else s.get("name", "") for s in skills_raw if s]
        existing_alumni.skills = [s for s in skills_parsed if s]
        stamp_update(existing_alumni)
        session.add(existing_alumni)

    """Create or update the resume for an alumni."""
    existing = session.exec(
        select(AlumniResume).where(AlumniResume.alumni_ref_id == alumni_ref_id)
    ).first()

    if existing:
        existing.resume_data = data.resume_data.model_dump()
        stamp_update(existing)
        session.add(existing)
        res = existing
    else:
        res = AlumniResume(
            alumni_ref_id=alumni_ref_id,
            resume_data=data.resume_data.model_dump()
        )
        stamp_create(res, performed_by)
        session.add(res)

    create_transaction_log(
        session,
        tl_name=f"SAVED resume for alumni ref {alumni_ref_id}",
        after=res,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(res)
    return res


def get_alumni_resume(session: Session, alumni_ref_id: uuid.UUID) -> AlumniResume | None:
    """Retrieve the resume for an alumni."""
    return session.exec(
        select(AlumniResume).where(AlumniResume.alumni_ref_id == alumni_ref_id)
    ).first()
