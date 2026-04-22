import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from utils.timezone import get_current_time_gmt8

class EmployerBase(SQLModel):
    user_code: uuid.UUID = Field(foreign_key="users.user_code", unique=True, index=True)
    company_name: str = Field(max_length=255)
    contact_person_first_name: str = Field(max_length=150)
    contact_person_last_name: str = Field(max_length=150)
    contact_person_position: Optional[str] = Field(default=None, max_length=150)
    company_website: Optional[str] = Field(default=None, max_length=255)
    company_address: Optional[str] = Field(default=None, max_length=500)

class Employer(EmployerBase, table=True):
    __tablename__ = "employers"

    employer_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
