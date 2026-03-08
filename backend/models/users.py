import uuid
from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field
from utils.timezone import get_current_time_gmt8


class UserType(str, Enum):
    USER = "USER"
    STAFF = "STAFF"
    ADMIN = "ADMIN"


class UserBase(SQLModel):
    user_id: str = Field(max_length=12, unique=True, index=True)
    username: str = Field(max_length=50, unique=True, index=True)
    email: str = Field(max_length=100, unique=True, index=True)
    user_type: UserType = Field(default=UserType.USER)


class User(UserBase, table=True):
    __tablename__ = "users"

    user_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    password: str = Field(max_length=255)  # Hashed password
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
