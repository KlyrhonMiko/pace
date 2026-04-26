from typing import Optional
from sqlmodel import SQLModel, Field
from models.base import BaseTable


class CollegeDeptBase(SQLModel):
    college_dept_abbv: str = Field(max_length=20, unique=True, index=True)
    college_dept_name: str = Field(max_length=200, unique=True, index=True)
    college_dept_desc: Optional[str] = Field(default=None, max_length=500)


class CollegeDept(BaseTable, CollegeDeptBase, table=True):
    __tablename__ = "college_depts"

    college_dept_id: str = Field(max_length=12, unique=True, index=True)
