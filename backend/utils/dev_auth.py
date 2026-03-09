import os

from fastapi import FastAPI

from models.auth import CurrentUser
from models.users import UserType
from utils.auth import get_current_user


BYPASS_AUTH = os.getenv("BYPASS_AUTH", "False").lower() == "true"

# Optional selector for role-specific bypass profiles.
# Accepted values: ADMIN, STAFF, USER (USER also accepts ALUMNI alias).
BYPASS_ROLE = os.getenv("BYPASS_ROLE", "ADMIN").strip().upper()

# Backward-compatible generic overrides
BYPASS_USER_ID = os.getenv("BYPASS_USER_ID", "")
BYPASS_USER_CODE = os.getenv("BYPASS_USER_CODE", "")
BYPASS_USER_TYPE = os.getenv("BYPASS_USER_TYPE", "")

# Role-specific profile values
BYPASS_ADMIN_USER_ID = os.getenv("BYPASS_ADMIN_USER_ID", "ADMIN-000001")
BYPASS_ADMIN_USER_CODE = os.getenv("BYPASS_ADMIN_USER_CODE", "DEV-ADMIN-001")
BYPASS_ADMIN_USER_TYPE = os.getenv("BYPASS_ADMIN_USER_TYPE", UserType.ADMIN.value)

BYPASS_STAFF_USER_ID = os.getenv("BYPASS_STAFF_USER_ID", "STAFF-000001")
BYPASS_STAFF_USER_CODE = os.getenv("BYPASS_STAFF_USER_CODE", "DEV-STAFF-001")
BYPASS_STAFF_USER_TYPE = os.getenv("BYPASS_STAFF_USER_TYPE", UserType.STAFF.value)

BYPASS_ALUMNI_USER_ID = os.getenv("BYPASS_ALUMNI_USER_ID", "USER-000001")
BYPASS_ALUMNI_USER_CODE = os.getenv("BYPASS_ALUMNI_USER_CODE", "DEV-USER-001")
BYPASS_ALUMNI_USER_TYPE = os.getenv("BYPASS_ALUMNI_USER_TYPE", UserType.USER.value)


def _resolve_bypass_profile() -> CurrentUser:
    role_alias = "USER" if BYPASS_ROLE == "ALUMNI" else BYPASS_ROLE

    if role_alias == "STAFF":
        profile_user_id = BYPASS_STAFF_USER_ID
        profile_user_code = BYPASS_STAFF_USER_CODE
        profile_user_type = BYPASS_STAFF_USER_TYPE
    elif role_alias == "USER":
        profile_user_id = BYPASS_ALUMNI_USER_ID
        profile_user_code = BYPASS_ALUMNI_USER_CODE
        profile_user_type = BYPASS_ALUMNI_USER_TYPE
    else:
        profile_user_id = BYPASS_ADMIN_USER_ID
        profile_user_code = BYPASS_ADMIN_USER_CODE
        profile_user_type = BYPASS_ADMIN_USER_TYPE

    # Generic envs override role profile envs when provided.
    user_id = (BYPASS_USER_ID or profile_user_id).strip()
    user_code = (BYPASS_USER_CODE or profile_user_code).strip()
    user_type = (BYPASS_USER_TYPE or profile_user_type).strip().upper()

    valid_types = {role.value for role in UserType}
    if user_type not in valid_types:
        user_type = UserType.ADMIN.value

    return CurrentUser(user_id=user_id, user_type=user_type, user_code=user_code)


async def mock_get_current_user() -> CurrentUser:
    """Return a synthetic user when auth bypass is enabled for local development."""
    return _resolve_bypass_profile()


def apply_dev_auth_override(app: FastAPI) -> None:
    """Globally override auth dependency when BYPASS_AUTH is enabled."""
    if BYPASS_AUTH:
        app.dependency_overrides[get_current_user] = mock_get_current_user
        selected_role = "USER" if BYPASS_ROLE == "ALUMNI" else BYPASS_ROLE
        print(f"[AUTH] Development auth bypass is enabled ({selected_role})")
