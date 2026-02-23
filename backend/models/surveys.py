import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import UniqueConstraint
from sqlmodel import SQLModel, Field, JSON
from utils.timezone import get_current_time_gmt8
from schemas.surveys import SurveyStatus, SurveyInvitationStatus, DistributionTargetGroup, DistributionStatus


class SurveyBase(SQLModel):
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_anonymous: bool = Field(default=False)
    allow_multiple_responses: bool = Field(default=False)
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None


class Survey(SurveyBase, table=True):
    __tablename__ = "surveys"

    survey_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    survey_id: str = Field(max_length=20, unique=True, index=True)
    status: SurveyStatus = Field(default=SurveyStatus.DRAFT)
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)


class SurveyQuestionBase(SQLModel):
    survey_code: uuid.UUID = Field(foreign_key="surveys.survey_code", ondelete="CASCADE")
    question_code: uuid.UUID = Field(foreign_key="questions.question_code", ondelete="CASCADE")
    order_index: int


class SurveyQuestion(SurveyQuestionBase, table=True):
    __tablename__ = "survey_questions"

    survey_question_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    __table_args__ = (
        UniqueConstraint('survey_code', 'question_code', name='uq_survey_questions_survey_code_question_code'),
        UniqueConstraint('survey_code', 'order_index', name='uq_survey_questions_survey_code_order_index'),
    )


class SurveyResponseBase(SQLModel):
    survey_code: uuid.UUID = Field(foreign_key="surveys.survey_code", ondelete="CASCADE")
    alumni_code: Optional[uuid.UUID] = Field(default=None, foreign_key="alumni.alumni_code", ondelete="CASCADE")


class SurveyResponse(SurveyResponseBase, table=True):
    __tablename__ = "survey_responses"

    response_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    response_id: str = Field(max_length=20, unique=True, index=True)
    submitted_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_complete: bool = Field(default=False)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)


class SurveyAnswerBase(SQLModel):
    response_code: uuid.UUID = Field(foreign_key="survey_responses.response_code", ondelete="CASCADE")
    question_code: uuid.UUID = Field(foreign_key="questions.question_code", ondelete="CASCADE")
    answer_text: Optional[str] = Field(default=None, max_length=5000)
    answer_choice: Optional[str] = Field(default=None, max_length=255)
    answer_choices: Optional[str] = Field(default=None, sa_type=JSON)
    answer_scale: Optional[int] = None
    answer_number: Optional[float] = None
    answer_date: Optional[datetime] = None
    answer_bool: Optional[bool] = None


class SurveyAnswer(SurveyAnswerBase, table=True):
    __tablename__ = "survey_answers"

    answer_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class SurveyInvitationBase(SQLModel):
    survey_code: uuid.UUID = Field(foreign_key="surveys.survey_code", ondelete="CASCADE")
    alumni_code: uuid.UUID = Field(foreign_key="alumni.alumni_code", ondelete="CASCADE")
    recipient_email: str = Field(max_length=255)
    status: SurveyInvitationStatus = Field(default=SurveyInvitationStatus.PENDING)


class SurveyInvitation(SurveyInvitationBase, table=True):
    __tablename__ = "survey_invitations"

    invitation_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    invitation_id: str = Field(max_length=20, unique=True, index=True)
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=get_current_time_gmt8)


class SurveyDistributionConfigBase(SQLModel):
    survey_code: uuid.UUID = Field(foreign_key="surveys.survey_code", ondelete="CASCADE")
    target_group: DistributionTargetGroup
    filters: Optional[str] = Field(default=None, sa_type=JSON)
    status: DistributionStatus = Field(default=DistributionStatus.DRAFT)
    total_recipients: int = Field(default=0)
    scheduled_send_at: Optional[datetime] = None


class SurveyDistributionConfig(SurveyDistributionConfigBase, table=True):
    __tablename__ = "survey_distribution_configs"

    distribution_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    distribution_id: str = Field(max_length=20, unique=True, index=True)
    sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)

    __table_args__ = (
        UniqueConstraint('survey_code', name='uq_survey_distribution_configs_survey_code'),
    )
