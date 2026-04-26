import uuid
from typing import Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from models.base import BaseTable


class AlumniResume(BaseTable, SQLModel, table=True):
    """
    Stores an alumni's resume data in JSON format as built by the Resume Builder.
    """
    __tablename__ = "alumni_resumes"

    alumni_ref_id: uuid.UUID = Field(
        foreign_key="alumni.id",
        unique=True,  # 1-to-1 for now, can be changed later
        ondelete="CASCADE",
        index=True
    )
    resume_data: Any = Field(
        sa_column=Column(JSON, nullable=False),
    )
