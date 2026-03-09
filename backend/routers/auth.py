from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from core.database import get_session
from models.users import User
from models.auth import LoginRequest, TokenResponse, CurrentUser
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from utils.auth import verify_password, create_access_token, get_current_user
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
    
    return StandardResponse(
        success=True,
        code=SuccessCode.LOGIN_SUCCESSFUL.value,
        message="Login successful",
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.user_id,
            user_type=user.user_type.value
        )
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
