import re
from datetime import datetime
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field
from pydantic import field_serializer, field_validator, BaseModel
from utils.timezone import format_datetime_gmt8
from utils.auth import hash_password


class UserType(str, Enum):
    USER = "USER"
    STAFF = "STAFF"
    ADMIN = "ADMIN"


class UserCreate(SQLModel):
    username: str = Field(max_length=50)
    email: str = Field(max_length=100)
    password: str = Field(min_length=8, max_length=72)
    user_type: UserType = Field(default=UserType.USER)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return hash_password(v)

    @field_validator("user_type", mode="before")
    @classmethod
    def validate_user_type(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v


class UserPublic(SQLModel):
    user_id: str
    username: str
    email: str
    user_type: UserType
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)


class UserUpdate(SQLModel):
    username: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    current_password: Optional[str] = Field(default=None, min_length=8, max_length=72)
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            if not re.match(email_pattern, v):
                raise ValueError("Invalid email format")
            return v.lower()
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        if v is not None:
            if len(v) < 8:
                raise ValueError("Password must be at least 8 characters long")
            if not re.search(r"[A-Z]", v):
                raise ValueError("Password must contain at least one uppercase letter")
            if not re.search(r"[a-z]", v):
                raise ValueError("Password must contain at least one lowercase letter")
            if not re.search(r"\d", v):
                raise ValueError("Password must contain at least one number")
            return hash_password(v)
        return v


class UserLogin(SQLModel):
    username: str
    password: str


class SuccessResponse(SQLModel):
    code: str
    message: str


# ── Safe display models (exclude passwords from responses) ─────────────────


class UserCreateSafeDisplay(BaseModel):
    """User creation data for response (no password included)"""

    username: str
    email: str
    user_type: str


class UserUpdateSafeDisplay(BaseModel):
    """User update data for response (no passwords included)"""

    user_id: str
    username: Optional[str] = None
    email: Optional[str] = None


# ── Batch create ────────────────────────────────────────────────────────────


class UserBatchCreateItem(BaseModel):
    index: int = Field(..., description="Index in the request list (0-based)")
    item: UserCreateSafeDisplay = Field(
        ..., description="The user data submitted (password excluded)"
    )
    success: bool
    code: str
    message: str
    data: Optional[UserPublic] = None


class UserBatchCreate(BaseModel):
    items: List[UserCreate] = Field(..., min_length=1, max_length=100)


class UserBatchCreateResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[UserBatchCreateItem]


# ── Batch update ────────────────────────────────────────────────────────────


class UserBatchUpdateItem(BaseModel):
    user_id: str
    username: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    current_password: Optional[str] = Field(default=None, min_length=8, max_length=72)
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            if not re.match(email_pattern, v):
                raise ValueError("Invalid email format")
            return v.lower()
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        if v is not None:
            if len(v) < 8:
                raise ValueError("Password must be at least 8 characters long")
            if not re.search(r"[A-Z]", v):
                raise ValueError("Password must contain at least one uppercase letter")
            if not re.search(r"[a-z]", v):
                raise ValueError("Password must contain at least one lowercase letter")
            if not re.search(r"\d", v):
                raise ValueError("Password must contain at least one number")
            return hash_password(v)
        return v


class UserBatchUpdateResult(BaseModel):
    index: int
    item: UserUpdateSafeDisplay
    success: bool
    code: str
    message: str
    data: Optional[UserPublic] = None


class UserBatchUpdate(BaseModel):
    items: List[UserBatchUpdateItem] = Field(..., min_length=1, max_length=100)


class UserBatchUpdateResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[UserBatchUpdateResult]


# ── Batch delete ────────────────────────────────────────────────────────────


class UserBatchDeleteResult(BaseModel):
    index: int
    user_id: str
    success: bool
    code: str
    message: str


class UserBatchDelete(BaseModel):
    ids: List[str] = Field(..., min_length=1, max_length=100)


class UserBatchDeleteResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[UserBatchDeleteResult]


# ── Batch restore ───────────────────────────────────────────────────────────


class UserBatchRestoreResult(BaseModel):
    index: int
    user_id: str
    success: bool
    code: str
    message: str


class UserBatchRestore(BaseModel):
    ids: List[str] = Field(..., min_length=1, max_length=100)


class UserBatchRestoreResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[UserBatchRestoreResult]
