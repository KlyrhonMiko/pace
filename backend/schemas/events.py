from datetime import datetime, time
from typing import Optional
from sqlmodel import SQLModel, Field
from pydantic import field_serializer, field_validator
from utils.timezone import format_date_gmt8, format_datetime_gmt8, format_time_value


class EventCreate(SQLModel):
    event_name: str = Field(max_length=255)
    description: str = Field(max_length=1000)
    event_type_name: str = Field(description="Event type name (e.g., 'Career Fair')")
    date: datetime
    time_start: time
    time_end: time
    location: str = Field(max_length=255)
    capacity: int = Field(gt=0)


class EventUpdate(SQLModel):
    event_name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    event_type_name: Optional[str] = Field(
        default=None, description="Event type name (e.g., 'Career Fair')"
    )
    date: Optional[datetime] = None
    time_start: Optional[time] = None
    time_end: Optional[time] = None
    location: Optional[str] = Field(default=None, max_length=255)
    capacity: Optional[int] = Field(default=None, gt=0)


class EventPublic(SQLModel):
    event_id: str
    event_name: str
    description: str
    event_type: str
    date: datetime
    time_start: time
    time_end: time
    location: str
    capacity: int
    attendees: int
    image_path: Optional[str] = None
    is_registered: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("event_type", mode="before")
    @classmethod
    def resolve_event_type(cls, v):
        """Extract event_name from event_type relationship object"""
        if isinstance(v, str):
            return v
        if hasattr(v, "event_name"):
            return v.event_name
        return str(v)

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)

    @field_serializer("date")
    def serialize_date(self, value: Optional[datetime]) -> Optional[str]:
        return format_date_gmt8(value)

    @field_serializer("time_start", "time_end")
    def serialize_time(self, value: Optional[time]) -> Optional[str]:
        return format_time_value(value)


class EventRegistrationResponse(SQLModel):
    event_id: str
    registered_at: datetime

    @field_serializer("registered_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)


class EventRegistrationRequest(SQLModel):
    user_code: str
