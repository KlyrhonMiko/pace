from typing import Optional, List
from sqlmodel import SQLModel
from pydantic import field_validator, BaseModel, Field
import re
from utils.auth import hash_password


class CompleteAlumniRegistration(SQLModel):
    
    # User fields (user_id is auto-generated, user_type is always USER)
    username: str
    email: str
    password: str
    
    # Alumni fields (alumni_id is auto-generated)
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    age: int
    
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


class CompleteAlumniResponse(SQLModel):
    user_id: str
    alumni_id: str
    message: str


# Batch alumni registration models

# Safe display models (exclude passwords from responses)
class BatchAlumniRegistrationItemSafeDisplay(BaseModel):
    """Alumni registration data for response (no password included)"""
    username: str
    email: str
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    age: int


class BatchAlumniRegistrationItem(BaseModel):
    """Individual alumni registration data for batch registration (input model)"""
    username: str
    email: str
    password: str
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    age: int
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        """Validate email format"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v  # Return unhashed for now, hash during actual registration


class BatchAlumniRegistrationResult(BaseModel):
    """Individual item result from batch alumni registration"""
    index: int
    item: BatchAlumniRegistrationItemSafeDisplay
    success: bool
    code: str
    message: str
    user_id: Optional[str] = None
    alumni_id: Optional[str] = None


class BatchAlumniRegister(BaseModel):
    """Batch alumni registration request"""
    items: List[BatchAlumniRegistrationItem] = Field(..., min_items=1, max_items=100, description="List of alumni to register (1-100 items)")


class BatchAlumniRegisterResponse(BaseModel):
    """Batch alumni registration response"""
    total_items: int
    successful: int
    failed: int
    results: List[BatchAlumniRegistrationResult]


# Batch alumni update models
class BatchAlumniUpdateItem(BaseModel):
    """Alumni update item in batch request"""
    alumni_id: str
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None


class BatchAlumniUpdateResult(BaseModel):
    """Individual item result from batch alumni update operation"""
    index: int
    alumni_id: str
    success: bool
    code: str
    message: str
    data: Optional[dict] = None  # Full profile if successful


class BatchAlumniUpdate(BaseModel):
    """Batch alumni update request"""
    items: List[BatchAlumniUpdateItem] = Field(..., min_items=1, max_items=100, description="List of alumni to update (1-100 items)")


class BatchAlumniUpdateResponse(BaseModel):
    """Batch alumni update response"""
    total_items: int
    successful: int
    failed: int
    results: List[BatchAlumniUpdateResult]


# Batch alumni delete models
class BatchAlumniDeleteResult(BaseModel):
    """Individual item result from batch alumni delete operation"""
    index: int
    alumni_id: str
    success: bool
    code: str
    message: str


class BatchAlumniDelete(BaseModel):
    """Batch alumni delete request"""
    ids: List[str] = Field(..., min_items=1, max_items=100, description="List of alumni IDs to delete (1-100 items)")


class BatchAlumniDeleteResponse(BaseModel):
    """Batch alumni delete response"""
    total_items: int
    successful: int
    failed: int
    results: List[BatchAlumniDeleteResult]


# Batch alumni restore models
class BatchAlumniRestoreResult(BaseModel):
    """Individual item result from batch alumni restore operation"""
    index: int
    alumni_id: str
    success: bool
    code: str
    message: str


class BatchAlumniRestore(BaseModel):
    """Batch alumni restore request"""
    ids: List[str] = Field(..., min_items=1, max_items=100, description="List of alumni IDs to restore (1-100 items)")


class BatchAlumniRestoreResponse(BaseModel):
    """Batch alumni restore response"""
    total_items: int
    successful: int
    failed: int
    results: List[BatchAlumniRestoreResult]
