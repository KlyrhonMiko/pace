import re
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field
from pydantic import BaseModel, field_serializer, field_validator
from utils.timezone import format_datetime_gmt8
from utils.auth import hash_password
from models.users import UserType


class StaffCreate(SQLModel):
    staff_id: str = Field(max_length=12)
    last_name: str = Field(max_length=50)
    first_name: str = Field(max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: str = Field(max_length=10)
    college_dept_code: Optional[str] = None

    @field_validator("gender", mode="before")
    @classmethod
    def capitalize_gender(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v


class StaffPublic(SQLModel):
    staff_id: str
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    college_dept_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)


class StaffUpdate(SQLModel):
    last_name: Optional[str] = Field(default=None, max_length=50)
    first_name: Optional[str] = Field(default=None, max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: Optional[str] = Field(default=None, max_length=10)
    college_dept_code: Optional[str] = None

    @field_validator("gender", mode="before")
    @classmethod
    def capitalize_gender(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class CompleteStaffRegistration(SQLModel):
    """Single-step registration: creates both a User and a Staff record."""
    # User fields
    username: str
    email: str
    password: str
    user_type: UserType = Field(default=UserType.STAFF)

    # Staff fields
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    college_dept_code: Optional[str] = None

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

    @field_validator('user_type', mode="before")
    @classmethod
    def validate_user_type(cls, v):
        if isinstance(v, str):
            v_upper = v.upper()
            if v_upper not in (UserType.STAFF.value, UserType.ADMIN.value):
                raise ValueError("Staff registration must be STAFF or ADMIN type")
            return v_upper
        return v


class BatchStaffRegistrationItemSafeDisplay(BaseModel):
    username: str
    email: str
    user_type: UserType
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    college_dept_code: Optional[str] = None


class BatchStaffRegistrationItem(BaseModel):
    username: str
    email: str
    password: str
    user_type: UserType = UserType.STAFF
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    college_dept_code: Optional[str] = None

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
        return v

    @field_validator('user_type', mode="before")
    @classmethod
    def validate_user_type(cls, v):
        if isinstance(v, str):
            v_upper = v.upper()
            if v_upper not in (UserType.STAFF.value, UserType.ADMIN.value):
                raise ValueError("Staff registration user_type must be STAFF or ADMIN")
            return v_upper
        return v


class BatchStaffRegistrationResult(BaseModel):
    index: int
    item: BatchStaffRegistrationItemSafeDisplay
    success: bool
    code: str
    message: str
    user_id: Optional[str] = None
    staff_id: Optional[str] = None


class BatchStaffRegister(BaseModel):
    items: List[BatchStaffRegistrationItem] = Field(..., min_length=1, max_length=100)


class BatchStaffRegisterResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[BatchStaffRegistrationResult]
