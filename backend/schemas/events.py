from datetime import datetime, time, timezone
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field
from pydantic import field_serializer
from utils.timezone import GMT8


class EventType(str, Enum):
    CAREER_FAIR = "Career Fair"
    WORKSHOP = "Workshop"
    SEMINAR = "Seminar"
    NETWORKING = "Networking"
    OTHER = "Other"


class EventCreate(SQLModel):
    name: str = Field(max_length=255)
    description: str = Field(max_length=1000)
    event_type: EventType
    date: datetime
    time_start: time
    time_end: time
    location: str = Field(max_length=255)
    capacity: int = Field(gt=0)


class EventUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    event_type: Optional[EventType] = None
    date: Optional[datetime] = None
    time_start: Optional[time] = None
    time_end: Optional[time] = None
    location: Optional[str] = Field(default=None, max_length=255)
    capacity: Optional[int] = Field(default=None, gt=0)


class EventPublic(SQLModel):
    event_id: str
    name: str
    description: str
    event_type: EventType
    date: datetime
    time_start: time
    time_end: time
    location: str
    capacity: int
    attendees: int
    image_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at', 'date')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')

    @field_serializer('time_start', 'time_end')
    def serialize_time(self, value: Optional[time]) -> Optional[str]:
        if value is None:
            return None
        return value.strftime('%H:%M')


class EventRegistrationResponse(SQLModel):
    event_id: str
    registered_at: datetime

    @field_serializer('registered_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')


class EventRegistrationRequest(SQLModel):
    user_code: str
