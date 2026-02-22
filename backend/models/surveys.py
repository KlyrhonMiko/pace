import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from sqlalchemy import UniqueConstraint
from sqlmodel import SQLModel, Field, JSON
from pydantic import field_serializer, field_validator, BaseModel
from utils.timezone import get_current_time_gmt8, GMT8

class QuestionType(str, Enum):
    """Types of survey questions"""
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    MULTI_SELECT = "MULTI_SELECT"
    TEXT = "TEXT"
    SCALE = "SCALE"
    YES_NO = "YES_NO"
    DATE = "DATE"
    NUMBER = "NUMBER"


class SurveyStatus(str, Enum):
    """Status of a survey"""
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"


class SurveyInvitationStatus(str, Enum):
    """Status of a survey invitation"""
    PENDING = "PENDING"
    SENT = "SENT"
    OPENED = "OPENED"
    RESPONDED = "RESPONDED"
    EXPIRED = "EXPIRED"


class DistributionTargetGroup(str, Enum):
    """Target group for survey distribution"""
    ALL_ALUMNI = "ALL_ALUMNI"
    SPECIFIC_COURSE = "SPECIFIC_COURSE"
    GRADUATION_YEAR_RANGE = "GRADUATION_YEAR_RANGE"
    CUSTOM_LIST = "CUSTOM_LIST"


class DistributionStatus(str, Enum):
    """Status of survey distribution"""
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    SENT = "SENT"
    COMPLETED = "COMPLETED"

class QuestionBase(SQLModel):
    question_text: str = Field(max_length=1000)
    question_type: QuestionType
    options: Optional[str] = Field(default=None, sa_type=JSON)  # JSON array for MC/MULTI_SELECT
    scale_min: Optional[int] = Field(default=None)
    scale_max: Optional[int] = Field(default=None)
    scale_label_min: Optional[str] = Field(default=None, max_length=100)
    scale_label_max: Optional[str] = Field(default=None, max_length=100)
    placeholder: Optional[str] = Field(default=None, max_length=200)
    is_required: bool = Field(default=True)


class Question(QuestionBase, table=True):
    __tablename__ = "questions"
    
    question_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    question_id: str = Field(max_length=20, unique=True, index=True)  # Format: QSTN-000001
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)


class QuestionCreate(QuestionBase):
    @field_validator('options', mode='before')
    @classmethod
    def validate_options(cls, v, info):
        """Validate options for MC/MULTI_SELECT questions"""
        question_type = info.data.get('question_type')
        if question_type in [QuestionType.MULTIPLE_CHOICE, QuestionType.MULTI_SELECT]:
            if v is None:
                raise ValueError(f'{question_type} questions require options')
            if isinstance(v, str):
                try:
                    parsed = json.loads(v)
                    if not isinstance(parsed, list) or len(parsed) == 0:
                        raise ValueError('Options must be a non-empty array')
                    return json.dumps(parsed)
                except json.JSONDecodeError:
                    raise ValueError('Options must be valid JSON')
        return v
    
    @field_validator('scale_min', 'scale_max')
    @classmethod
    def validate_scale(cls, v, info):
        """Validate scale values"""
        question_type = info.data.get('question_type')
        if question_type == QuestionType.SCALE:
            if v is None:
                raise ValueError('SCALE questions require scale_min and scale_max')
            if not isinstance(v, int) or v < 1 or v > 100:
                raise ValueError('Scale values must be integers between 1 and 100')
        return v


class QuestionUpdate(SQLModel):
    question_text: Optional[str] = Field(default=None, max_length=1000)
    question_type: Optional[QuestionType] = None
    options: Optional[str] = None
    scale_min: Optional[int] = None
    scale_max: Optional[int] = None
    scale_label_min: Optional[str] = Field(default=None, max_length=100)
    scale_label_max: Optional[str] = Field(default=None, max_length=100)
    placeholder: Optional[str] = Field(default=None, max_length=200)
    is_required: Optional[bool] = None
    
    @field_validator('options', mode='before')
    @classmethod
    def validate_options(cls, v, info):
        """Validate options for MC/MULTI_SELECT questions"""
        question_type = info.data.get('question_type')
        if question_type in [QuestionType.MULTIPLE_CHOICE, QuestionType.MULTI_SELECT]:
            if v is None:
                raise ValueError(f'{question_type} questions require options')
            if isinstance(v, str):
                try:
                    parsed = json.loads(v)
                    if not isinstance(parsed, list) or len(parsed) == 0:
                        raise ValueError('Options must be a non-empty array')
                    return json.dumps(parsed)
                except json.JSONDecodeError:
                    raise ValueError('Options must be valid JSON')
        return v


