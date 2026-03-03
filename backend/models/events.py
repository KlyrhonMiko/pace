import uuid
from datetime import datetime, time
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from utils.timezone import get_current_time_gmt8

if TYPE_CHECKING:
    from models.event_types import EventType


class EventBase(SQLModel):
    event_name: str = Field(max_length=255)
    description: str = Field(max_length=1000)
    date: datetime
    time_start: time
    time_end: time
    location: str = Field(max_length=255)
    capacity: int = Field(gt=0)


class Event(EventBase, table=True):
    __tablename__ = "events"

    event_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: str = Field(max_length=12, unique=True, index=True)
    event_type_code: uuid.UUID = Field(foreign_key="event_types.event_type_code")
    attendees: int = Field(default=0, ge=0)
    image_path: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)

    event_type: "EventType" = Relationship(back_populates="events")
    registrants: List["EventRegistration"] = Relationship(back_populates="event")


class EventRegistration(SQLModel, table=True):
    __tablename__ = "event_registrations"

    registration_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_code: uuid.UUID = Field(foreign_key="events.event_code")
    user_code: uuid.UUID = Field(foreign_key="users.user_code")
    registered_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)

    event: "Event" = Relationship(back_populates="registrants")


