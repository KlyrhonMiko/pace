"""
OTP generation, storage (Redis), and verification utilities.
"""

import secrets
from core.config import settings
from core.redis import get_redis_client


# Redis key prefixes
OTP_KEY_PREFIX = "otp:"
OTP_ATTEMPTS_PREFIX = "otp_attempts:"
OTP_SEND_COUNT_PREFIX = "otp_sends:"

# Rate-limit window for sends (10 minutes)
OTP_SEND_WINDOW_SECONDS = 600


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"


def store_otp(email: str, otp: str) -> bool:
    """
    Store OTP in Redis with TTL.

    Args:
        email: User email (used as key)
        otp: The OTP code to store

    Returns:
        True if stored successfully, False if Redis unavailable
    """
    client = get_redis_client()
    if not client:
        return False

    try:
        key = f"{OTP_KEY_PREFIX}{email.lower()}"
        client.setex(key, settings.OTP_EXPIRY_SECONDS, otp)

        # Reset attempt counter on new OTP
        attempts_key = f"{OTP_ATTEMPTS_PREFIX}{email.lower()}"
        client.delete(attempts_key)

        print(f"[OTP] Stored OTP for {email} (TTL: {settings.OTP_EXPIRY_SECONDS}s)")
        return True
    except Exception as e:
        print(f"[OTP ERROR] Failed to store OTP for {email}: {e}")
        return False


def verify_otp(email: str, otp: str) -> tuple[bool, str]:
    """
    Verify an OTP code.

    Args:
        email: User email
        otp: The OTP code to verify

    Returns:
        (success, reason) tuple:
        - (True, "valid") on success
        - (False, "expired") if OTP not found / expired
        - (False, "invalid") if OTP doesn't match
        - (False, "max_attempts") if max attempts exceeded
        - (False, "redis_unavailable") if Redis is down
    """
    client = get_redis_client()
    if not client:
        return False, "redis_unavailable"

    try:
        email_lower = email.lower()
        attempts_key = f"{OTP_ATTEMPTS_PREFIX}{email_lower}"

        # Check attempt count
        attempts = client.get(attempts_key)
        current_attempts = int(attempts) if attempts else 0
        if current_attempts >= settings.OTP_MAX_ATTEMPTS:
            return False, "max_attempts"

        # Retrieve stored OTP
        key = f"{OTP_KEY_PREFIX}{email_lower}"
        stored_otp = client.get(key)

        if stored_otp is None:
            return False, "expired"

        if stored_otp != otp:
            # Increment attempt counter (inherit remaining TTL from OTP key)
            ttl = client.ttl(key)
            if ttl > 0:
                client.setex(attempts_key, ttl, current_attempts + 1)
            return False, "invalid"

        # Success — clean up
        client.delete(key)
        client.delete(attempts_key)
        print(f"[OTP] Verified successfully for {email}")
        return True, "valid"

    except Exception as e:
        print(f"[OTP ERROR] Verification error for {email}: {e}")
        return False, "redis_unavailable"


def delete_otp(email: str) -> None:
    """Delete OTP and related keys for an email."""
    client = get_redis_client()
    if not client:
        return

    try:
        email_lower = email.lower()
        client.delete(f"{OTP_KEY_PREFIX}{email_lower}")
        client.delete(f"{OTP_ATTEMPTS_PREFIX}{email_lower}")
        client.delete(f"{OTP_SEND_COUNT_PREFIX}{email_lower}")
    except Exception as e:
        print(f"[OTP ERROR] Cleanup error for {email}: {e}")


def get_otp_send_count(email: str) -> int:
    """Get how many OTPs have been sent to this email in the rate-limit window."""
    client = get_redis_client()
    if not client:
        return 0

    try:
        key = f"{OTP_SEND_COUNT_PREFIX}{email.lower()}"
        count = client.get(key)
        return int(count) if count else 0
    except Exception as e:
        print(f"[OTP ERROR] Send count error for {email}: {e}")
        return 0


def increment_otp_send_count(email: str) -> bool:
    """Increment and track OTP send count with a sliding window."""
    client = get_redis_client()
    if not client:
        return False

    try:
        key = f"{OTP_SEND_COUNT_PREFIX}{email.lower()}"
        pipe = client.pipeline()
        pipe.incr(key)
        pipe.expire(key, OTP_SEND_WINDOW_SECONDS)
        pipe.execute()
        return True
    except Exception as e:
        print(f"[OTP ERROR] Send count increment error for {email}: {e}")
        return False


def is_rate_limited(email: str) -> bool:
    """Check if the email has exceeded the OTP send rate limit."""
    return get_otp_send_count(email) >= settings.OTP_MAX_SENDS
