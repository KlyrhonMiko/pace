"""
DB query functions for users domain.
All session.exec / session.add / session.commit / session.rollback calls live here.
"""
from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError

from models.users import User
from models.alumni import Alumni
from models.staff import Staff
from models.employers import Employer
from models.student_records import StudentRecord
from schemas.users import (
    UserType, UserCreate, UserUpdate, UserPublic, UserWithProfile,
    UserCreateSafeDisplay, UserUpdateSafeDisplay,
    UserBatchCreateItem, UserBatchCreateResponse,
    UserBatchUpdateItem, UserBatchUpdateResult, UserBatchUpdateResponse,
    UserBatchDeleteResult, UserBatchDeleteResponse,
    UserBatchRestoreResult, UserBatchRestoreResponse,
)
from models.response_codes import ErrorCode, SuccessCode
from utils.auth import verify_password
from utils.logging import log_integrity_error
from utils.timezone import get_current_time_gmt8
from services.queries.transaction_logs_queries import create_transaction_log


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------

def generate_user_id(user_type: UserType, session: Session) -> str:
    """Generate user_id based on user_type with auto-increment."""
    prefix = user_type.value  # USER, STAFF, or ADMIN
    last_user = session.exec(
        select(User).where(User.user_type == user_type).order_by(User.user_id.desc())
    ).first()
    new_num = (int(last_user.user_id.split("-")[1]) + 1) if last_user else 1
    return f"{prefix}-{new_num:06d}"


# ---------------------------------------------------------------------------
# Single-record lookups
# ---------------------------------------------------------------------------

def get_user_by_id(session: Session, user_id: str) -> User | None:
    """Fetch an active user by human-readable ID."""
    return session.exec(
        select(User).where(
            (User.user_id == user_id.upper()) & (User.is_deleted == False)
        )
    ).first()


def get_user_by_id_any(session: Session, user_id: str) -> User | None:
    """Fetch a user by ID regardless of deletion status."""
    return session.exec(
        select(User).where(User.user_id == user_id.upper())
    ).first()


# ---------------------------------------------------------------------------
# Cascade helpers
# ---------------------------------------------------------------------------

def _cascade_soft_delete(session: Session, user: User) -> None:
    """Soft-delete all alumni + student records belonging to a user."""
    alumni_records = session.exec(
        select(Alumni).where(Alumni.user_code == user.user_code)
    ).all()
    for alumni in alumni_records:
        if not alumni.is_deleted:
            alumni.is_deleted = True
            alumni.deleted_at = get_current_time_gmt8()
            session.add(alumni)

        student_records = session.exec(
            select(StudentRecord).where(StudentRecord.alumni_code == alumni.alumni_code)
        ).all()
        for student in student_records:
            if not student.is_deleted:
                student.is_deleted = True
                student.deleted_at = get_current_time_gmt8()
                session.add(student)


# ---------------------------------------------------------------------------
# Single-record mutations
# ---------------------------------------------------------------------------

