import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from models.base import BaseTable


class StaffBase(SQLModel):
    staff_id: str = Field(max_length=12, unique=True, index=True)
    last_name: str = Field(max_length=50)
    first_name: str = Field(max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: str = Field(max_length=10)


class Staff(BaseTable, StaffBase, table=True):
    __tablename__ = "staff"

    user_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id", ondelete="SET NULL", unique=True)
    college_dept_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="college_depts.id", ondelete="SET NULL")
