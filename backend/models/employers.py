import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from models.base import BaseTable

class EmployerBase(SQLModel):
    company_name: str = Field(max_length=255)
    contact_person_first_name: str = Field(max_length=150)
    contact_person_last_name: str = Field(max_length=150)
    contact_person_position: Optional[str] = Field(default=None, max_length=150)
    company_website: Optional[str] = Field(default=None, max_length=255)
    company_address: Optional[str] = Field(default=None, max_length=500)
    company_contact_number: Optional[str] = Field(default=None, max_length=20)
    company_logo_url: Optional[str] = Field(default=None, max_length=500)
    company_logo_public_id: Optional[str] = Field(default=None, max_length=500)

class Employer(BaseTable, EmployerBase, table=True):
    __tablename__ = "employers"

    user_ref_id: uuid.UUID = Field(foreign_key="users.id", unique=True, index=True)
