"""
DB query functions for staff domain (covers composite register).
"""
import uuid
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

from models.college_dept import CollegeDept
from models.staff import Staff
from models.users import User, UserType
from models.response_codes import ErrorCode, SuccessCode
from utils.crypto import hash_password_for_storage
from utils.logging import log_integrity_error


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------

def generate_user_id(session: Session, user_type: UserType) -> str:
    """Auto-increment USER-type or ADMN- or STFF- user ID."""
    prefix = "USER-"
    if user_type == UserType.ADMIN:
        prefix = "ADMN-"
    elif user_type == UserType.STAFF:
        prefix = "STAFF-"

    last_user = session.exec(
        select(User).where(User.user_type == user_type).order_by(User.user_id.desc())
    ).first()
    
    if last_user and last_user.user_id.startswith(prefix):
        new_num = (int(last_user.user_id.split("-")[1]) + 1)
    else:
        new_num = 1
    return f"{prefix}{new_num:06d}"


def generate_staff_id(session: Session, is_admin: bool) -> str:
    """Auto-increment ADMN-xxxxxx or STAFF-xxxxxx staff ID."""
    prefix = "ADMN-" if is_admin else "STAFF-"
    last_staff = session.exec(
        select(Staff).where(Staff.staff_id.startswith(prefix)).order_by(Staff.staff_id.desc())
    ).first()
    
    if last_staff and "-0" in last_staff.staff_id:
        try:
            new_num = int(last_staff.staff_id.split("-")[1]) + 1
        except ValueError:
            new_num = 1
    else:
        new_num = 1
    return f"{prefix}{new_num:06d}"


# ---------------------------------------------------------------------------
# Single-record lookups
# ---------------------------------------------------------------------------

def get_staff_by_id(session: Session, staff_id: str) -> Staff | None:
    return session.exec(
        select(Staff).where(
            (Staff.staff_id == staff_id.upper()) & (not Staff.is_deleted)
        )
    ).first()


def get_staff_by_user_ref_id(session: Session, user_ref_id: uuid.UUID) -> Staff | None:
    """Retrieve a staff record by the associated internal user id."""
    return session.exec(
        select(Staff).where(
            (Staff.user_ref_id == user_ref_id) & (not Staff.is_deleted)
        )
    ).first()


# ---------------------------------------------------------------------------
# Single-record mutations
# ---------------------------------------------------------------------------

def register_complete_staff(
    session: Session,
    username: str,
    email: str,
    password: str,
    user_type: UserType,
    last_name: str,
    first_name: str,
    middle_name: str | None,
    gender: str,
    college_dept_id: str | None
) -> tuple[bool, str, str, str | None, str | None]:
    """
    Registers both User and Staff records in an atomic transaction.
    Returns: (is_success, error_code, error_message, user_id, staff_id)
    """
    try:
        if session.exec(select(User).where(User.email == email)).first():
            return False, ErrorCode.EMAIL_ALREADY_EXISTS.value, "Email already exists", None, None
        if session.exec(select(User).where(User.username == username)).first():
            return False, ErrorCode.USERNAME_ALREADY_EXISTS.value, "Username already exists", None, None

        college_dept = None
        if college_dept_id:
            college_dept = session.exec(
                select(CollegeDept).where(CollegeDept.college_dept_id == college_dept_id.upper())
            ).first()
            if not college_dept:
                return False, ErrorCode.COLLEGE_DEPT_NOT_FOUND.value, "College department not found", None, None

        # Create basic Auth User
        new_user = User(
            user_id=generate_user_id(session, user_type),
            username=username,
            email=email,
            password=hash_password_for_storage(password),
            user_type=user_type,
        )
        session.add(new_user)
        session.flush()

        # Create Staff Profile attached to User
        is_admin = (user_type == UserType.ADMIN)
        staff_id = generate_staff_id(session, is_admin)

        new_staff = Staff(
            staff_id=staff_id,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            gender=gender,
            user_ref_id=new_user.id,
            college_dept_ref_id=college_dept.id if college_dept else None,
        )

        session.add(new_staff)
        session.commit()
        session.refresh(new_user)
        session.refresh(new_staff)

        return True, SuccessCode.ALUMNI_CREATED.value, "Staff and User registered successfully", new_user.user_id, new_staff.staff_id

    except IntegrityError as e:
        session.rollback()
        error_info = log_integrity_error(e, "Complete Staff Registration")
        error_msg = error_info.get("detail", "Database constraints violated")
        return False, ErrorCode.UNIQUE_CONSTRAINT_VIOLATION.value, error_msg, None, None
    except Exception as e:
        session.rollback()
        return False, ErrorCode.SERVER_ERROR_INTERNAL.value, f"Unexpected error: {str(e)}", None, None
