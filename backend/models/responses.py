from typing import Optional
from datetime import datetime, timezone, timedelta, date
from sqlmodel import SQLModel
from pydantic import field_serializer
from utils.timezone import GMT8

# Response for alumni full profile


class AlumniFullProfile(SQLModel):
    """Complete alumni profile with all related information"""

    # Alumni info
    alumni_id: str
    last_name: str
    first_name: str
    middle_name: Optional[str]
    gender: str
    age: int
    birthdate: Optional[date]
    consent_for_survey_ml: Optional[bool]

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

    # Timestamps
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: datetime) -> str:
        """Convert to GMT+8 and format as YYYY-MM-DD HH:MM:SS without microseconds"""
        # Convert UTC datetime to GMT+8
        if value.tzinfo is None:
            # Assume it's UTC if no timezone info
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime("%Y-%m-%d %H:%M:%S")
