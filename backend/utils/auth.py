import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from core.config import settings
from core.database import get_session
from core.redis import get_redis_client
from models.alumni import Alumni
from models.auth import CurrentUser, TokenResponse
from models.employers import Employer
from models.response_codes import ErrorCode, StandardResponse
from models.staff import Staff
from models.users import User, UserType
from services.queries.transaction_logs_queries import create_transaction_log
from services.queries.user_activities_queries import ActivityType, create_user_activity
from utils.crypto import hash_password_for_storage, verify_password
from utils.logging import log_auth_error
from utils.timezone import ensure_aware_datetime, get_current_time_utc


SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
TOKEN_REVOKE_NAMESPACE = "auth:revoked:jti"
_local_revoked_tokens: dict[str, int] = {}
_revocation_backend_warning_emitted = False
logger = logging.getLogger(__name__)

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set.")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)


def _get_profile_fields(session: Session, db_user: User) -> dict[str, str | None]:
    first_name = None
    last_name = None
    company_name = None
    company_logo_url = None

    if db_user.user_type == UserType.USER:
        alumni = session.exec(select(Alumni).where(Alumni.user_ref_id == db_user.id)).first()
        if alumni:
            first_name = alumni.first_name
            last_name = alumni.last_name
    elif db_user.user_type in [UserType.STAFF, UserType.ADMIN]:
        staff = session.exec(select(Staff).where(Staff.user_ref_id == db_user.id)).first()
        if staff:
            first_name = staff.first_name
            last_name = staff.last_name
        elif db_user.user_type == UserType.ADMIN:
            first_name = "System"
            last_name = "Administrator"
        else:
            first_name = "Staff"
            last_name = "Member"
    elif db_user.user_type == UserType.EMPLOYER:
        employer = session.exec(select(Employer).where(Employer.user_ref_id == db_user.id)).first()
        if employer:
            first_name = employer.contact_person_first_name
            last_name = employer.contact_person_last_name
            company_name = employer.company_name
            company_logo_url = employer.company_logo_url

    return {
        "first_name": first_name,
        "last_name": last_name,
        "company_name": company_name,
        "company_logo_url": company_logo_url,
    }


def build_current_user(session: Session, db_user: User) -> CurrentUser:
    """Build the canonical authenticated user payload from the database row."""
    return CurrentUser(
        id=db_user.id,
        user_id=db_user.user_id,
        user_type=db_user.user_type.value,
        **_get_profile_fields(session, db_user),
    )


def build_token_response(session: Session, db_user: User, access_token: str) -> TokenResponse:
    """Build the shared bearer-token response for JSON login and OAuth2 token flow."""
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=db_user.user_id,
        user_type=db_user.user_type.value,
        force_password_reset=db_user.force_password_reset,
        **_get_profile_fields(session, db_user),
    )


def _token_datetime_from_claim(payload: dict, claim_name: str) -> datetime:
    claim_value = payload.get(claim_name)
    if not isinstance(claim_value, (int, float)):
        raise ValueError("Invalid token payload")
    return datetime.fromtimestamp(claim_value, tz=timezone.utc)


def _revoked_token_cache_key(token_jti: str) -> str:
    return f"{TOKEN_REVOKE_NAMESPACE}:{token_jti}"


def _revocation_ttl_seconds(expires_at: Optional[datetime]) -> int:
    if expires_at is None:
        return max(ACCESS_TOKEN_EXPIRE_MINUTES * 60, 1)
    ttl = int((expires_at - get_current_time_utc()).total_seconds())
    return max(ttl, 1)


def _log_revocation_backend_warning(exc: Exception) -> None:
    global _revocation_backend_warning_emitted
    if _revocation_backend_warning_emitted:
        return
    logger.warning("Token revocation is using local fallback storage because Redis is unavailable: %s", exc)
    _revocation_backend_warning_emitted = True


def revoke_token_jti(token_jti: str, expires_at: Optional[datetime] = None) -> None:
    """Invalidate exactly one JWT by its JTI until it would naturally expire."""
    ttl = _revocation_ttl_seconds(expires_at)
    redis_client = get_redis_client()
    if redis_client:
        try:
            redis_client.setex(_revoked_token_cache_key(token_jti), ttl, "1")
            return
        except Exception as exc:
            _log_revocation_backend_warning(exc)

    _local_revoked_tokens[token_jti] = int(get_current_time_utc().timestamp()) + ttl


def revoke_access_token(token: str) -> None:
    """Invalidate the provided access token without revoking sibling sessions."""
    payload = decode_access_token(token)
    token_jti = payload.get("jti")
    if not isinstance(token_jti, str) or not token_jti:
        raise ValueError("Invalid token payload")
    revoke_token_jti(token_jti, _token_datetime_from_claim(payload, "exp"))


