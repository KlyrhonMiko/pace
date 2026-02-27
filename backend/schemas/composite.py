"""
All schema classes for composite (cross-domain alumni+user) operations.
Moved from models/composite.py — that file becomes an ORM-only re-export shim.
"""
import re
from datetime import date
from typing import Optional, List
from sqlmodel import SQLModel
from pydantic import field_validator, BaseModel, Field
from utils.auth import hash_password


class CompleteAlumniRegistration(SQLModel):
    """Single-step registration: creates both a User and an Alumni record."""
    # User fields
    username: str
    email: str
    password: str

    # Alumni fields
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    age: int
    birthdate: Optional[date] = None
    consent_for_survey_ml: bool = False

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return hash_password(v)


class CompleteAlumniResponse(SQLModel):
    user_id: str
    alumni_id: str
    message: str


# ── Safe display (no passwords in responses) ────────────────────────────────

class BatchAlumniRegistrationItemSafeDisplay(BaseModel):
    username: str
    email: str
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    age: int
    birthdate: Optional[date] = None
    consent_for_survey_ml: bool = False


# ── Batch register ──────────────────────────────────────────────────────────

class BatchAlumniRegistrationItem(BaseModel):
    username: str
    email: str
    password: str
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    age: int
    birthdate: Optional[date] = None
    consent_for_survey_ml: bool = False

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v  # NOT hashed here — hashed during actual registration


class BatchAlumniRegistrationResult(BaseModel):
    index: int
    item: BatchAlumniRegistrationItemSafeDisplay
    success: bool
    code: str
    message: str
    user_id: Optional[str] = None
    alumni_id: Optional[str] = None


class BatchAlumniRegister(BaseModel):
    items: List[BatchAlumniRegistrationItem] = Field(..., min_length=1, max_length=100)


class BatchAlumniRegisterResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[BatchAlumniRegistrationResult]


# ── Batch update ────────────────────────────────────────────────────────────

class BatchAlumniUpdateItem(BaseModel):
    alumni_id: str
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    birthdate: Optional[date] = None
    consent_for_survey_ml: Optional[bool] = None


class BatchAlumniUpdateResult(BaseModel):
    index: int
    alumni_id: str
    success: bool
    code: str
    message: str
    data: Optional[dict] = None


class BatchAlumniUpdate(BaseModel):
    items: List[BatchAlumniUpdateItem] = Field(..., min_length=1, max_length=100)


class BatchAlumniUpdateResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[BatchAlumniUpdateResult]


# ── Batch delete ────────────────────────────────────────────────────────────

class BatchAlumniDeleteResult(BaseModel):
    index: int
    alumni_id: str
    success: bool
    code: str
    message: str


class BatchAlumniDelete(BaseModel):
    ids: List[str] = Field(..., min_length=1, max_length=100)


class BatchAlumniDeleteResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[BatchAlumniDeleteResult]


# ── Batch restore ───────────────────────────────────────────────────────────

class BatchAlumniRestoreResult(BaseModel):
    index: int
    alumni_id: str
    success: bool
    code: str
    message: str


class BatchAlumniRestore(BaseModel):
    ids: List[str] = Field(..., min_length=1, max_length=100)


class BatchAlumniRestoreResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[BatchAlumniRestoreResult]