def create_user(
    session: Session,
    data: UserCreate,
    performed_by: str | None = None,
) -> User:
    """Create a new user and return the persisted record."""
    user_id = generate_user_id(data.user_type, session)
    new_user = User(
        user_id=user_id,
        username=data.username,
        email=data.email,
        password=data.password,   # already hashed by validator
        user_type=data.user_type,
    )
    session.add(new_user)
    create_transaction_log(
        session,
        tl_name=f"CREATED user {new_user.user_id}",
        after=new_user,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(new_user)
    return new_user


def update_user(
    session: Session,
    user: User,
    data: UserUpdate,
    performed_by: str | None = None,
) -> User:
    """Apply a partial update. Password verification is the caller's responsibility."""
    if data.username is not None:
        user.username = data.username
    if data.email is not None:
        user.email = data.email
    if data.password is not None:
        user.password = data.password   # already hashed by validator
    session.add(user)
    create_transaction_log(
        session,
        tl_name=f"UPDATED user {user.user_id}",
        after=user,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(user)
    return user


def soft_delete_user(
    session: Session,
    user: User,
    performed_by: str | None = None,
) -> None:
    """Cascade soft-delete a user and all associated records."""
    _cascade_soft_delete(session, user)
    user.is_deleted = True
    user.deleted_at = get_current_time_gmt8()
    session.add(user)
    create_transaction_log(
        session,
        tl_name=f"DELETED user {user.user_id}",
        after=user,
        performed_by=performed_by,
    )
    session.commit()


def restore_user(
    session: Session,
    user: User,
    performed_by: str | None = None,
) -> None:
    """Restore a soft-deleted user."""
    user.is_deleted = False
    user.deleted_at = None
    session.add(user)
    create_transaction_log(
        session,
        tl_name=f"RESTORED user {user.user_id}",
        after=user,
        performed_by=performed_by,
    )
    session.commit()


# ---------------------------------------------------------------------------
# List / pagination
# ---------------------------------------------------------------------------

def get_all_users(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    user_type: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
    deleted_only: bool = False,
) -> tuple[list[User], int]:
    """Return (records, total_count) with filtering, search, sort, pagination."""
    if deleted_only:
        base_filter = User.is_deleted == True
    elif include_deleted:
        base_filter = None
    else:
        base_filter = User.is_deleted == False
    query = select(User)
    count_q = select(func.count(User.user_code))
    if base_filter is not None:
        query = query.where(base_filter)
        count_q = count_q.where(base_filter)

    if search:
        like = f"%{search}%"
        query = query.where(
            (User.username.ilike(like)) | (User.email.ilike(like))
        )

    if user_type:
        query = query.where(User.user_type == user_type.upper())

    total = session.exec(count_q).one()

    desc = sort_order.lower() == "desc"
    if sort_by.lower() == "username":
        query = query.order_by(User.username.desc() if desc else User.username)
    elif sort_by.lower() == "email":
        query = query.order_by(User.email.desc() if desc else User.email)
    elif sort_by.lower() == "created_at":
        query = query.order_by(User.created_at.desc() if desc else User.created_at)
    elif sort_by.lower() == "deleted_at":
        query = query.order_by(User.deleted_at.desc() if desc else User.deleted_at)
    else:
        query = query.order_by(User.user_id.desc() if desc else User.user_id)

    if limit > 0:
        query = query.offset(offset).limit(limit)

    return session.exec(query).all(), total


def get_all_users_with_profile(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    user_type: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
) -> tuple[list[UserWithProfile], int]:
    """Return users with names resolved from Alumni/Staff profile tables."""
    if include_deleted:
        base_filter = None
    else:
        base_filter = User.is_deleted == False

    query = select(User)
    count_q = select(func.count(User.user_code))

    if base_filter is not None:
        query = query.where(base_filter)
        count_q = count_q.where(base_filter)

    if search:
        like = f"%{search}%"
        query = query.where(
            (User.username.ilike(like)) | (User.email.ilike(like))
        )
        count_q = count_q.where(
            (User.username.ilike(like)) | (User.email.ilike(like))
        )

    if user_type:
        query = query.where(User.user_type == user_type.upper())
        count_q = count_q.where(User.user_type == user_type.upper())

    total = session.exec(count_q).one()

    desc = sort_order.lower() == "desc"
    if sort_by.lower() == "username":
        query = query.order_by(User.username.desc() if desc else User.username)
    elif sort_by.lower() == "email":
        query = query.order_by(User.email.desc() if desc else User.email)
    elif sort_by.lower() == "created_at":
        query = query.order_by(User.created_at.desc() if desc else User.created_at)
    else:
        query = query.order_by(User.user_id.desc() if desc else User.user_id)

    if limit > 0:
        query = query.offset(offset).limit(limit)

    users = session.exec(query).all()

    results: list[UserWithProfile] = []
    for user in users:
        first_name: str | None = None
        last_name: str | None = None
        middle_name: str | None = None

        if user.user_type == UserType.USER:
            alumni = session.exec(
                select(Alumni).where(
                    (Alumni.user_code == user.user_code) & (Alumni.is_deleted == False)
                )
            ).first()
            if alumni:
                first_name = alumni.first_name
                last_name = alumni.last_name
                middle_name = alumni.middle_name
        elif user.user_type == UserType.EMPLOYER:
            employer = session.exec(
                select(Employer).where(
                    (Employer.user_code == user.user_code)
                )
            ).first()
            if employer:
                # We map the contact person to the directory name fields
                first_name = employer.contact_person_first_name
                last_name = employer.contact_person_last_name
                middle_name = None  # Employer profiles don't track middle names currently
        else:
            staff = session.exec(
                select(Staff).where(
                    (Staff.user_code == user.user_code) & (Staff.is_deleted == False)
                )
            ).first()
            if staff:
                first_name = staff.first_name
                last_name = staff.last_name
                middle_name = staff.middle_name

        results.append(UserWithProfile(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            user_type=user.user_type,
            is_deleted=user.is_deleted,
            created_at=user.created_at,
            updated_at=user.updated_at,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
        ))

    return results, total


# ---------------------------------------------------------------------------
# Batch operations
# ---------------------------------------------------------------------------

def batch_create_users(
    session: Session,
    items: list[UserCreate],
    performed_by: str | None = None,
) -> UserBatchCreateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        safe = UserCreateSafeDisplay(
            username=item.username,
            email=item.email,
            user_type=item.user_type,
        )
        try:
            with session.begin_nested():
                user_id = generate_user_id(item.user_type, session)
                user_dict = item.model_dump()
                user_dict["user_id"] = user_id
                new_user = User.model_validate(user_dict)
                session.add(new_user)
                session.flush()
                session.refresh(new_user)

                results.append(UserBatchCreateItem(
                    index=index, item=safe, success=True,
                    code=SuccessCode.USER_CREATED.value,
                    message="User created successfully",
                    data=UserPublic.model_validate(new_user)
                ))
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if "ix_users_email" in error_str or "users_email_key" in error_str:
                code = ErrorCode.DUPLICATE_EMAIL.value
                msg = f"Email '{item.email}' already exists"
            elif "ix_users_username" in error_str or "users_username_key" in error_str:
                code = ErrorCode.DUPLICATE_USERNAME.value
                msg = f"Username '{item.username}' already exists"
            else:
                code = ErrorCode.INVALID_INPUT.value
                msg = "User creation failed due to constraint violation"
            results.append(UserBatchCreateItem(
                index=index, item=safe, success=False, code=code, message=msg, data=None
            ))
            failed_count += 1

        except ValueError as e:
            results.append(UserBatchCreateItem(
                index=index, item=safe, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e), data=None
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH CREATED users",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return UserBatchCreateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_update_users(
    session: Session,
    items: list[UserBatchUpdateItem],
    performed_by: str | None = None,
) -> UserBatchUpdateResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, item in enumerate(items):
        safe = UserUpdateSafeDisplay(
            user_id=item.user_id,
            username=item.username,
            email=item.email,
        )
        try:
            with session.begin_nested():
                user = get_user_by_id_any(session, item.user_id)
                if not user:
                    results.append(UserBatchUpdateResult(
                        index=index, item=safe, success=False,
                        code=ErrorCode.USER_NOT_FOUND.value,
                        message=f"User {item.user_id} not found", data=None
                    ))
                    failed_count += 1
                    continue

                # Password change requires current_password verification
                if item.password is not None:
                    if item.current_password is None:
                        results.append(UserBatchUpdateResult(
                            index=index, item=safe, success=False,
                            code=ErrorCode.MISSING_CURRENT_PASSWORD.value,
                            message="Current password required to change password", data=None
                        ))
                        failed_count += 1
                        continue
                    if not verify_password(item.current_password, user.password):
                        results.append(UserBatchUpdateResult(
                            index=index, item=safe, success=False,
                            code=ErrorCode.INVALID_CREDENTIALS.value,
                            message="Current password is incorrect", data=None
                        ))
                        failed_count += 1
                        continue

                if item.username is not None:
                    user.username = item.username
                if item.email is not None:
                    user.email = item.email
                if item.password is not None:
                    user.password = item.password   # already hashed

                session.add(user)
                session.flush()
                session.refresh(user)

                results.append(UserBatchUpdateResult(
                    index=index, item=safe, success=True,
                    code=SuccessCode.USER_UPDATED.value,
                    message="User updated successfully",
                    data=UserPublic.model_validate(user)
                ))
                successful_count += 1

        except IntegrityError as e:
            error_str = str(e).lower()
            if "ix_users_email" in error_str or "users_email_key" in error_str:
                code = ErrorCode.DUPLICATE_EMAIL.value
                msg = "Email already exists"
            elif "ix_users_username" in error_str or "users_username_key" in error_str:
                code = ErrorCode.DUPLICATE_USERNAME.value
                msg = "Username already exists"
            else:
                code = ErrorCode.INVALID_INPUT.value
                msg = "User update failed due to constraint violation"
            results.append(UserBatchUpdateResult(
                index=index, item=safe, success=False, code=code, message=msg, data=None
            ))
            failed_count += 1

        except ValueError as e:
            results.append(UserBatchUpdateResult(
                index=index, item=safe, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e), data=None
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH UPDATED users",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return UserBatchUpdateResponse(
        total_items=len(items),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_delete_users(
    session: Session,
    ids: list[str],
    performed_by: str | None = None,
) -> UserBatchDeleteResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, user_id in enumerate(ids):
        try:
            user = get_user_by_id_any(session, user_id)
            if not user:
                results.append(UserBatchDeleteResult(
                    index=index, user_id=user_id, success=False,
                    code=ErrorCode.USER_NOT_FOUND.value,
                    message=f"User {user_id} not found"
                ))
                failed_count += 1
                continue

            if user.is_deleted:
                results.append(UserBatchDeleteResult(
                    index=index, user_id=user_id, success=False,
                    code=ErrorCode.ALREADY_DELETED.value,
                    message="User is already deleted, cannot delete again"
                ))
                failed_count += 1
                continue

            _cascade_soft_delete(session, user)
            user.is_deleted = True
            user.deleted_at = get_current_time_gmt8()
            session.add(user)
            session.flush()

            results.append(UserBatchDeleteResult(
                index=index, user_id=user_id, success=True,
                code=SuccessCode.USER_DELETED.value,
                message="User deleted successfully"
            ))
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            results.append(UserBatchDeleteResult(
                index=index, user_id=user_id, success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="User deletion failed due to constraint violation"
            ))
            failed_count += 1

        except ValueError as e:
            results.append(UserBatchDeleteResult(
                index=index, user_id=user_id, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=str(e)
            ))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH DELETED users",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return UserBatchDeleteResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )


def batch_restore_users(
    session: Session,
    ids: list[str],
    performed_by: str | None = None,
) -> UserBatchRestoreResponse:
    results = []
    successful_count = 0
    failed_count = 0

    for index, user_id in enumerate(ids):
        try:
            user = get_user_by_id_any(session, user_id)
            if not user:
                results.append(UserBatchRestoreResult(
                    index=index, user_id=user_id, success=False,
                    code=ErrorCode.USER_NOT_FOUND.value,
                    message=f"User '{user_id}' not found"
                ))
                failed_count += 1
                continue

            if not user.is_deleted:
                results.append(UserBatchRestoreResult(
                    index=index, user_id=user_id, success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message=f"User '{user_id}' is not deleted"
                ))
                failed_count += 1
                continue

            user.is_deleted = False
            user.deleted_at = None
            session.add(user)
            session.flush()

            results.append(UserBatchRestoreResult(
                index=index, user_id=user_id, success=True,
                code=SuccessCode.USER_RESTORED.value,
                message="User restored successfully"
            ))
            successful_count += 1

        except IntegrityError as e:
            session.rollback()
            msg = "Restore failed: Constraint violation or related data issue"
            results.append(UserBatchRestoreResult(
                index=index, user_id=user_id, success=False,
                code=ErrorCode.INVALID_INPUT.value, message=msg
            ))
            log_integrity_error("users", "batch_restore_users", ErrorCode.INVALID_INPUT.value, msg, str(e))
            failed_count += 1

    create_transaction_log(
        session,
        tl_name="BATCH RESTORED users",
        after={"successful": successful_count, "failed": failed_count},
        performed_by=performed_by,
    )
    session.commit()
    return UserBatchRestoreResponse(
        total_items=len(ids),
        successful=successful_count,
        failed=failed_count,
        results=results,
    )