class QuestionPublic(QuestionBase):
    question_code: uuid.UUID
    question_id: str
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
    survey_id: str = Field(max_length=20, unique=True, index=True)  # Format: SRVY-000001
    status: SurveyStatus = Field(default=SurveyStatus.DRAFT)
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)


class SurveyCreate(SurveyBase):
    @field_validator('closes_at')
    @classmethod
    def validate_closes_at(cls, v, info):
        """Validate closes_at is after opens_at if both provided"""
        opens_at = info.data.get('opens_at')
        if opens_at and v and v <= opens_at:
            raise ValueError('closes_at must be after opens_at')
        return v


class SurveyUpdate(SQLModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_anonymous: Optional[bool] = None
    allow_multiple_responses: Optional[bool] = None
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    
    @field_validator('closes_at')
    @classmethod
    def validate_closes_at(cls, v, info):
        """Validate closes_at is after opens_at if both provided"""
        opens_at = info.data.get('opens_at')
        if opens_at and v and v <= opens_at:
            raise ValueError('closes_at must be after opens_at')
        return v


class SurveyPublic(SurveyBase):
    survey_code: uuid.UUID
    survey_id: str
    status: SurveyStatus
    created_at: datetime
    updated_at: datetime
    question_count: int = 0
    
    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')


class SurveyWithQuestions(SurveyPublic):
    """Survey with composed questions"""
    questions: List['SurveyQuestionWithDetails'] = Field(default_factory=list)

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


class SurveyQuestionCreate(SurveyQuestionBase):
    """Request schema for adding question to survey"""
    pass


class SurveyQuestionWithDetails(SurveyQuestionBase):
    """Survey question with full question details"""
    survey_question_code: uuid.UUID
    question: QuestionPublic
    
    class Config:
        from_attributes = True

class SurveyResponseBase(SQLModel):
    survey_code: uuid.UUID = Field(foreign_key="surveys.survey_code", ondelete="CASCADE")
    alumni_code: Optional[uuid.UUID] = Field(default=None, foreign_key="alumni.alumni_code", ondelete="CASCADE")


class SurveyResponse(SurveyResponseBase, table=True):
    __tablename__ = "survey_responses"
    
    response_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    response_id: str = Field(max_length=20, unique=True, index=True)  # Format: SRSP-000001
    submitted_at: datetime = Field(default_factory=get_current_time_gmt8)
    is_complete: bool = Field(default=False)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)


class SurveyResponseCreate(SurveyResponseBase):
    """Request schema for submitting response"""
    pass


class SurveyResponsePublic(SurveyResponseBase):
    response_code: uuid.UUID
    response_id: str
    submitted_at: datetime
    is_complete: bool
    
    @field_serializer('submitted_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')


class SurveyResponseWithAnswers(SurveyResponsePublic):
    """Response with all answers"""
    answers: List['SurveyAnswerPublic'] = Field(default_factory=list)

class SurveyAnswerBase(SQLModel):
    response_code: uuid.UUID = Field(foreign_key="survey_responses.response_code", ondelete="CASCADE")
    question_code: uuid.UUID = Field(foreign_key="questions.question_code", ondelete="CASCADE")
    answer_text: Optional[str] = Field(default=None, max_length=5000)
    answer_choice: Optional[str] = Field(default=None, max_length=255)
    answer_choices: Optional[str] = Field(default=None, sa_type=JSON)  # JSON array
    answer_scale: Optional[int] = None
    answer_number: Optional[float] = None
    answer_date: Optional[datetime] = None
    answer_bool: Optional[bool] = None


class SurveyAnswer(SurveyAnswerBase, table=True):
    __tablename__ = "survey_answers"
    
    answer_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


class SurveyAnswerCreate(SurveyAnswerBase):
    """Request schema for submitting answer"""
    
    @field_validator('answer_text', 'answer_choice')
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


class SurveyAnswerPublic(SurveyAnswerBase):
    answer_code: uuid.UUID
    question_id: Optional[str] = None  # Denormalized for convenience
    question_text: Optional[str] = None

class SurveyInvitationBase(SQLModel):
    survey_code: uuid.UUID = Field(foreign_key="surveys.survey_code", ondelete="CASCADE")
    alumni_code: uuid.UUID = Field(foreign_key="alumni.alumni_code", ondelete="CASCADE")
    recipient_email: str = Field(max_length=255)
    status: SurveyInvitationStatus = Field(default=SurveyInvitationStatus.PENDING)


