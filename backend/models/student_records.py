import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from utils.timezone import get_current_time_gmt8


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


class StudentRecord(StudentRecordBase, table=True):
    __tablename__ = "student_records"

    student_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    course_code: Optional[uuid.UUID] = Field(default=None, foreign_key="courses.course_code", ondelete="SET NULL")
    alumni_code: Optional[uuid.UUID] = Field(default=None, foreign_key="alumni.alumni_code", unique=True, ondelete="SET NULL")
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
