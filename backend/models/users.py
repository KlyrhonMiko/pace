import uuid
import re
from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field
from pydantic import field_serializer, field_validator, BaseModel
from utils.timezone import get_current_time_gmt8, GMT8
from utils.auth import hash_password


class UserType(str, Enum):
    USER = "USER"
    STAFF = "STAFF"
    ADMIN = "ADMIN"


class UserBase(SQLModel):
    user_id: str = Field(max_length=12, unique=True, index=True)
    username: str = Field(max_length=50, unique=True, index=True)
    email: str = Field(max_length=100, unique=True, index=True)
    user_type: UserType = Field(default=UserType.USER)


class User(UserBase, table=True):
    __tablename__ = "users"
    
    user_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    password: str = Field(max_length=255)  # Hashed password
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)


class UserCreate(SQLModel):
    username: str = Field(max_length=50, unique=True, index=True)
    email: str = Field(max_length=100, unique=True, index=True)
    password: str = Field(min_length=8, max_length=72)
    user_type: UserType = Field(default=UserType.USER)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        """Validate email format"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()  # Store emails in lowercase
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        """Validate password strength, then hash"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return hash_password(v)  # Hash after validation passes
    
    @field_validator('user_type', mode='before')
    @classmethod
    def validate_user_type(cls, v):
        """Convert user_type to uppercase for case-insensitive input"""
        if isinstance(v, str):
            return v.upper()
        return v


class UserPublic(UserBase):
    user_type: UserType
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        """Convert to GMT+8 and format as YYYY-MM-DD HH:MM:SS without microseconds"""
        if value is None:
            return None
        # Convert UTC datetime to GMT+8
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')


class UserUpdate(SQLModel):
    username: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=100)
    current_password: Optional[str] = Field(default=None, min_length=8, max_length=72)
    password: Optional[str] = Field(default=None, min_length=8, max_length=72)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        """Validate email format if provided"""
        if v is not None:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
            return v.lower()
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        """Validate password strength if provided, then hash"""
        if v is not None:
            if len(v) < 8:
                raise ValueError('Password must be at least 8 characters long')
            if not re.search(r'[A-Z]', v):
                raise ValueError('Password must contain at least one uppercase letter')
            if not re.search(r'[a-z]', v):
                raise ValueError('Password must contain at least one lowercase letter')
            if not re.search(r'\d', v):
                raise ValueError('Password must contain at least one number')
            return hash_password(v)  # Hash after validation passes
        return v


class SuccessResponse(SQLModel):
    code: str
    message: str


class UserLogin(SQLModel):
    username: str
    password: str


# Batch operation models

# Safe display models (exclude passwords from responses)
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


class UserBatchCreateItem(BaseModel):
    """Individual item result from batch create operation"""
    index: int = Field(..., description="Index in the request list (0-based)")
    item: UserCreateSafeDisplay = Field(..., description="The user data submitted (password excluded)")
    success: bool = Field(..., description="Whether this item was created successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")
    data: Optional[UserPublic] = Field(default=None, description="Created user (if successful)")



class UserBatchCreate(BaseModel):
    """Batch create request for users"""
    items: List[UserCreate] = Field(..., min_items=1, max_items=100, description="List of users to create (1-100 items)")


class UserBatchCreateResponse(BaseModel):
    """Batch create response for users"""
    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully created")
    failed: int = Field(..., description="Number of items that failed")
    results: List[UserBatchCreateItem] = Field(..., description="Detailed results for each item")


# Batch update models
class UserBatchUpdateItem(BaseModel):
    """User update item in batch request"""
    user_id: str = Field(..., description="User ID to update")
    username: Optional[str] = Field(default=None, max_length=50, description="New username")
    email: Optional[str] = Field(default=None, max_length=100, description="New email")
    current_password: Optional[str] = Field(default=None, min_length=8, max_length=72, description="Current password (required for password change)")
    password: Optional[str] = Field(default=None, min_length=8, max_length=72, description="New password")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        """Validate email format if provided"""
        if v is not None:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
            return v.lower()
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        """Validate password strength if provided, then hash"""
        if v is not None:
            if len(v) < 8:
                raise ValueError('Password must be at least 8 characters long')
            if not re.search(r'[A-Z]', v):
                raise ValueError('Password must contain at least one uppercase letter')
            if not re.search(r'[a-z]', v):
                raise ValueError('Password must contain at least one lowercase letter')
            if not re.search(r'\d', v):
                raise ValueError('Password must contain at least one number')
            return hash_password(v)  # Hash after validation passes
        return v


class UserBatchUpdateResult(BaseModel):
    """Individual item result from batch update operation"""
    index: int = Field(..., description="Index in the request list (0-based)")
    item: UserUpdateSafeDisplay = Field(..., description="The user data submitted (passwords excluded)")
    success: bool = Field(..., description="Whether this item was updated successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")
    data: Optional[UserPublic] = Field(default=None, description="Updated user (if successful)")


class UserBatchUpdate(BaseModel):
    """Batch update request for users"""
    items: List[UserBatchUpdateItem] = Field(..., min_items=1, max_items=100, description="List of users to update (1-100 items)")


class UserBatchUpdateResponse(BaseModel):
    """Batch update response for users"""
    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully updated")
    failed: int = Field(..., description="Number of items that failed")
    results: List[UserBatchUpdateResult] = Field(..., description="Detailed results for each item")


# Batch delete models
class UserBatchDeleteResult(BaseModel):
    """Individual item result from batch delete operation"""
    index: int = Field(..., description="Index in the request list (0-based)")
    user_id: str = Field(..., description="User ID that was deleted")
    success: bool = Field(..., description="Whether this item was deleted successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")


class UserBatchDelete(BaseModel):
    """Batch delete request for users"""
    ids: List[str] = Field(..., min_items=1, max_items=100, description="List of user IDs to delete (1-100 items)")


class UserBatchDeleteResponse(BaseModel):
    """Batch delete response for users"""
    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully deleted")
    failed: int = Field(..., description="Number of items that failed")
    results: List[UserBatchDeleteResult] = Field(..., description="Detailed results for each item")


# Batch user restore models
class UserBatchRestoreResult(BaseModel):
    """Individual item result from batch restore operation"""
    index: int = Field(..., description="Index in the request list (0-based)")
    user_id: str = Field(..., description="User ID that was restored")
    success: bool = Field(..., description="Whether this item was restored successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")


class UserBatchRestore(BaseModel):
    """Batch restore request for users"""
    ids: List[str] = Field(..., min_items=1, max_items=100, description="List of user IDs to restore (1-100 items)")


class UserBatchRestoreResponse(BaseModel):
    """Batch restore response for users"""
    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully restored")
    failed: int = Field(..., description="Number of items that failed")
    results: List[UserBatchRestoreResult] = Field(..., description="Detailed results for each item")

