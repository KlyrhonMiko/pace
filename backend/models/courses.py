import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from models.base import BaseTable


class CourseBase(SQLModel):
    course_abbv: str = Field(max_length=20, unique=True, index=True)
    course_name: str = Field(max_length=200, unique=True, index=True)
    course_desc: Optional[str] = Field(default=None, max_length=500)


class Course(BaseTable, CourseBase, table=True):
    __tablename__ = "courses"

    course_id: str = Field(max_length=12, unique=True, index=True)
    college_dept_ref_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="college_depts.id", ondelete="SET NULL"
    )
