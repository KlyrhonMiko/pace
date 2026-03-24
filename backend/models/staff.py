import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from utils.timezone import get_current_time_gmt8


class StaffBase(SQLModel):
    staff_id: str = Field(max_length=12, unique=True, index=True)
    last_name: str = Field(max_length=50)
    first_name: str = Field(max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: str = Field(max_length=10)


class Staff(StaffBase, table=True):
    __tablename__ = "staff"

    staff_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_code: Optional[uuid.UUID] = Field(default=None, foreign_key="users.user_code", ondelete="SET NULL")
    college_dept_code: Optional[uuid.UUID] = Field(default=None, foreign_key="college_depts.college_dept_code", ondelete="SET NULL")
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
