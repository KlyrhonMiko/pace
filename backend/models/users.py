from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field
from models.base import BaseTable


class UserType(str, Enum):
    USER = "USER"
    STAFF = "STAFF"
    ADMIN = "ADMIN"
    EMPLOYER = "EMPLOYER"
    FACULTY = "FACULTY"


class UserBase(SQLModel):
    user_id: str = Field(max_length=20, unique=True, index=True)
    username: str = Field(max_length=50, unique=True, index=True)
    email: str = Field(max_length=100, unique=True, index=True)
    user_type: UserType = Field(default=UserType.USER)


class User(BaseTable, UserBase, table=True):
    __tablename__ = "users"

    password: str = Field(max_length=255)  # Hashed password
    auth_revoked_after: datetime | None = Field(default=None, nullable=True)
    password_changed_at: datetime | None = Field(default=None, nullable=True)