def is_token_jti_revoked(token_jti: str) -> bool:
    """Check whether a token JTI has been explicitly revoked."""
    redis_client = get_redis_client()
    if redis_client:
        try:
            return bool(redis_client.get(_revoked_token_cache_key(token_jti)))
        except Exception as exc:
            _log_revocation_backend_warning(exc)

    expiry_timestamp = _local_revoked_tokens.get(token_jti)
    if expiry_timestamp is None:
        return False

    now_timestamp = int(get_current_time_utc().timestamp())
    if expiry_timestamp <= now_timestamp:
        _local_revoked_tokens.pop(token_jti, None)
        return False

    return True


def revoke_user_tokens(user: User, revoked_at: Optional[datetime] = None) -> datetime:
    """Invalidate all previously-issued tokens for a user."""
    timestamp = revoked_at or get_current_time_utc()
    user.auth_revoked_after = timestamp
    return timestamp


def update_user_password(
    user: User,
    raw_password: str,
    changed_at: Optional[datetime] = None,
    revoke_all_tokens: bool = True,
) -> datetime:
    """Store a validated password hash and optionally revoke all existing tokens."""
    timestamp = changed_at or get_current_time_utc()
    user.password = hash_password_for_storage(raw_password)
    if revoke_all_tokens:
        user.password_changed_at = timestamp
        user.auth_revoked_after = timestamp
    user.force_password_reset = False
    return timestamp


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token with issuance and revocation metadata."""
    to_encode = data.copy()
    issued_at = get_current_time_utc()
    expire = issued_at + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update(
        {
            "exp": int(expire.timestamp()),
            "iat": int(issued_at.timestamp()),
            "jti": str(uuid4()),
        }
    )
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT access token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


def authenticate_user(session: Session, username: str, password: str) -> User:
    """Validate submitted credentials against an active user account."""
    user = session.exec(select(User).where(User.username == username)).first()

    if not user:
        log_auth_error("login", username, ErrorCode.INVALID_CREDENTIALS.value, "Invalid username or password - user not found")
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_CREDENTIALS.value,
                message="Invalid username or password",
            ).model_dump(mode="json"),
        )

    if user.is_deleted:
        log_auth_error("login", username, ErrorCode.ACCOUNT_DEACTIVATED.value, "Login blocked for deactivated account")
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.ACCOUNT_DEACTIVATED.value,
                message="Account is deactivated",
            ).model_dump(mode="json"),
        )

    if not verify_password(password, user.password):
        log_auth_error("login", username, ErrorCode.INVALID_CREDENTIALS.value, "Invalid username or password - incorrect password")
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_CREDENTIALS.value,
                message="Invalid username or password",
            ).model_dump(mode="json"),
        )

    return user


def authenticate_and_issue_token(session: Session, username: str, password: str) -> TokenResponse:
    """Authenticate a user, emit login side effects, and return a token payload."""
    user = authenticate_user(session, username, password)
    access_token = create_access_token(
        data={
            "user_id": user.user_id,
            "user_type": user.user_type.value,
        }
    )

    create_transaction_log(
        session,
        tl_name="USER LOGGED IN",
        after={"user_id": user.user_id},
        performed_by=user.id,
    )
    create_user_activity(
        session,
        user_ref_id=user.id,
        activity_type=ActivityType.LOGIN,
        description="Logged in to the system",
    )
    session.commit()
    session.refresh(user)

    return build_token_response(session, user, access_token)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> CurrentUser:
    """Extract current user from JWT and ensure the account is active."""
    if token is None:
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.UNAUTHORIZED.value,
                message="Not authenticated",
            ).model_dump(mode="json"),
        )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        user_type = payload.get("user_type")
        token_jti = payload.get("jti")

        if not user_id or not user_type or not token_jti:
            raise HTTPException(
                status_code=401,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.UNAUTHORIZED.value,
                    message="Invalid token payload",
                ).model_dump(mode="json"),
            )

        if is_token_jti_revoked(token_jti):
            raise HTTPException(
                status_code=401,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.TOKEN_REVOKED.value,
                    message="Token has been revoked",
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

        issued_at = _token_datetime_from_claim(payload, "iat")
        auth_revoked_after = ensure_aware_datetime(db_user.auth_revoked_after)
        password_changed_at = ensure_aware_datetime(db_user.password_changed_at)

        if auth_revoked_after and issued_at < auth_revoked_after:
            raise HTTPException(
                status_code=401,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.TOKEN_REVOKED.value,
                    message="Token has been revoked",
                ).model_dump(mode="json"),
            )

        if password_changed_at and issued_at < password_changed_at:
            raise HTTPException(
                status_code=401,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.TOKEN_REVOKED.value,
                    message="Token has been revoked",
                ).model_dump(mode="json"),
            )

        return build_current_user(session, db_user)
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
