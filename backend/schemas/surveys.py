import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field
from pydantic import field_serializer, field_validator

from utils.timezone import GMT8
from models.questions import QuestionPublic
from models.surveys import (
    SurveyBase, SurveyStatus, SurveyResponseBase,
    SurveyAnswerBase, SurveyInvitationBase, SurveyDistributionConfigBase,
    SurveyInvitationStatus, DistributionTargetGroup, DistributionStatus
)

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


class SurveyQuestionWithDetails(SQLModel):
    """Survey question with full question details"""
    order_index: int
    question: QuestionPublic
    
    class Config:
        from_attributes = True


class SurveyWithQuestions(SurveyPublic):
    """Survey with composed questions"""
    questions: List[SurveyQuestionWithDetails] = Field(default_factory=list)


class SurveyQuestionCreate(SQLModel):
    """Request schema for adding question to survey - uses human-readable ID"""
    question_id: str  # Like QSTN-000001, not UUID
    order_index: Optional[int] = None  # Auto-assigns if not provided


class SurveyResponseCreate(SurveyResponseBase):
    """Request schema for submitting response"""
    pass


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


class SurveyAnswerPublic(SurveyAnswerBase):
    answer_code: uuid.UUID
    question_id: Optional[str] = None  # Denormalized for convenience
    question_text: Optional[str] = None


class SurveyResponseWithAnswers(SurveyResponsePublic):
    """Response with all answers"""
    answers: List[SurveyAnswerPublic] = Field(default_factory=list)


class SurveyAnswerCreate(SurveyAnswerBase):
    """Request schema for submitting answer"""
    
    @field_validator('answer_text', 'answer_choice')
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


class SurveyInvitationCreate(SurveyInvitationBase):
    """Request schema for creating invitation"""
    pass


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


class SurveyDistributionConfigCreate(SurveyDistributionConfigBase):
    """Database model creation - for internal use only"""
    pass


class SurveyDistributionConfigCreateRequest(SQLModel):
    """Request schema for creating distribution config - survey_id from URL path"""
    target_group: DistributionTargetGroup
    filters: Optional[str] = None
    scheduled_send_at: Optional[datetime] = None
    
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


class SurveyQuestionReorderRequest(SQLModel):
    """Request for reordering survey questions"""
    order_map: dict


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
