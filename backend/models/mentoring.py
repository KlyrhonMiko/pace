import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from utils.timezone import get_current_time_gmt8

class SessionBase(SQLModel):
    title: str = Field(max_length=255)
    description: str = Field(max_length=1000)
    scheduled_at: datetime
    location: str = Field(max_length=255)
    status: str = Field(default="Scheduled", max_length=20) # Scheduled, Completed, Cancelled

class MentoringSession(SessionBase, table=True):
    __tablename__ = "mentoring_sessions"

    session_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    faculty_user_code: uuid.UUID = Field(foreign_key="users.user_code")
    alumni_user_code: uuid.UUID = Field(foreign_key="users.user_code")
    
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)

class SessionRead(SessionBase):
    session_code: uuid.UUID
    faculty_user_code: uuid.UUID
    alumni_user_code: uuid.UUID
    created_at: datetime
