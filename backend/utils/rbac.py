from fastapi import Depends, HTTPException, Request

from models.auth import CurrentUser
from models.response_codes import ErrorCode, StandardResponse
from models.users import UserType
from utils.auth import get_current_user


def require_user_type(*allowed_types: UserType):
    """Return a dependency that only allows specific user roles."""
    allowed_values = {role.value for role in allowed_types}

    def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.user_type not in allowed_values:
            raise HTTPException(
                status_code=403,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.FORBIDDEN.value,
                    message="You do not have permission to access this resource",
                ).model_dump(mode="json"),
            )
        return current_user

    return role_checker


def require_role(allowed_roles: list[str]):
    """Return a dependency that only allows specific user roles by string names."""
    def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        # Case-insensitive check against allowed roles
        allowed_roles_upper = [role.upper() for role in allowed_roles]
        if current_user.user_type.upper() not in allowed_roles_upper:
            raise HTTPException(
                status_code=403,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.FORBIDDEN.value,
                    message="You do not have permission to access this resource",
                ).model_dump(mode="json"),
            )
        return current_user

    return role_checker


# Convenience shortcuts for route dependencies
require_admin = require_user_type(UserType.ADMIN)
require_staff_or_admin = require_user_type(UserType.STAFF, UserType.ADMIN)
require_authenticated = get_current_user


class RequireSelfOrAdmin:
    """Allow access to the path user_id owner or an ADMIN."""

    def __call__(
        self,
        request: Request,
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if current_user.user_type == UserType.ADMIN.value:
            return current_user

        requested_user_id = request.path_params.get("user_id")
        if not requested_user_id:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.INVALID_INPUT.value,
                    message="Missing required path parameter: user_id",
                ).model_dump(mode="json"),
            )

        if current_user.user_id != requested_user_id:
            raise HTTPException(
                status_code=403,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.FORBIDDEN.value,
                    message="You can only access your own account",
                ).model_dump(mode="json"),
            )

        return current_user


require_self_or_admin = RequireSelfOrAdmin()
