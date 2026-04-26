from typing import Optional
from sqlmodel import SQLModel, Field, JSON
from models.base import BaseTable
from schemas.questions import QuestionType


class QuestionBase(SQLModel):
    question_text: str = Field(max_length=1000)
    question_type: QuestionType
    options: Optional[str] = Field(default=None, sa_type=JSON)
    scale_min: Optional[int] = Field(default=None)
    scale_max: Optional[int] = Field(default=None)
    scale_label_min: Optional[str] = Field(default=None, max_length=100)
    scale_label_max: Optional[str] = Field(default=None, max_length=100)
    placeholder: Optional[str] = Field(default=None, max_length=200)
    is_required: bool = Field(default=True)


class Question(BaseTable, QuestionBase, table=True):
    __tablename__ = "questions"

    question_id: str = Field(max_length=20, unique=True, index=True)
