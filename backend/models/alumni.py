import uuid
from datetime import date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from models.base import BaseTable


class AlumniBase(SQLModel):
    alumni_id: str = Field(max_length=11, unique=True, index=True)
    last_name: str = Field(max_length=50)
    first_name: str = Field(max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: str = Field(max_length=10)
    age: int
    birthdate: Optional[date] = None
    consent_for_survey_ml: bool = Field(default=False)
    
    # Placement Tracking Fields
    employment_status: Optional[str] = Field(default="Searching", max_length=20) # Employed, Interviewing, Searching, Not Looking
    employment_sector: Optional[str] = Field(default=None, max_length=100)
    salary_package: Optional[float] = Field(default=0.0)
    offers_received: Optional[int] = Field(default=0)
    skills: Optional[List[str]] = Field(default=[], sa_column=Column(JSON))


class Alumni(BaseTable, AlumniBase, table=True):
    __tablename__ = "alumni"

    user_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id", ondelete="SET NULL", unique=True)
    student_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="student_records.id", unique=True, ondelete="SET NULL")
