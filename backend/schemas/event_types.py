from typing import Optional
from sqlmodel import SQLModel, Field
from pydantic import field_validator, field_serializer
from datetime import datetime
from utils.timezone import format_datetime_gmt8


class EventTypeCreate(SQLModel):
    event_name: str = Field(max_length=100)

    @field_validator("event_name")
    @classmethod
    def validate_event_name(cls, v):
        """Ensure event_name is not empty"""
        if isinstance(v, str) and not v.strip():
            raise ValueError("Event name cannot be empty")
        return v


class EventTypeUpdate(SQLModel):
    event_name: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = Field(default=None)

    @field_validator("event_name")
    @classmethod
    def validate_event_name(cls, v):
        """Ensure event_name is not empty if provided"""
        if v is not None and isinstance(v, str) and not v.strip():
            raise ValueError("Event name cannot be empty")
        return v


class EventTypePublic(SQLModel):
    event_type_id: str
    event_name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        """Convert to GMT+8 and format using the shared datetime display format."""
        return format_datetime_gmt8(value)
