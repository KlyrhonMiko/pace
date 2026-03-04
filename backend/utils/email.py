"""
Gmail API email sender using OAuth2 credentials.
Uses a stored refresh token to obtain access tokens automatically.
"""

import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from core.config import settings

# Google OAuth2 token endpoint
TOKEN_URI = "https://oauth2.googleapis.com/token"
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def _get_gmail_service():
    """Build and return an authenticated Gmail API service."""
    creds = Credentials(
        token=None,
        refresh_token=settings.GOOGLE_REFRESH_TOKEN,
        token_uri=TOKEN_URI,
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )
    return build("gmail", "v1", credentials=creds)


def _build_otp_html(otp_code: str) -> str:
    """Build a styled HTML email body for the OTP."""
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #064e3b; font-size: 22px; margin: 0;">
                PACE
            </h1>
            <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">
                Pamantasan ng Lungsod ng Pasig
            </p>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 32px; text-align: center;">
            <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">
                Your verification code is:
            </p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #065f46; margin: 16px 0;">
                {otp_code}
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">
                This code expires in <strong>5 minutes</strong>.
            </p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px;">
            If you did not request this code, please ignore this email.
        </p>
    </div>
    """


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send an OTP verification email via Gmail API.

    Args:
        to_email: Recipient email address
        otp_code: The 6-digit OTP code

    Returns:
        True if sent successfully, False otherwise
    """
    try:
        service = _get_gmail_service()

        message = MIMEMultipart("alternative")
        message["To"] = to_email
        message["From"] = f"PACE Alumni System <{settings.GMAIL_SENDER_EMAIL}>"
        message["Subject"] = f"Your Verification Code: {otp_code}"

        # Plain text fallback
        plain_text = (
            f"Your PACE Alumni System verification code is: {otp_code}\n\n"
            f"This code expires in 5 minutes.\n"
            f"If you did not request this code, please ignore this email."
        )
        message.attach(MIMEText(plain_text, "plain"))
        message.attach(MIMEText(_build_otp_html(otp_code), "html"))

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
        service.users().messages().send(userId="me", body={"raw": raw}).execute()

        print(f"[EMAIL] OTP sent to {to_email}")
        return True

    except HttpError as e:
        print(f"[EMAIL ERROR] Gmail API error: {e}")
        return False
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send OTP to {to_email}: {e}")
        return False
