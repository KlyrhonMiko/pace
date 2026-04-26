import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel, Field
from sqlalchemy import JSON
from pydantic import field_serializer
from models.base import BaseTable
from utils.timezone import format_datetime_gmt8, get_current_time_gmt8


class TransactionLog(BaseTable, SQLModel, table=True):
    """Transaction log for tracking all CREATE, UPDATE, DELETE, RESTORE operations"""

    __tablename__ = "transaction_logs"

    tl_id: str = Field(
        max_length=12, unique=True, index=True
    )  # Human-readable ID like TL-000001
    tl_name: str = Field(
        max_length=500
    )  # Descriptive action name (e.g., "CREATED user USER-000001")
    before: Optional[Any] = Field(
        default=None, sa_type=JSON
    )  # JSON snapshot before operation
    after: Optional[Any] = Field(
        default=None, sa_type=JSON
    )  # JSON snapshot after operation
    tl_date: datetime = Field(
        default_factory=get_current_time_gmt8
    )  # Timestamp in GMT+8
    performed_by_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")  # UUID of user who performed action


class TransactionLogCreate(SQLModel):
    """Request model for creating transaction log entries"""

    tl_id: str = Field(max_length=12)
    tl_name: str = Field(max_length=500)
    before: Optional[Any] = None
    after: Optional[Any] = None
    performed_by_ref_id: Optional[uuid.UUID] = None


class TransactionLogPublic(SQLModel):
    """Public response model for transaction logs"""

    tl_id: str
    tl_name: str
    before: Optional[Any] = None
    after: Optional[Any] = None
    tl_date: datetime
    performed_by_ref_id: Optional[uuid.UUID] = None

    @field_serializer("tl_date")
    def serialize_datetime(self, value: datetime) -> str:
        """Convert to GMT+8 and format using the shared datetime display format."""
        return format_datetime_gmt8(value)
