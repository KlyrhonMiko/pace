import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from utils.timezone import get_current_time_gmt8


class AlumniBase(SQLModel):
    alumni_id: str = Field(max_length=11, unique=True, index=True)
    last_name: str = Field(max_length=50)
    first_name: str = Field(max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: str = Field(max_length=10)
    age: int


class Alumni(AlumniBase, table=True):
    __tablename__ = "alumni"

    alumni_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_code: Optional[uuid.UUID] = Field(default=None, foreign_key="users.user_code", ondelete="SET NULL")
    student_code: Optional[uuid.UUID] = Field(default=None, foreign_key="student_records.student_code", unique=True, ondelete="SET NULL")
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
