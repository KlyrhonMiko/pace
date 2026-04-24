import uuid
from datetime import datetime
from typing import Optional, Any
from enum import Enum
from sqlmodel import SQLModel, Field, JSON
from pydantic import field_serializer
from utils.timezone import format_datetime_gmt8, get_current_time_gmt8


class ActivityType(str, Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    REGISTER_FOR_EVENT = "REGISTER_FOR_EVENT"
    UNREGISTER_FROM_EVENT = "UNREGISTER_FROM_EVENT"
    SUBMIT_SURVEY = "SUBMIT_SURVEY"
    UPDATE_PROFILE = "UPDATE_PROFILE"
    PASSWORD_RESET = "PASSWORD_RESET"
    JOB_APPLICATION = "JOB_APPLICATION"


class UserActivity(SQLModel, table=True):
    """Activity log for tracking significant user-triggered actions"""

    __tablename__ = "user_activities"

    activity_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    activity_id: str = Field(
        max_length=12, unique=True, index=True
    )  # Human-readable ID like ACT-000001
    user_code: uuid.UUID = Field(index=True)  # UUID of user who performed action
    activity_type: ActivityType = Field(index=True)
    description: str = Field(max_length=500)
    activity_metadata: Optional[Any] = Field(default=None, sa_type=JSON)
    created_at: datetime = Field(default_factory=get_current_time_gmt8)

    @field_serializer("created_at")
    def serialize_datetime(self, value: datetime) -> str:
        """Convert to GMT+8 and format using the shared datetime display format."""
        return format_datetime_gmt8(value)


class UserActivityCreate(SQLModel):
    """Request model for creating activity log entries"""

    user_code: uuid.UUID
    activity_type: ActivityType
    description: str
    activity_metadata: Optional[Any] = None


class UserActivityPublic(SQLModel):
    """Public response model for user activities"""

    activity_id: str
    activity_type: ActivityType
    description: str
    activity_metadata: Optional[Any] = None
    created_at: datetime

    @field_serializer("created_at")
    def serialize_datetime(self, value: datetime) -> str:
        return format_datetime_gmt8(value)
