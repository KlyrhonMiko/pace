import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field, JSON
from pydantic import field_serializer, field_validator
from utils.timezone import GMT8
from schemas.questions import QuestionPublic


class SurveyStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"


class SurveyInvitationStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    OPENED = "OPENED"
    RESPONDED = "RESPONDED"
    EXPIRED = "EXPIRED"


class DistributionTargetGroup(str, Enum):
    ALL_ALUMNI = "ALL_ALUMNI"
    SPECIFIC_COURSE = "SPECIFIC_COURSE"
    GRADUATION_YEAR_RANGE = "GRADUATION_YEAR_RANGE"
    CUSTOM_LIST = "CUSTOM_LIST"


class DistributionStatus(str, Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    SENT = "SENT"
    COMPLETED = "COMPLETED"


# ── Survey schemas ──────────────────────────────────────────────────────────

class SurveyCreate(SQLModel):
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_anonymous: bool = Field(default=False)
    allow_multiple_responses: bool = Field(default=False)
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None

    @field_validator('closes_at')
    @classmethod
    def validate_closes_at(cls, v, info):
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
        opens_at = info.data.get('opens_at')
        if opens_at and v and v <= opens_at:
            raise ValueError('closes_at must be after opens_at')
        return v


class SurveyPublic(SQLModel):
    survey_id: str
    title: str
    description: Optional[str] = None
    is_anonymous: bool
    allow_multiple_responses: bool
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
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


class SurveyQuestionWithDetails(SQLModel):
    order_index: int
    question: QuestionPublic

    class Config:
        from_attributes = True


class SurveyQuestionCreate(SQLModel):
    question_id: str  # Human-readable e.g. QSTN-000001
    order_index: Optional[int] = None


class SurveyQuestionReorderRequest(SQLModel):
    order_map: dict


# ── Survey Response schemas ─────────────────────────────────────────────────

class SurveyResponseCreate(SQLModel):
    survey_code: uuid.UUID
    alumni_code: Optional[uuid.UUID] = None


class SurveyResponsePublic(SQLModel):
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


class SurveyAnswerCreate(SQLModel):
    response_code: uuid.UUID
    question_code: uuid.UUID
    answer_text: Optional[str] = Field(default=None, max_length=5000)
    answer_choice: Optional[str] = Field(default=None, max_length=255)
    answer_choices: Optional[str] = None
    answer_scale: Optional[int] = None
    answer_number: Optional[float] = None
    answer_date: Optional[datetime] = None
    answer_bool: Optional[bool] = None

    @field_validator('answer_text', 'answer_choice')
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


class SurveyAnswerPublic(SQLModel):
    answer_code: uuid.UUID
    response_code: uuid.UUID
    question_code: uuid.UUID
    answer_text: Optional[str] = None
    answer_choice: Optional[str] = None
    answer_choices: Optional[str] = None
    answer_scale: Optional[int] = None
    answer_number: Optional[float] = None
    answer_date: Optional[datetime] = None
    answer_bool: Optional[bool] = None
    question_id: Optional[str] = None
    question_text: Optional[str] = None


# ── Survey Invitation schemas ───────────────────────────────────────────────

class SurveyInvitationCreate(SQLModel):
    survey_code: uuid.UUID
    alumni_code: uuid.UUID
    recipient_email: str = Field(max_length=255)
    status: SurveyInvitationStatus = Field(default=SurveyInvitationStatus.PENDING)


class SurveyInvitationPublic(SQLModel):
    invitation_id: str
    recipient_email: str
    status: SurveyInvitationStatus
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


class SurveyInvitationListResponse(SQLModel):
    invitations: List[SurveyInvitationPublic]
    total: int
    count: int
    offset: int
    limit: int
    has_more: bool


# ── Distribution schemas ────────────────────────────────────────────────────

class SurveyDistributionConfigCreateRequest(SQLModel):
    target_group: DistributionTargetGroup
    filters: Optional[str] = None
    scheduled_send_at: Optional[datetime] = None

    @field_validator('filters', mode='before')
    @classmethod
    def validate_filters(cls, v, info):
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


class SurveyDistributionConfigPublic(SQLModel):
    distribution_id: str
    target_group: DistributionTargetGroup
    filters: Optional[str]
    status: DistributionStatus
    total_recipients: int
    scheduled_send_at: Optional[datetime]
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


class DistributionStatsResponse(SQLModel):
    distribution_id: str
    survey_id: str
    total_recipients: int
    sent_count: int
    opened_count: int
    responded_count: int
    response_rate: float
    pending_count: int


class SurveyListResponse(SQLModel):
    surveys: List[SurveyPublic]
    total: int
    count: int
    offset: int
    limit: int
    has_more: bool
