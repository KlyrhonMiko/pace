"""
Pydantic schemas for OTP endpoints.
"""

import re
from sqlmodel import SQLModel
from pydantic import field_validator


class OTPSendRequest(SQLModel):
    """Request to send an OTP to an email address."""

    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v.lower()


class OTPVerifyRequest(SQLModel):
    """Request to verify an OTP code."""

    email: str
    otp_code: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v.lower()

    @field_validator("otp_code")
    @classmethod
    def validate_otp_code(cls, v):
        if not re.match(r"^\d{6}$", v):
            raise ValueError("OTP code must be exactly 6 digits")
        return v


class OTPResendRequest(SQLModel):
    """Request to resend an OTP to an email address."""

    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v.lower()
