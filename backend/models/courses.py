import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone


class CourseBase(SQLModel):
    course_abbv: str = Field(max_length=20, unique=True, index=True)
    course_name: str = Field(max_length=200, unique=True, index=True)
    course_desc: Optional[str] = Field(default=None, max_length=500)


class Course(CourseBase, table=True):
    __tablename__ = "courses"

    course_id: str = Field(max_length=12, unique=True, index=True)
    course_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    college_dept_code: Optional[uuid.UUID] = Field(
        default=None, foreign_key="college_depts.college_dept_code", ondelete="SET NULL"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
