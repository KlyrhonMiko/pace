from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from models.base import BaseTable

if TYPE_CHECKING:
    from models.events import Event


class EventTypeBase(SQLModel):
    event_name: str = Field(max_length=100, unique=True, index=True)


class EventType(BaseTable, EventTypeBase, table=True):
    __tablename__ = "event_types"

    event_type_id: str = Field(max_length=12, unique=True, index=True)
    is_active: bool = Field(default=True)

    events: List["Event"] = Relationship(back_populates="event_type")
