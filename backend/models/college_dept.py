import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone


class CollegeDeptBase(SQLModel):
    college_dept_abbv: str = Field(max_length=20, unique=True, index=True)
    college_dept_name: str = Field(max_length=200, unique=True, index=True)
    college_dept_desc: Optional[str] = Field(default=None, max_length=500)


class CollegeDept(CollegeDeptBase, table=True):
    __tablename__ = "college_depts"

    college_dept_id: str = Field(max_length=12, unique=True, index=True)
    college_dept_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
