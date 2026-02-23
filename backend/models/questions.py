import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, JSON
from utils.timezone import get_current_time_gmt8
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


class Question(QuestionBase, table=True):
    __tablename__ = "questions"

    question_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    question_id: str = Field(max_length=20, unique=True, index=True)
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
