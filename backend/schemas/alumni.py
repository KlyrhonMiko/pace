import uuid
from datetime import datetime, date
from typing import Optional, Any, List, Dict
from sqlmodel import SQLModel, Field
from pydantic import field_serializer, field_validator
from schemas.base import AuditPublicSQLModel
from utils.timezone import format_datetime_gmt8


class AlumniCreate(SQLModel):
    alumni_id: str = Field(max_length=11)
    last_name: str = Field(max_length=50)
    first_name: str = Field(max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: str = Field(max_length=10)
    age: int
    birthdate: Optional[date] = None
    consent_for_survey_ml: bool = False
    skills: Optional[List[str]] = []

    @field_validator("gender", mode="before")
    @classmethod
    def capitalize_gender(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if v < 0:
            raise ValueError("Invalid age")
        return v


class AlumniPublic(AuditPublicSQLModel):
    alumni_id: str
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    age: int
    birthdate: Optional[date]
    consent_for_survey_ml: bool
    employment_status: Optional[str] = None
    employment_sector: Optional[str] = None
    salary_package: Optional[float] = None
    offers_received: Optional[int] = None
    skills: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)


class AlumniUpdate(SQLModel):
    last_name: Optional[str] = Field(default=None, max_length=50)
    first_name: Optional[str] = Field(default=None, max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: Optional[str] = Field(default=None, max_length=10)
    age: Optional[int] = None
    birthdate: Optional[date] = None
    consent_for_survey_ml: Optional[bool] = None
    employment_status: Optional[str] = Field(default=None, max_length=20)
    employment_sector: Optional[str] = Field(default=None, max_length=100)
    salary_package: Optional[float] = None
    offers_received: Optional[int] = None
    skills: Optional[List[str]] = None

    @field_validator("gender", mode="before")
    @classmethod
    def capitalize_gender(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if v is not None and v < 0:
            raise ValueError("Invalid age")
        return v

class ResumeSchema(SQLModel):
    personal: Dict[str, Any]
    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    skills: List[Dict[str, Any]]


class ResumeSave(SQLModel):
    resume_data: ResumeSchema


class ResumeRead(SQLModel):
    id: Optional[uuid.UUID] = None
    alumni_id: str
    resume_data: ResumeSchema
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)
