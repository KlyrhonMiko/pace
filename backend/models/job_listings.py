import uuid
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
from utils.timezone import get_current_time_gmt8

class JobType(str, Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    INTERNSHIP = "Internship"

class WorkType(str, Enum):
    REMOTE = "Remote"
    HYBRID = "Hybrid"
    ON_SITE = "On-site"

class ExperienceLevel(str, Enum):
    INTERNSHIP = "Internship"
    ENTRY_LEVEL = "Entry Level"
    MID_LEVEL = "Mid-Level"
    SENIOR = "Senior"
    LEAD = "Lead"

class JobListingBase(SQLModel):
    title: str
    company: Optional[str] = None
    description: str
    location: str
    job_type: Optional[str] = Field(default=None)
    work_type: Optional[str] = Field(default=None)
    experience_level: Optional[str] = Field(default=None)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    raw_salary: Optional[str] = None
    posted_at: datetime = Field(default_factory=get_current_time_gmt8)
    source_api: Optional[str] = None
    external_id: Optional[str] = None
    source_url: Optional[str] = None
    is_active: bool = True
    employer_id: Optional[uuid.UUID] = Field(default=None, foreign_key="employers.employer_id", index=True)

class JobListing(JobListingBase, table=True):
    __tablename__ = "job_listings"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)

class JobListingCreate(JobListingBase):
    pass

class JobListingRead(JobListingBase):
    id: int
    created_at: datetime
    updated_at: datetime

class JobListingUpdate(SQLModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    work_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    is_active: Optional[bool] = None

class JobApplication(SQLModel, table=True):
    __tablename__ = "job_applications"
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="job_listings.id", index=True)
    alumni_code: uuid.UUID = Field(foreign_key="alumni.alumni_code", index=True)
    status: str = Field(default="Pending") # Pending, Reviewed, Accepted, Rejected
    applied_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
