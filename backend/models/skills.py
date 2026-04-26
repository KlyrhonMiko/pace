import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from models.base import BaseTable


class SkillsBase(SQLModel):
    skill_id: str = Field(max_length=11, unique=True, index=True)
    soft_skills_avg: Optional[float] = None
    hard_skills_avg: Optional[float] = None


class Skills(BaseTable, SkillsBase, table=True):
    __tablename__ = "skills"

    alumni_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="alumni.id", ondelete="SET NULL")


class SkillsListBase(SQLModel):
    skill_name: str = Field(max_length=100)
    skill_value: Optional[float] = Field(default=None, ge=0, le=100)


class SkillsList(BaseTable, SkillsListBase, table=True):
    __tablename__ = "skills_list"

    skill_ref_id: uuid.UUID = Field(foreign_key="skills.id", ondelete="CASCADE")
