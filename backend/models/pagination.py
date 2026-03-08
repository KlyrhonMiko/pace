from datetime import datetime
from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field, field_serializer

from utils.timezone import format_datetime_gmt8, get_current_time_gmt8

T = TypeVar('T')


class PaginationMetadata(BaseModel):
    """Pagination metadata for paginated responses"""
    total: int = Field(..., description="Total number of records in database")
    limit: int = Field(..., description="Number of records per page (0 = all)")
    offset: int = Field(..., description="Number of records skipped")
    returned: int = Field(..., description="Number of records returned in this response")
    has_next: bool = Field(..., description="Whether there are more records after this page")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper"""
    success: bool = Field(..., description="Whether the operation was successful")
    code: str = Field(..., description="Response code")
    message: str = Field(..., description="Human-readable message")
    data: List[T] = Field(..., description="List of records")
    pagination: PaginationMetadata = Field(..., description="Pagination metadata")
    timestamp: datetime = Field(
        default_factory=get_current_time_gmt8,
        description="Response timestamp in GMT+8",
    )

    @field_serializer("timestamp")
    def serialize_timestamp(self, value: datetime) -> str:
        """Serialize timestamp using the shared GMT+8 display format."""
        return format_datetime_gmt8(value)
