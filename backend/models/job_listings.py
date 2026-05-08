import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel
from sqlalchemy import Column, LargeBinary

from models.base import BaseTable
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
    requirements: Optional[str] = None
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
    employer_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="employers.id", index=True)

class JobListing(BaseTable, JobListingBase, table=True):
    __tablename__ = "job_listings"

    vector_embedding: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))

class JobListingCreate(JobListingBase):
    pass

class JobListingRead(JobListingBase):
    id: uuid.UUID
    logo: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    deleted_at: Optional[datetime] = None

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

class JobApplication(BaseTable, SQLModel, table=True):
    __tablename__ = "job_applications"

    job_listing_ref_id: uuid.UUID = Field(foreign_key="job_listings.id", index=True)
    alumni_ref_id: uuid.UUID = Field(foreign_key="alumni.id", index=True)
    status: str = Field(default="Pending") # Pending, Reviewed, Accepted, Rejected
    applied_at: datetime = Field(default_factory=get_current_time_gmt8)
    resume_file_url: Optional[str] = None
    interview_date: Optional[datetime] = None
    interview_link: Optional[str] = None
