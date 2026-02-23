import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from utils.timezone import get_current_time_gmt8


class SkillsBase(SQLModel):
    skill_id: str = Field(max_length=11, unique=True, index=True)
    soft_skills_avg: Optional[float] = None
    hard_skills_avg: Optional[float] = None


class Skills(SkillsBase, table=True):
    __tablename__ = "skills"

    skill_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    alumni_code: Optional[uuid.UUID] = Field(default=None, foreign_key="alumni.alumni_code", ondelete="SET NULL")
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)


class SkillsListBase(SQLModel):
    skill_name: str = Field(max_length=100)
    skill_value: Optional[float] = Field(default=None, ge=0, le=100)


class SkillsList(SkillsListBase, table=True):
    __tablename__ = "skills_list"

    sl_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    skill_code: uuid.UUID = Field(foreign_key="skills.skill_code", ondelete="CASCADE")
