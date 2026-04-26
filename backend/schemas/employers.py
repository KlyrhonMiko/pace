from pydantic import BaseModel, ConfigDict, Field, EmailStr
from pydantic import field_validator
from typing import Optional
import uuid
from schemas.base import AuditPublicBaseModel
from utils.crypto import validate_password_strength

class EmployerCreate(BaseModel):
    # Base user fields
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    
    # Employer profile fields
    company_name: str = Field(min_length=2, max_length=255)
    contact_person_first_name: str = Field(min_length=2, max_length=150)
    contact_person_last_name: str = Field(min_length=2, max_length=150)
    contact_person_position: Optional[str] = Field(default=None, max_length=150)
    company_website: Optional[str] = Field(default=None, max_length=255)
    company_address: Optional[str] = Field(default=None, max_length=500)
    company_contact_number: Optional[str] = Field(default=None, max_length=20)

    @field_validator("password")
    @classmethod
    def validate_password_policy(cls, v: str) -> str:
        return validate_password_strength(v)

class EmployerUpdate(BaseModel):
    company_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    contact_person_first_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    contact_person_last_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    contact_person_position: Optional[str] = Field(default=None, max_length=150)
    company_website: Optional[str] = Field(default=None, max_length=255)
    company_address: Optional[str] = Field(default=None, max_length=500)
    company_contact_number: Optional[str] = Field(default=None, max_length=20)

class EmployerResponse(AuditPublicBaseModel):
    id: uuid.UUID
    user_id: str
    username: str
    email: EmailStr
    company_name: str
    contact_person_first_name: str
    contact_person_last_name: str
    contact_person_position: Optional[str] = None
    company_website: Optional[str] = None
    company_address: Optional[str] = None
    company_contact_number: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_logo_public_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
