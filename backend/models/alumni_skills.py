import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from utils.timezone import get_current_time_gmt8


class AlumniSkills(SQLModel, table=True):
    """
    Stores an alumni's self-reported skill metrics for employability prediction.

    - soft_skills_ave / hard_skills_ave: aggregate scores (0–100)
    - program_skills: flexible JSON dict of program-specific skill scores,
      e.g. {"Python Programming Skills": 85.0, "Teaching Skills": 90.0}
      Keys must exactly match the EmployabilityPredictor input key names.
    """
    __tablename__ = "alumni_skills"

    skill_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    alumni_code: uuid.UUID = Field(
        foreign_key="alumni.alumni_code",
        unique=True,  # 1-to-1 relationship with Alumni
        ondelete="CASCADE",
    )
    soft_skills_ave: Optional[float] = Field(default=None, ge=0, le=100)
    hard_skills_ave: Optional[float] = Field(default=None, ge=0, le=100)
    program_skills: Optional[Any] = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )
    program_skills_average: Optional[float] = Field(default=None)
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
