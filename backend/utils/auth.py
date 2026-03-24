import jwt
from datetime import timedelta
from typing import Optional
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select
from core.config import settings
from core.database import get_session
from models.auth import CurrentUser
from models.response_codes import ErrorCode, StandardResponse
from models.users import User, UserType
from models.alumni import Alumni
from models.staff import Staff
from utils.timezone import get_current_time_utc

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set.")

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = get_current_time_utc() + expires_delta
    else:
        expire = get_current_time_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT access token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: Session = Depends(get_session),
) -> CurrentUser:
    """Extract current user from JWT and ensure the account is active."""
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.UNAUTHORIZED.value,
                message="Not authenticated",
            ).model_dump(mode="json"),
        )

    token = credentials.credentials

    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        user_type = payload.get("user_type")

        if not user_id or not user_type:
            raise HTTPException(
                status_code=401,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.UNAUTHORIZED.value,
                    message="Invalid token payload",
                ).model_dump(mode="json"),
            )

        db_user = session.exec(select(User).where(User.user_id == user_id)).first()
        if not db_user:
            raise HTTPException(
                status_code=401,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.UNAUTHORIZED.value,
                    message="User not found",
                ).model_dump(mode="json"),
            )

        if db_user.is_deleted:
            raise HTTPException(
                status_code=401,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ACCOUNT_DEACTIVATED.value,
                    message="Account is deactivated",
                ).model_dump(mode="json"),
            )

        first_name = None
        last_name = None
        
        if db_user.user_type == UserType.USER:
            alumni = session.exec(select(Alumni).where(Alumni.user_code == db_user.user_code)).first()
            if alumni:
                first_name = alumni.first_name
                last_name = alumni.last_name
        elif db_user.user_type in [UserType.STAFF, UserType.ADMIN]:
            staff = session.exec(select(Staff).where(Staff.user_code == db_user.user_code)).first()
            if staff:
                first_name = staff.first_name
                last_name = staff.last_name

        return CurrentUser(
            user_id=user_id,
            user_type=user_type,
            user_code=str(db_user.user_code) if db_user.user_code else None,
            first_name=first_name,
            last_name=last_name
        )
    except HTTPException:
        raise
    except ValueError as exc:
        error_code = (
            ErrorCode.TOKEN_EXPIRED.value if str(exc) == "Token has expired" else ErrorCode.INVALID_TOKEN.value
        )
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=error_code,
                message=str(exc),
            ).model_dump(mode="json"),
        )
