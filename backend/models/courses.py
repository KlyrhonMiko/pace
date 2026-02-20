import uuid
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from pydantic import field_validator, field_serializer, BaseModel
from datetime import datetime, timezone
from utils.timezone import GMT8


class CourseBase(SQLModel):
    course_abbv: str = Field(max_length=20, unique=True, index=True)
    course_name: str = Field(max_length=200, unique=True, index=True)
    course_desc: Optional[str] = Field(default=None, max_length=500)


class Course(CourseBase, table=True):
    __tablename__ = "courses"
    
    course_id: str = Field(max_length=12, unique=True, index=True)
    course_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    college_dept_code: Optional[uuid.UUID] = Field(default=None, foreign_key="college_depts.college_dept_code", ondelete="SET NULL")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)


class CourseCreate(CourseBase):
    college_dept_abbv: str  # College department abbreviation (e.g., CCS)
    course_desc: Optional[str] = Field(default=None, max_length=500)
    
    @field_validator('course_abbv', 'college_dept_abbv', mode='before')
    @classmethod
    def capitalize_abbvs(cls, v):
        """Convert abbreviations to uppercase"""
        if isinstance(v, str):
            return v.upper()
        return v
    
    @field_validator('course_abbv', 'course_name')
    @classmethod
    def validate_non_empty(cls, v):
        """Ensure abbreviation and name are not empty"""
        if isinstance(v, str) and not v.strip():
            raise ValueError('This field cannot be empty')
        return v


class CourseUpdate(SQLModel):
    course_abbv: Optional[str] = Field(default=None, max_length=20)
    course_name: Optional[str] = Field(default=None, max_length=200)
    course_desc: Optional[str] = Field(default=None, max_length=500)
    college_dept_abbv: Optional[str] = Field(default=None)  # Allow updating the college department
    
    @field_validator('course_abbv', 'college_dept_abbv', mode='before')
    @classmethod
    def capitalize_abbvs(cls, v):
        """Convert abbreviations to uppercase"""
        if v is not None and isinstance(v, str):
            return v.upper()
        return v
    
    @field_validator('course_abbv', 'course_name')
    @classmethod
    def validate_non_empty(cls, v):
        """Ensure abbreviation and name are not empty if provided"""
        if v is not None and isinstance(v, str) and not v.strip():
            raise ValueError('This field cannot be empty')
        return v


class CoursePublic(CourseBase):
    course_id: str
    college_dept_id: str  # Return human-readable ID
    college_dept_name: str  # Include the college department name
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

# Batch operation models
class CourseBatchCreateItem(BaseModel):
    """Individual item result from batch create operation"""
    index: int = Field(..., description="Index in the request list (0-based)")
    item: CourseCreate = Field(..., description="The course data submitted")
    success: bool = Field(..., description="Whether this item was created successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")
    data: Optional[CoursePublic] = Field(default=None, description="Created course (if successful)")


class CourseBatchCreate(BaseModel):
    """Batch create request for courses"""
    items: List[CourseCreate] = Field(..., min_items=1, max_items=100, description="List of courses to create (1-100 items)")


class CourseBatchCreateResponse(BaseModel):
    """Batch create response for courses"""
    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully created")
    failed: int = Field(..., description="Number of items that failed")
    results: List[CourseBatchCreateItem] = Field(..., description="Detailed results for each item")


# Batch update models
class CourseBatchUpdateItem(BaseModel):
    """Course update item in batch request"""
    course_id: str = Field(..., description="Course ID to update")
    course_abbv: Optional[str] = Field(default=None, max_length=20, description="New abbreviation")
    course_name: Optional[str] = Field(default=None, max_length=200, description="New name")
    course_desc: Optional[str] = Field(default=None, max_length=500, description="New description")
    college_dept_abbv: Optional[str] = Field(default=None, description="New college department abbreviation")


class CourseBatchUpdateResult(BaseModel):
    """Individual item result from batch update operation"""
    index: int = Field(..., description="Index in the request list (0-based)")
    course_id: str = Field(..., description="Course ID that was updated")
    success: bool = Field(..., description="Whether this item was updated successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")
    data: Optional[CoursePublic] = Field(default=None, description="Updated course (if successful)")


class CourseBatchUpdate(BaseModel):
    """Batch update request for courses"""
    items: List[CourseBatchUpdateItem] = Field(..., min_items=1, max_items=100, description="List of courses to update (1-100 items)")


class CourseBatchUpdateResponse(BaseModel):
    """Batch update response for courses"""
    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully updated")
    failed: int = Field(..., description="Number of items that failed")
    results: List[CourseBatchUpdateResult] = Field(..., description="Detailed results for each item")


# Batch delete models
class CourseBatchDeleteResult(BaseModel):
    """Individual item result from batch delete operation"""
    index: int = Field(..., description="Index in the request list (0-based)")
    course_id: str = Field(..., description="Course ID that was deleted")
    success: bool = Field(..., description="Whether this item was deleted successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")


class CourseBatchDelete(BaseModel):
    """Batch delete request for courses"""
    ids: List[str] = Field(..., min_items=1, max_items=100, description="List of course IDs to delete (1-100 items)")


class CourseBatchDeleteResponse(BaseModel):
    """Batch delete response for courses"""
    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully deleted")
    failed: int = Field(..., description="Number of items that failed")
    results: List[CourseBatchDeleteResult] = Field(..., description="Detailed results for each item")


# Batch course restore models
class CourseBatchRestoreResult(BaseModel):
    """Individual item result from batch course restore operation"""
    index: int = Field(..., description="Index in the request list (0-based)")
    course_id: str = Field(..., description="Course ID that was restored")
    success: bool = Field(..., description="Whether this item was restored successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")


class CourseBatchRestore(BaseModel):
    """Batch restore request for courses"""
    ids: List[str] = Field(..., min_items=1, max_items=100, description="List of course IDs to restore (1-100 items)")


class CourseBatchRestoreResponse(BaseModel):
    """Batch restore response for courses"""
    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully restored")
    failed: int = Field(..., description="Number of items that failed")
    results: List[CourseBatchRestoreResult] = Field(..., description="Detailed results for each item")
