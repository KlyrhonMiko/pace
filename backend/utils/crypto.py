import re
import random
import string
import unicodedata

from passlib.context import CryptContext

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 72


def validate_password_strength(password: str) -> str:
    """Validate the backend password policy and return the original value."""
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError("Password must be at least 8 characters long")
    if len(password) > PASSWORD_MAX_LENGTH:
        raise ValueError("Password must be at most 72 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one number")
    return password

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def hash_password_for_storage(password: str) -> str:
    """Validate and hash a password for database storage."""
    return hash_password(validate_password_strength(password))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# Auto-credential generation (for staff-driven alumni CSV import)
# ---------------------------------------------------------------------------

def _normalize_name_part(name: str) -> str:
    """Lowercase, strip accents, keep only alphanumeric characters."""
    nfkd = unicodedata.normalize("NFKD", name)
    ascii_only = nfkd.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]", "", ascii_only.lower())


def generate_random_username(first_name: str, last_name: str, existing_usernames: set[str]) -> str:
    """
    Generate a unique username in the pattern <firstname>.<lastname><NNN>.
    NNN is omitted when the base form is already unique, then padded to 3 digits.
    Retries up to 9999 suffixes before falling back to a UUID fragment.
    """
    base = f"{_normalize_name_part(first_name)}.{_normalize_name_part(last_name)}"
    if base not in existing_usernames:
        return base
    for attempt in range(1, 10000):
        candidate = f"{base}{attempt:03d}"
        if candidate not in existing_usernames:
            return candidate
    import uuid
    return f"{base}{str(uuid.uuid4())[:6]}"


def generate_random_password() -> str:
    """
    Generate a 12-character password that satisfies the strength policy:
    at least one uppercase, one lowercase, one digit, one special character.
    """
    specials = "!@#$%^&*"
    # Guarantee policy requirements
    mandatory = [
        random.choice(string.ascii_uppercase),
        random.choice(string.ascii_lowercase),
        random.choice(string.digits),
        random.choice(specials),
    ]
    pool = string.ascii_letters + string.digits + specials
    rest = [random.choice(pool) for _ in range(8)]
    chars = mandatory + rest
    random.shuffle(chars)
    return "".join(chars)

