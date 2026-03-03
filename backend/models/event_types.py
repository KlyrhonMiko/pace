import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from models.events import Event
from utils.timezone import get_current_time_gmt8


class EventTypeBase(SQLModel):
    event_name: str = Field(max_length=100, unique=True, index=True)


class EventType(EventTypeBase, table=True):
    __tablename__ = "event_types"

    event_type_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_type_id: str = Field(max_length=12, unique=True, index=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)

    events: List["Event"] = Relationship(back_populates="event_type")
