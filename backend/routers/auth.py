from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from core.database import get_session
from models.auth import CurrentUser, LoginRequest, ResetPasswordRequest, TokenResponse
from models.users import User
from models.response_codes import ErrorCode, StandardResponse, SuccessCode
from services.queries.transaction_logs_queries import create_transaction_log
from services.queries.user_activities_queries import ActivityType, create_user_activity
from utils.auth import (
    authenticate_and_issue_token,
    clear_session_cookie,
    clear_session_role_cookie,
    get_current_user,
    oauth2_scheme,
    revoke_access_token,
    set_session_cookie,
    set_session_role_cookie,
    update_user_password,
)
from utils.logging import log_auth_error
from utils.otp import verify_otp


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=StandardResponse)
def login(
    credentials: LoginRequest,
    session: Session = Depends(get_session),
):
    """
    Login endpoint - authenticate user with username/password and return JWT token

    Returns:
        - access_token: JWT token for authenticated requests
        - token_type: Always "bearer"
        - user_id: The authenticated user's ID
        - user_type: The user's type
    """
    token_payload = authenticate_and_issue_token(
        session,
        credentials.username,
        credentials.password,
    )

    # Block non-admin logins during maintenance mode
    if token_payload.user_type != "ADMIN":
        try:
            from routers.settings import _read_flags_cached
            flags = _read_flags_cached(session)
            if flags["maintenance_mode"]:
                raise HTTPException(
                    status_code=503,
                    detail=StandardResponse(
                        success=False,
                        code="MAINTENANCE_MODE",
                        message="The platform is currently under maintenance. Please try again later.",
                    ).model_dump(mode="json"),
                )
        except HTTPException:
            raise
        except Exception:
            pass  # Fail open — don't block login if settings check fails

    response = JSONResponse(
        status_code=200,
        content=StandardResponse(
            success=True,
            code=SuccessCode.LOGIN_SUCCESSFUL.value,
            message="Login successful",
            data=token_payload,
        ).model_dump(mode="json"),
    )
    set_session_cookie(response, token_payload.access_token)
    set_session_role_cookie(response, token_payload.user_type)
    return response


@router.post("/token", response_model=TokenResponse)
def oauth2_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    """OAuth2 password-flow token endpoint for Swagger UI and developer tooling."""
    token_payload = authenticate_and_issue_token(
        session,
        form_data.username,
        form_data.password,
    )
    response = JSONResponse(content=token_payload.model_dump(mode="json"))
    set_session_cookie(response, token_payload.access_token)
    set_session_role_cookie(response, token_payload.user_type)
    return response


@router.post("/logout", response_model=StandardResponse)
def logout(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    token: str | None = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
):
    revoked_token = token or request.cookies.get("pace_session")
    if revoked_token:
        revoke_access_token(revoked_token)

    create_transaction_log(
        session,
        tl_name="USER LOGGED OUT",
        after={"user_id": current_user.user_id},
        performed_by=current_user.id,
    )
    create_user_activity(
        session,
        user_ref_id=current_user.id,
        activity_type=ActivityType.LOGOUT,
        description="Logged out of the system",
    )
    session.commit()

    response = JSONResponse(
        status_code=200,
        content=StandardResponse(
            success=True,
            code=SuccessCode.USER_UPDATED.value,
            message="Logged out successfully",
        ).model_dump(mode="json"),
    )
    clear_session_cookie(response)
    clear_session_role_cookie(response)
    return response


@router.get("/me", response_model=StandardResponse)
def get_me(current_user: CurrentUser = Depends(get_current_user)):
    """Return current authenticated user info from the JWT payload."""
    return StandardResponse(
        success=True,
        code=SuccessCode.CURRENT_USER_RETRIEVED.value,
        message="Current user retrieved successfully",
        data=current_user,
    )


@router.post("/reset-password", response_model=StandardResponse)
def reset_password(
    data: ResetPasswordRequest,
    session: Session = Depends(get_session),
):
    """
    Reset user password using a verified OTP code from email.
    """
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user:
        log_auth_error("reset_password", data.email, ErrorCode.USER_NOT_FOUND.value, "User not found during password reset")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.USER_NOT_FOUND.value,
                message="No account found with this email address.",
            ).model_dump(mode="json"),
        )

    success, reason = verify_otp(data.email, data.otp_code)
    if not success:
        log_auth_error("reset_password", data.email, ErrorCode.OTP_INVALID.value, f"OTP verification failed: {reason}")
        error_code = ErrorCode.OTP_INVALID.value
        if reason == "expired":
            error_code = ErrorCode.OTP_EXPIRED.value
        elif reason == "max_attempts":
            error_code = ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED.value

        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=error_code,
                message=f"Verification failed: {reason}",
            ).model_dump(mode="json"),
        )

    try:
        update_user_password(user, data.new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_PASSWORD.value,
                message=str(exc),
            ).model_dump(mode="json"),
        )

    session.add(user)
    create_transaction_log(
        session,
        tl_name="PASSWORD RESET via OTP",
        after={"user_id": user.user_id},
        performed_by=user.id,
    )
    create_user_activity(
        session,
        user_ref_id=user.id,
        activity_type=ActivityType.PASSWORD_RESET,
        description="Reset password via OTP",
    )
    session.commit()

    return StandardResponse(
        success=True,
        code=SuccessCode.USER_UPDATED.value,
        message="Your password has been reset successfully.",
    )