class SurveyInvitation(SurveyInvitationBase, table=True):
    __tablename__ = "survey_invitations"
    
    invitation_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    invitation_id: str = Field(max_length=20, unique=True, index=True)  # Format: SINV-000001
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=get_current_time_gmt8)


class SurveyInvitationCreate(SurveyInvitationBase):
    """Request schema for creating invitation"""
    pass


class SurveyInvitationPublic(SurveyInvitationBase):
    invitation_code: uuid.UUID
    invitation_id: str
    sent_at: Optional[datetime]
    opened_at: Optional[datetime]
    responded_at: Optional[datetime]
    created_at: datetime
    
    @field_serializer('sent_at', 'opened_at', 'responded_at', 'created_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')

class SurveyDistributionConfigBase(SQLModel):
    survey_code: uuid.UUID = Field(foreign_key="surveys.survey_code", ondelete="CASCADE")
    target_group: DistributionTargetGroup
    filters: Optional[str] = Field(default=None, sa_type=JSON)  # JSON object with filtering criteria
    status: DistributionStatus = Field(default=DistributionStatus.DRAFT)
    total_recipients: int = Field(default=0)
    scheduled_send_at: Optional[datetime] = None


class SurveyDistributionConfig(SurveyDistributionConfigBase, table=True):
    __tablename__ = "survey_distribution_configs"
    
    distribution_code: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    distribution_id: str = Field(max_length=20, unique=True, index=True)  # Format: SDST-000001
    sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=get_current_time_gmt8)
    updated_at: datetime = Field(default_factory=get_current_time_gmt8)
    
    __table_args__ = (
        UniqueConstraint('survey_code', name='uq_survey_distribution_configs_survey_code'),
    )


class SurveyDistributionConfigCreate(SurveyDistributionConfigBase):
    """Request schema for creating distribution config"""
    
    @field_validator('filters', mode='before')
    @classmethod
    def validate_filters(cls, v, info):
        """Validate filters based on target_group"""
        target_group = info.data.get('target_group')
        
        if v is None:
            if target_group != DistributionTargetGroup.ALL_ALUMNI:
                raise ValueError(f'{target_group} requires filters')
            return None
        
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
            except json.JSONDecodeError:
                raise ValueError('Filters must be valid JSON')
        else:
            parsed = v
        
        # Validate based on target group
        if target_group == DistributionTargetGroup.SPECIFIC_COURSE:
            if 'courses' not in parsed or not isinstance(parsed['courses'], list):
                raise ValueError('SPECIFIC_COURSE requires courses list in filters')
        elif target_group == DistributionTargetGroup.GRADUATION_YEAR_RANGE:
            if 'year_min' not in parsed or 'year_max' not in parsed:
                raise ValueError('GRADUATION_YEAR_RANGE requires year_min and year_max in filters')
        elif target_group == DistributionTargetGroup.CUSTOM_LIST:
            if 'alumni_ids' not in parsed or not isinstance(parsed['alumni_ids'], list):
                raise ValueError('CUSTOM_LIST requires alumni_ids list in filters')
        
        return json.dumps(parsed) if isinstance(v, dict) else v


class SurveyDistributionConfigUpdate(SQLModel):
    target_group: Optional[DistributionTargetGroup] = None
    filters: Optional[str] = None
    scheduled_send_at: Optional[datetime] = None


class SurveyDistributionConfigPublic(SurveyDistributionConfigBase):
    distribution_code: uuid.UUID
    distribution_id: str
    sent_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('scheduled_send_at', 'sent_at', 'created_at', 'updated_at')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime('%Y-%m-%d %H:%M:%S')

class SurveyQuestionReorderRequest(SQLModel):
    """Request for reordering survey questions"""
    order_map: dict


class QuestionListResponse(SQLModel):
    """Response for question list endpoint"""
    questions: List[QuestionPublic]
    total: int
    count: int
    offset: int
    limit: int
    has_more: bool


class SurveyListResponse(SQLModel):
    """Response for survey list endpoint"""
    surveys: List[SurveyPublic]
    total: int
    count: int
    offset: int
    limit: int
    has_more: bool


class SurveyInvitationListResponse(SQLModel):
    """Response for invitation list endpoint"""
    invitations: List[SurveyInvitationPublic]
    total: int
    count: int
    offset: int
    limit: int
    has_more: bool


class DistributionStatsResponse(SQLModel):
    """Response with distribution statistics"""
    distribution_id: str
    survey_id: str
    total_recipients: int
    sent_count: int
    opened_count: int
    responded_count: int
    response_rate: float  # percentage
    pending_count: int
