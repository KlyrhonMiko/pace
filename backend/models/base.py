import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from utils.timezone import get_current_time_gmt8


def generate_uuid7() -> uuid.UUID:
    """Use UUIDv7 when available, with a UUIDv4 fallback for older runtimes."""
    factory = getattr(uuid, "uuid7", uuid.uuid4)
    return factory()


class BaseTable(SQLModel):
    """Shared persisted-table columns used across the backend."""

    id: uuid.UUID = Field(default_factory=generate_uuid7, primary_key=True)
    created_by: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
    )
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(
        default_factory=get_current_time_gmt8,
        sa_column_kwargs={"onupdate": get_current_time_gmt8},
    )
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
    deleted_by: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
    )
