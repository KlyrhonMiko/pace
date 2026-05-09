import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field
from pydantic import field_serializer, field_validator
from schemas.base import AuditPublicSQLModel
from utils.timezone import format_datetime_gmt8
from schemas.questions import QuestionPublic


class SurveyStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"


# ── Survey schemas ──────────────────────────────────────────────────────────


class SurveyCreate(SQLModel):
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_anonymous: bool = Field(default=False)
    allow_multiple_responses: bool = Field(default=False)
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    target_department_abbv: Optional[str] = None
    target_course_abbv: Optional[str] = None

    @field_validator("closes_at")
    @classmethod
    def validate_closes_at(cls, v, info):
        opens_at = info.data.get("opens_at")
        if opens_at and v and v <= opens_at:
            raise ValueError("closes_at must be after opens_at")
        return v


class SurveyUpdate(SQLModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_anonymous: Optional[bool] = None
    allow_multiple_responses: Optional[bool] = None
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    target_department_abbv: Optional[str] = None
    target_course_abbv: Optional[str] = None

    @field_validator("closes_at")
    @classmethod
    def validate_closes_at(cls, v, info):
        opens_at = info.data.get("opens_at")
        if opens_at and v and v <= opens_at:
            raise ValueError("closes_at must be after opens_at")
        return v


class SurveyPublic(AuditPublicSQLModel):
    survey_id: str
    title: str
    description: Optional[str] = None
    is_anonymous: bool
    allow_multiple_responses: bool
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    target_department_abbv: Optional[str] = None
    target_course_abbv: Optional[str] = None
    status: SurveyStatus
    created_at: datetime
    updated_at: datetime
    question_count: int = 0

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)


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


class SurveyReopenRequest(SQLModel):
    opens_at: datetime
    closes_at: datetime

    @field_validator("closes_at")
    @classmethod
    def validate_closes_at(cls, v, info):
        opens_at = info.data.get("opens_at")
        if opens_at and v and v <= opens_at:
            raise ValueError("closes_at must be after opens_at")
        return v


# ── Survey Response schemas ─────────────────────────────────────────────────


class SurveyResponseCreate(SQLModel):
    survey_id: str
    alumni_id: Optional[str] = None


class SurveyResponsePublic(SQLModel):
    response_id: str
    submitted_at: datetime
    is_complete: bool
    answers: Optional[list[dict]] = None

    @field_serializer("submitted_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)

class SurveyAnswerCreate(SQLModel):
    response_id: str
    question_id: str
    answer_text: Optional[str] = Field(default=None, max_length=5000)
    answer_choice: Optional[str] = Field(default=None, max_length=255)
    answer_choices: Optional[str] = None
    answer_scale: Optional[int] = None
    answer_number: Optional[float] = None
    answer_date: Optional[datetime] = None
    answer_bool: Optional[bool] = None

    @field_validator("answer_text", "answer_choice")
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


class SurveyAnswerPublic(SQLModel):
    response_id: str
    question_id: str
    answer_text: Optional[str] = None
    answer_choice: Optional[str] = None
    answer_choices: Optional[str] = None
    answer_scale: Optional[int] = None
    answer_number: Optional[float] = None
    answer_date: Optional[datetime] = None
    answer_bool: Optional[bool] = None
    question_text: Optional[str] = None




class SurveyListResponse(SQLModel):
    surveys: List[SurveyPublic]
    total: int
    count: int
    offset: int
    limit: int
    has_more: bool


# ── Survey Submission schemas (Phase 1.5 — ready, auth-blocked) ─────────────


class AnswerItem(SQLModel):
    """One answer record inside a survey submission, keyed by human-readable question_id."""

    question_id: str  # e.g. QSTN-000001
    answer_text: Optional[str] = Field(default=None, max_length=5000)
    answer_choice: Optional[str] = Field(default=None, max_length=255)
    answer_choices: Optional[str] = None  # JSON string for MULTI_SELECT
    answer_scale: Optional[int] = None
    answer_number: Optional[float] = None
    answer_date: Optional[datetime] = None
    answer_bool: Optional[bool] = None


class SurveySubmission(SQLModel):
    """Body for POST /surveys/{survey_id}/respond (Phase 1.5, blocked on auth)."""

    alumni_id: Optional[str] = (
        None  # human-readable e.g. ALM-000001; optional for anonymous
    )
    answers: List[AnswerItem]


# ── Results & Analytics schemas (Phase 1.6) ─────────────────────────────────


class QuestionSummary(SQLModel):
    """Aggregated statistics for a single question."""

    question_id: str
    question_text: str
    question_type: str  # QuestionType value as string to avoid circular imports
    total_answers: int

    # MULTIPLE_CHOICE / MULTI_SELECT
    choice_distribution: Optional[dict] = (
        None  # e.g. {"Employed": 45, "Unemployed": 12}
    )

    # SCALE / NUMBER
    average: Optional[float] = None
    distribution: Optional[dict] = None  # for SCALE e.g. {"1": 3, "2": 5, ...}
    min_value: Optional[float] = None  # for NUMBER
    max_value: Optional[float] = None  # for NUMBER
    median_value: Optional[float] = None  # for NUMBER

    # YES_NO
    yes_count: Optional[int] = None
    no_count: Optional[int] = None

    # TEXT / DATE
    sample_answers: Optional[List[str]] = None  # first 10 unique values


class SurveyResultsSummary(SQLModel):
    """Top-level aggregated results for GET /surveys/{id}/results."""

    survey_id: str
    title: str
    total_responses: int
    completion_rate: float  # 0.0–1.0
    question_summaries: List[QuestionSummary]


# ── Export schemas (Phase 1.6) ───────────────────────────────────────────────


class SurveyExportResponse(SQLModel):
    """Raw data dump for GET /surveys/{id}/export."""

    survey_id: str
    title: str
    total_responses: int
    responses: List[
        dict
    ]  # each: {response_id, submitted_at, is_complete, alumni_id?, answers: [...]}
