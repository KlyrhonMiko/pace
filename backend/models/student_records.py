import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from models.base import BaseTable


class StudentRecordBase(SQLModel):
    student_id: str = Field(max_length=10, unique=True, index=True)
    year_graduated: int
    gwa: float
    avg_prof_grade: Optional[float] = None
    avg_elec_grade: Optional[float] = None
    ojt_grade: Optional[float] = None
    leadership_pos: Optional[bool] = None
    act_member_pos: Optional[bool] = None
    projects: Optional[int] = Field(default=None, ge=0, le=10, description="Number of academic/personal projects (0–10)")
    extracurricular: Optional[bool] = Field(default=None, description="Whether student had extracurricular involvement")


class StudentRecord(BaseTable, StudentRecordBase, table=True):
    __tablename__ = "student_records"

    course_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="courses.id", ondelete="SET NULL")
    alumni_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="alumni.id", unique=True, ondelete="SET NULL")
