import os
from dotenv import load_dotenv

# Load environment variables from the project root's .env.local
env_path = os.path.join(os.path.dirname(__file__), "../../.env.local")
load_dotenv(env_path)


class Settings:
    """Application settings from environment variables"""

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    JOOBLE_API_KEY: str = os.getenv("JOOBLE_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    CLOUDINARY_URL: str = os.getenv("CLOUDINARY_URL", "")
    ARTIFICIAL_DELAY: float = float(os.getenv("ARTIFICIAL_DELAY", "0"))


    # Gmail OAuth2 settings
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REFRESH_TOKEN: str = os.getenv("GOOGLE_REFRESH_TOKEN", "")
    GMAIL_SENDER_EMAIL: str = os.getenv("GMAIL_SENDER_EMAIL", "")

    # OTP settings
    OTP_EXPIRY_SECONDS: int = int(os.getenv("OTP_EXPIRY_SECONDS", "300"))
    OTP_MAX_ATTEMPTS: int = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
    OTP_MAX_SENDS: int = int(os.getenv("OTP_MAX_SENDS", "3"))

    # CORS settings
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Session cookie settings (Hardened: No fallbacks)
    SESSION_COOKIE_NAME: str = os.environ["SESSION_COOKIE_NAME"]
    SESSION_ROLE_COOKIE_NAME: str = os.environ["SESSION_ROLE_COOKIE_NAME"]
    SESSION_COOKIE_SECURE: bool = os.environ["SESSION_COOKIE_SECURE"].lower() == "true"
    SESSION_COOKIE_DOMAIN: str | None = os.getenv("SESSION_COOKIE_DOMAIN") or None
    SESSION_COOKIE_SAMESITE: str = os.environ["SESSION_COOKIE_SAMESITE"]

    # CSRF protection (Hardened: No fallbacks)
    CSRF_ORIGIN_CHECK: bool = os.environ["CSRF_ORIGIN_CHECK"].lower() == "true"

    class Config:
        case_sensitive = True


settings = Settings()
