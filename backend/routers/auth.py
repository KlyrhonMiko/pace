from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from core.database import get_session
from models.users import User, UserType
from models.alumni import Alumni
from models.staff import Staff
from models.auth import LoginRequest, TokenResponse, CurrentUser, ResetPasswordRequest
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from services.queries.transaction_logs_queries import create_transaction_log
from services.queries.user_activities_queries import create_user_activity, ActivityType
from utils.auth import create_access_token, get_current_user
from utils.crypto import verify_password, hash_password
from utils.otp import verify_otp
from utils.logging import log_auth_error

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=StandardResponse)
def login(
    credentials: LoginRequest,
    session: Session = Depends(get_session)
):
    """
    Login endpoint - authenticate user with username/password and return JWT token
    
    Returns:
        - access_token: JWT token for authenticated requests
        - token_type: Always "bearer"
        - user_id: The authenticated user's ID
        - user_type: The user's type (USER, STAFF, ADMIN)
    """
    # Find user by username
    user = session.exec(
        select(User).where(User.username == credentials.username)
    ).first()
    
    if not user:
        log_auth_error("login", credentials.username, ErrorCode.INVALID_CREDENTIALS.value, "Invalid username or password - user not found")
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_CREDENTIALS.value,
                message="Invalid username or password"
            ).model_dump(mode='json')
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password):
        log_auth_error("login", credentials.username, ErrorCode.INVALID_CREDENTIALS.value, "Invalid username or password - incorrect password")
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_CREDENTIALS.value,
                message="Invalid username or password"
            ).model_dump(mode='json')
        )
    
    # Create JWT token
    token = create_access_token(
        data={
            "user_id": user.user_id,
            "user_type": user.user_type.value,
            "user_code": str(user.user_code)
        }
    )

    create_transaction_log(
        session,
        tl_name="USER LOGGED IN",
        after={"user_id": user.user_id},
        performed_by=user.user_code,
    )
    create_user_activity(
        session,
        user_code=user.user_code,
        activity_type=ActivityType.LOGIN,
        description="Logged in to the system"
    )
    session.commit()
    
    first_name = None
    last_name = None
    
    if user.user_type == UserType.USER:
        alumni = session.exec(select(Alumni).where(Alumni.user_code == user.user_code)).first()
        if alumni:
            first_name = alumni.first_name
            last_name = alumni.last_name
    elif user.user_type in [UserType.STAFF, UserType.ADMIN]:
        staff = session.exec(select(Staff).where(Staff.user_code == user.user_code)).first()
        if staff:
            first_name = staff.first_name
            last_name = staff.last_name

    return StandardResponse(
        success=True,
        code=SuccessCode.LOGIN_SUCCESSFUL.value,
        message="Login successful",
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.user_id,
            user_type=user.user_type.value,
            first_name=first_name,
            last_name=last_name
        )
    )


@router.post("/logout", response_model=StandardResponse)
def logout(
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Logout endpoint - logs the logout transaction.
    Since we use JWT, the client is responsible for deleting the token.
    """
    create_transaction_log(
        session,
        tl_name="USER LOGGED OUT",
        after={"user_id": current_user.user_id},
        performed_by=current_user.user_code,
    )
    create_user_activity(
        session,
        user_code=current_user.user_code,
        activity_type=ActivityType.LOGOUT,
        description="Logged out of the system"
    )
    session.commit()
    
    return StandardResponse(
        success=True,
        code=SuccessCode.USER_UPDATED.value,
        message="Logged out successfully"
    )


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
    session: Session = Depends(get_session)
):
    """
    Reset user password using a verified OTP code from email.
    """
    # 1. Find user by email
    user = session.exec(select(User).where(User.email == data.email)).first()
    if not user:
        log_auth_error("reset_password", data.email, ErrorCode.USER_NOT_FOUND.value, "User not found during password reset")
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.USER_NOT_FOUND.value,
                message="No account found with this email address."
            ).model_dump(mode='json')
        )
    
    # 2. Verify OTP
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
                message=f"Verification failed: {reason}"
            ).model_dump(mode='json')
        )
    
    # 3. Update password
    user.password = hash_password(data.new_password)
    session.add(user)
    
    # 4. Log the action
    create_transaction_log(
        session,
        tl_name="PASSWORD RESET via OTP",
        after={"user_id": user.user_id},
        performed_by=user.user_code,
    )
    create_user_activity(
        session,
        user_code=user.user_code,
        activity_type=ActivityType.PASSWORD_RESET,
        description="Reset password via OTP"
    )
    session.commit()
    
    return StandardResponse(
        success=True,
        code=SuccessCode.USER_UPDATED.value,
        message="Your password has been reset successfully."
    )
