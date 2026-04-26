import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field
from models.base import BaseTable

class SessionBase(SQLModel):
    title: str = Field(max_length=255)
    description: str = Field(max_length=1000)
    scheduled_at: datetime
    location: str = Field(max_length=255)
    status: str = Field(default="Scheduled", max_length=20) # Scheduled, Completed, Cancelled

class MentoringSession(BaseTable, SessionBase, table=True):
    __tablename__ = "mentoring_sessions"

    faculty_user_ref_id: uuid.UUID = Field(foreign_key="users.id")
    alumni_user_ref_id: uuid.UUID = Field(foreign_key="users.id")

class SessionRead(SessionBase):
    id: uuid.UUID
    faculty_user_ref_id: uuid.UUID
    alumni_user_ref_id: uuid.UUID
    created_at: datetime
