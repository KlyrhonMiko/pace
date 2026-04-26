import uuid
from datetime import datetime, time
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from models.base import BaseTable
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


class Event(BaseTable, EventBase, table=True):
    __tablename__ = "events"

    event_id: str = Field(max_length=12, unique=True, index=True)
    event_type_ref_id: uuid.UUID = Field(foreign_key="event_types.id", index=True)
    attendees: int = Field(default=0, ge=0)
    image_path: Optional[str] = Field(default=None, max_length=500)

    event_type: "EventType" = Relationship(back_populates="events")
    registrants: List["EventRegistration"] = Relationship(back_populates="event")


class EventRegistration(BaseTable, SQLModel, table=True):
    __tablename__ = "event_registrations"

    event_ref_id: uuid.UUID = Field(foreign_key="events.id", index=True)
    user_ref_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    registered_at: datetime = Field(default_factory=get_current_time_gmt8)

    event: "Event" = Relationship(back_populates="registrants")


class EventRegistrantDetails(SQLModel):
    event_id: str
    alumni_id: Optional[str] = None
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    student_id: Optional[str] = None
    year_graduated: Optional[int] = None
    registered_at: datetime
