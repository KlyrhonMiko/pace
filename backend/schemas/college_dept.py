from typing import Optional, List
from sqlmodel import SQLModel, Field
from pydantic import field_validator, field_serializer, BaseModel
from datetime import datetime
from schemas.base import AuditPublicSQLModel
from utils.timezone import format_datetime_gmt8


class CollegeDeptCreate(SQLModel):
    college_dept_abbv: str = Field(max_length=20)
    college_dept_name: str = Field(max_length=200)
    college_dept_desc: Optional[str] = Field(default=None, max_length=500)

    @field_validator("college_dept_abbv", mode="before")
    @classmethod
    def capitalize_college_dept_abbv(cls, v):
        """Convert college_dept_abbv to uppercase"""
        if isinstance(v, str):
            return v.upper()
        return v

    @field_validator("college_dept_abbv", "college_dept_name")
    @classmethod
    def validate_non_empty(cls, v):
        """Ensure abbreviation and name are not empty"""
        if isinstance(v, str) and not v.strip():
            raise ValueError("This field cannot be empty")
        return v


class CollegeDeptUpdate(SQLModel):
    college_dept_abbv: Optional[str] = Field(default=None, max_length=20)
    college_dept_name: Optional[str] = Field(default=None, max_length=200)
    college_dept_desc: Optional[str] = Field(default=None, max_length=500)

    @field_validator("college_dept_abbv", mode="before")
    @classmethod
    def capitalize_college_dept_abbv(cls, v):
        """Convert college_dept_abbv to uppercase"""
        if v is not None and isinstance(v, str):
            return v.upper()
        return v

    @field_validator("college_dept_abbv", "college_dept_name")
    @classmethod
    def validate_non_empty(cls, v):
        """Ensure abbreviation and name are not empty if provided"""
        if v is not None and isinstance(v, str) and not v.strip():
            raise ValueError("This field cannot be empty")
        return v


class CollegeDeptPublic(AuditPublicSQLModel):
    college_dept_id: str
    college_dept_abbv: str
    college_dept_name: str
    college_dept_desc: Optional[str]
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        """Convert to GMT+8 and format using the shared datetime display format."""
        return format_datetime_gmt8(value)


# Batch operation models
class CollegeDeptBatchCreateItem(BaseModel):
    """Individual item result from batch create operation"""

    index: int = Field(..., description="Index in the request list (0-based)")
    item: CollegeDeptCreate = Field(
        ..., description="The college department data submitted"
    )
    success: bool = Field(..., description="Whether this item was created successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")
    data: Optional[CollegeDeptPublic] = Field(
        default=None, description="Created college department (if successful)"
    )


class CollegeDeptBatchCreate(BaseModel):
    """Batch create request for college departments"""

    items: List[CollegeDeptCreate] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of college departments to create (1-100 items)",
    )


class CollegeDeptBatchCreateResponse(BaseModel):
    """Batch create response for college departments"""

    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully created")
    failed: int = Field(..., description="Number of items that failed")
    results: List[CollegeDeptBatchCreateItem] = Field(
        ..., description="Detailed results for each item"
    )


# Batch update models
class CollegeDeptBatchUpdateItem(BaseModel):
    """College department update item in batch request"""

    college_dept_id: str = Field(..., description="College department ID to update")
    college_dept_abbv: Optional[str] = Field(
        default=None, max_length=20, description="New abbreviation"
    )
    college_dept_name: Optional[str] = Field(
        default=None, max_length=200, description="New name"
    )
    college_dept_desc: Optional[str] = Field(
        default=None, max_length=500, description="New description"
    )


class CollegeDeptBatchUpdateResult(BaseModel):
    """Individual item result from batch update operation"""

    index: int = Field(..., description="Index in the request list (0-based)")
    college_dept_id: str = Field(
        ..., description="College department ID that was updated"
    )
    success: bool = Field(..., description="Whether this item was updated successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")
    data: Optional[CollegeDeptPublic] = Field(
        default=None, description="Updated college department (if successful)"
    )


class CollegeDeptBatchUpdate(BaseModel):
    """Batch update request for college departments"""

    items: List[CollegeDeptBatchUpdateItem] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of college departments to update (1-100 items)",
    )


class CollegeDeptBatchUpdateResponse(BaseModel):
    """Batch update response for college departments"""

    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully updated")
    failed: int = Field(..., description="Number of items that failed")
    results: List[CollegeDeptBatchUpdateResult] = Field(
        ..., description="Detailed results for each item"
    )


# Batch delete models
class CollegeDeptBatchDeleteResult(BaseModel):
    """Individual item result from batch delete operation"""

    index: int = Field(..., description="Index in the request list (0-based)")
    college_dept_id: str = Field(
        ..., description="College department ID that was deleted"
    )
    success: bool = Field(..., description="Whether this item was deleted successfully")
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")


class CollegeDeptBatchDelete(BaseModel):
    """Batch delete request for college departments"""

    ids: List[str] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of college department IDs to delete (1-100 items)",
    )


class CollegeDeptBatchDeleteResponse(BaseModel):
    """Batch delete response for college departments"""

    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully deleted")
    failed: int = Field(..., description="Number of items that failed")
    results: List[CollegeDeptBatchDeleteResult] = Field(
        ..., description="Detailed results for each item"
    )


# Batch restore models
class CollegeDeptBatchRestoreResult(BaseModel):
    """Individual item result from batch college department restore operation"""

    index: int = Field(..., description="Index in the request list (0-based)")
    college_dept_id: str = Field(
        ..., description="College department ID that was restored"
    )
    success: bool = Field(
        ..., description="Whether this item was restored successfully"
    )
    code: str = Field(..., description="Error code (if failed) or success code")
    message: str = Field(..., description="Detailed message about the result")


class CollegeDeptBatchRestore(BaseModel):
    """Batch restore request for college departments"""

    ids: List[str] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of college department IDs to restore (1-100 items)",
    )


class CollegeDeptBatchRestoreResponse(BaseModel):
    """Batch restore response for college departments"""

    total_items: int = Field(..., description="Total items in request")
    successful: int = Field(..., description="Number of items successfully restored")
    failed: int = Field(..., description="Number of items that failed")
    results: List[CollegeDeptBatchRestoreResult] = Field(
        ..., description="Detailed results for each item"
    )
