from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field
from pydantic import field_serializer, field_validator
from utils.timezone import GMT8


class AlumniCreate(SQLModel):
    alumni_id: str = Field(max_length=11)
    last_name: str = Field(max_length=50)
    first_name: str = Field(max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: str = Field(max_length=10)
    age: int
    student_code: Optional[str] = None  # kept Optional for flexible linking

    @field_validator('gender', mode='before')
    @classmethod
    def capitalize_gender(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v

    @field_validator('age')
    @classmethod
    def validate_age(cls, v):
        if v < 0:
            raise ValueError('Invalid age')
        return v


class AlumniPublic(SQLModel):
    alumni_id: str
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    gender: str
    age: int
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')


class AlumniUpdate(SQLModel):
    last_name: Optional[str] = Field(default=None, max_length=50)
    first_name: Optional[str] = Field(default=None, max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    gender: Optional[str] = Field(default=None, max_length=10)
    age: Optional[int] = None

    @field_validator('gender', mode='before')
    @classmethod
    def capitalize_gender(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v

    @field_validator('age')
    @classmethod
    def validate_age(cls, v):
        if v is not None and v < 0:
            raise ValueError('Invalid age')
        return v
