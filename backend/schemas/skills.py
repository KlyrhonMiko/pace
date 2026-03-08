from datetime import datetime
from typing import Optional
import uuid
from sqlmodel import SQLModel, Field
from pydantic import field_serializer
from utils.timezone import format_datetime_gmt8


class SkillsCreate(SQLModel):
    skill_id: str = Field(max_length=11)
    soft_skills_avg: Optional[float] = None
    hard_skills_avg: Optional[float] = None
    alumni_code: uuid.UUID


class SkillsPublic(SQLModel):
    skill_id: str
    soft_skills_avg: Optional[float] = None
    hard_skills_avg: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    deleted_at: Optional[datetime] = None

    @field_serializer("created_at", "updated_at", "deleted_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)


class SkillsListCreate(SQLModel):
    skill_name: str = Field(max_length=100)
    skill_value: Optional[float] = Field(default=None, ge=0, le=100)
    skill_code: uuid.UUID


class SkillsListPublic(SQLModel):
    skill_name: str
    skill_value: Optional[float] = None
