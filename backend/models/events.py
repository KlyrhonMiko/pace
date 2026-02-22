import uuid
from datetime import datetime, time
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship
from pydantic import field_serializer, BaseModel
from utils.timezone import get_current_time_gmt8, GMT8
from datetime import timezone


class EventType(str, Enum):
    CAREER_FAIR = "Career Fair"
    WORKSHOP = "Workshop"
    SEMINAR = "Seminar"
    NETWORKING = "Networking"
    OTHER = "Other"


class EventBase(SQLModel):
    name: str = Field(max_length=255)
    description: str = Field(max_length=1000)
    event_type: EventType
    date: datetime
    time_start: time
    time_end: time
    location: str = Field(max_length=255)
    capacity: int = Field(gt=0)


class Event(EventBase, table=True):
    __tablename__ = "events"
    
    event_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: str = Field(max_length=12, unique=True, index=True)  # Auto-generated: EVNT-XXXXXX
    attendees: int = Field(default=0, ge=0)
    image_path: Optional[str] = Field(default=None, max_length=500)  # e.g., "events/EVNT-000001/image.jpg"
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    registrants: List["EventRegistration"] = Relationship(back_populates="event")


class EventCreate(EventBase):
    pass


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
        """Convert to GMT+8 and format as YYYY-MM-DD HH:MM:SS"""
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')
    
    @field_serializer('time_start', 'time_end')
    def serialize_time(self, value: Optional[time]) -> Optional[str]:
        """Format time as HH:MM"""
        if value is None:
            return None
        return value.strftime('%H:%M')


class EventUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    event_type: Optional[EventType] = None
    date: Optional[datetime] = None
    time_start: Optional[time] = None
    time_end: Optional[time] = None
    location: Optional[str] = Field(default=None, max_length=255)
    capacity: Optional[int] = Field(default=None, gt=0)


# Event Registration (for tracking which users registered for which events)
class EventRegistration(SQLModel, table=True):
    __tablename__ = "event_registrations"
    
    registration_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_code: uuid.UUID = Field(foreign_key="events.event_code")
    user_code: uuid.UUID = Field(foreign_key="users.user_code")
    registered_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    event: "Event" = Relationship(back_populates="registrants")


class EventRegistrationResponse(SQLModel):
    event_id: str
    registered_at: datetime
    
    @field_serializer('registered_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        """Convert to GMT+8 and format"""
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')

class EventRegistrationRequest(SQLModel):
    user_code: str
