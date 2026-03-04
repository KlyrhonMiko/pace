"""
OTP endpoints for email verification during registration.
"""

from fastapi import APIRouter
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from schemas.otp import OTPSendRequest, OTPVerifyRequest, OTPResendRequest
from utils.otp import (
    generate_otp,
    store_otp,
    verify_otp,
    is_rate_limited,
    increment_otp_send_count,
)
from utils.email import send_otp_email

router = APIRouter(prefix="/otp", tags=["otp"])


@router.post("/send")
def send_otp(data: OTPSendRequest):
    """
    Generate an OTP, store it in Redis, and send it to the user's email.
    Rate-limited to prevent abuse.
    """
    # Rate limit check
    if is_rate_limited(data.email):
        return StandardResponse(
            success=False,
            code=ErrorCode.OTP_RATE_LIMIT_EXCEEDED.value,
            message="Too many OTP requests. Please try again later.",
        )

    # Generate and store OTP
    otp_code = generate_otp()
    if not store_otp(data.email, otp_code):
        return StandardResponse(
            success=False,
            code=ErrorCode.REDIS_UNAVAILABLE.value,
            message="Service temporarily unavailable. Please try again.",
        )

    # Send email
    if not send_otp_email(data.email, otp_code):
        return StandardResponse(
            success=False,
            code=ErrorCode.OTP_SEND_FAILED.value,
            message="Failed to send verification email. Please try again.",
        )

    # Track send count for rate limiting
    increment_otp_send_count(data.email)

    return StandardResponse(
        success=True,
        code=SuccessCode.OTP_SENT.value,
        message="Verification code sent to your email.",
    )


@router.post("/verify")
def verify_otp_route(data: OTPVerifyRequest):
    """
    Verify the OTP code submitted by the user.
    """
    success, reason = verify_otp(data.email, data.otp_code)

    if success:
        return StandardResponse(
            success=True,
            code=SuccessCode.OTP_VERIFIED.value,
            message="Email verified successfully.",
        )

    # Map failure reasons to response codes
    reason_map = {
        "expired": (
            ErrorCode.OTP_EXPIRED.value,
            "Verification code has expired. Please request a new one.",
        ),
        "invalid": (
            ErrorCode.OTP_INVALID.value,
            "Invalid verification code. Please try again.",
        ),
        "max_attempts": (
            ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED.value,
            "Too many failed attempts. Please request a new code.",
        ),
        "redis_unavailable": (
            ErrorCode.REDIS_UNAVAILABLE.value,
            "Service temporarily unavailable. Please try again.",
        ),
    }

    code, message = reason_map.get(
        reason,
        (ErrorCode.OTP_INVALID.value, "Verification failed. Please try again."),
    )

    return StandardResponse(
        success=False,
        code=code,
        message=message,
    )


@router.post("/resend")
def resend_otp(data: OTPResendRequest):
    """
    Resend OTP — generates a new code and sends it.
    Shares the same rate limit as /send.
    """
    # Rate limit check
    if is_rate_limited(data.email):
        return StandardResponse(
            success=False,
            code=ErrorCode.OTP_RATE_LIMIT_EXCEEDED.value,
            message="Too many OTP requests. Please try again later.",
        )

    # Generate and store new OTP
    otp_code = generate_otp()
    if not store_otp(data.email, otp_code):
        return StandardResponse(
            success=False,
            code=ErrorCode.REDIS_UNAVAILABLE.value,
            message="Service temporarily unavailable. Please try again.",
        )

    # Send email
    if not send_otp_email(data.email, otp_code):
        return StandardResponse(
            success=False,
            code=ErrorCode.OTP_SEND_FAILED.value,
            message="Failed to send verification email. Please try again.",
        )

    # Track send count
    increment_otp_send_count(data.email)

    return StandardResponse(
        success=True,
        code=SuccessCode.OTP_RESENT.value,
        message="New verification code sent to your email.",
    )
