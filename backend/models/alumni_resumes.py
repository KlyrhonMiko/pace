import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from utils.timezone import get_current_time_gmt8


class AlumniResume(SQLModel, table=True):
    """
    Stores an alumni's resume data in JSON format as built by the Resume Builder.
    """
    __tablename__ = "alumni_resumes"

    resume_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    alumni_code: uuid.UUID = Field(
        foreign_key="alumni.alumni_code",
        unique=True,  # 1-to-1 for now, can be changed later
        ondelete="CASCADE",
        index=True
    )
    resume_data: Any = Field(
        sa_column=Column(JSON, nullable=False),
    )
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8, sa_column_kwargs={"onupdate": get_current_time_gmt8})
