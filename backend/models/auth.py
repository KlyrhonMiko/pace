import uuid
from sqlmodel import SQLModel
from typing import Optional


class LoginRequest(SQLModel):
    """Login request with username and password"""
    username: str
    password: str


class TokenResponse(SQLModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    user_type: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    force_password_reset: bool = False


class CurrentUser(SQLModel):
    """Current authenticated user from JWT token"""
    id: Optional[uuid.UUID] = None
    user_id: str
    user_type: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None


class ResetPasswordRequest(SQLModel):
    """Request to reset password using an OTP code"""
    email: str
    otp_code: str
    new_password: str
