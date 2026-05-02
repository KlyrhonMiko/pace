"""Platform-level configuration flags persisted in the database.

This table uses a singleton pattern — only one row ever exists (id=1).
Redis is used as a read-through cache with a short TTL to avoid hitting
the DB on every request.
"""
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from utils.timezone import get_current_time_gmt8


class PlatformSettings(SQLModel, table=True):
    __tablename__ = "platform_settings"

    # Singleton primary key — always 1
    id: int = Field(default=1, primary_key=True)

    maintenance_mode: bool = Field(default=False)
    public_registrations: bool = Field(default=True)

    updated_at: datetime = Field(
        default_factory=get_current_time_gmt8,
        sa_column_kwargs={"onupdate": get_current_time_gmt8},
    )
    updated_by: Optional[str] = Field(default=None, max_length=50)
