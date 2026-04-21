from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel
from pydantic import field_serializer
from utils.timezone import format_datetime_gmt8

# Response for alumni full profile


class AlumniFullProfile(SQLModel):
    """Complete alumni profile with all related information"""

    # Alumni info
    alumni_code: str
    alumni_id: str
    last_name: str
    first_name: str
    middle_name: Optional[str]
    gender: str
    age: int
    birthdate: Optional[date]
    consent_for_survey_ml: Optional[bool]
    employment_status: Optional[str] = None
    employment_sector: Optional[str] = None
    salary_package: Optional[float] = None
    offers_received: Optional[int] = None

    # User account info
    user_id: Optional[str]
    username: Optional[str]
    email: Optional[str]

    # Student record info
    student_id: Optional[str]
    year_graduated: Optional[int]
    gwa: Optional[float]
    avg_prof_grade: Optional[float]
    avg_elec_grade: Optional[float]
    ojt_grade: Optional[float]
    leadership_pos: Optional[bool]
    act_member_pos: Optional[bool]

    # Course info
    course_id: Optional[str]
    course_name: Optional[str]

    # Metrics
    profile_completeness: Optional[int] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: datetime) -> str:
        """Convert to GMT+8 and format using the shared datetime display format."""
        return format_datetime_gmt8(value)
