import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import UniqueConstraint
from sqlmodel import SQLModel, Field, JSON
from models.base import BaseTable
from utils.timezone import get_current_time_gmt8
from schemas.surveys import SurveyStatus


class SurveyBase(SQLModel):
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_anonymous: bool = Field(default=False)
    allow_multiple_responses: bool = Field(default=False)
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    target_department_abbv: Optional[str] = Field(default=None, max_length=20)
    target_course_abbv: Optional[str] = Field(default=None, max_length=20)


class Survey(BaseTable, SurveyBase, table=True):
    __tablename__ = "surveys"

    survey_id: str = Field(max_length=20, unique=True, index=True)
    status: SurveyStatus = Field(default=SurveyStatus.DRAFT)


class SurveyQuestionBase(SQLModel):
    survey_ref_id: uuid.UUID = Field(foreign_key="surveys.id", ondelete="CASCADE")
    question_ref_id: uuid.UUID = Field(foreign_key="questions.id", ondelete="CASCADE")
    order_index: int


class SurveyQuestion(BaseTable, SurveyQuestionBase, table=True):
    __tablename__ = "survey_questions"

    __table_args__ = (
        UniqueConstraint('survey_ref_id', 'question_ref_id', name='uq_survey_questions_survey_ref_id_question_ref_id'),
        UniqueConstraint('survey_ref_id', 'order_index', name='uq_survey_questions_survey_ref_id_order_index'),
    )


class SurveyResponseBase(SQLModel):
    survey_ref_id: uuid.UUID = Field(foreign_key="surveys.id", ondelete="CASCADE")
    alumni_ref_id: Optional[uuid.UUID] = Field(default=None, foreign_key="alumni.id", ondelete="CASCADE")


class SurveyResponse(BaseTable, SurveyResponseBase, table=True):
    __tablename__ = "survey_responses"

    response_id: str = Field(max_length=20, unique=True, index=True)
    submitted_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_complete: bool = Field(default=False)
    answers: list = Field(default=[], sa_type=JSON)
