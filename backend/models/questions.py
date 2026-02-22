import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field, JSON
from pydantic import field_serializer, field_validator
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


class QuestionListResponse(SQLModel):
    """Response for question list endpoint"""
    questions: List[QuestionPublic]
    total: int
    count: int
    offset: int
    limit: int
    has_more: bool
