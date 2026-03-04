from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field
from pydantic import field_serializer, field_validator, BaseModel
from utils.timezone import GMT8


class StudentRecordCreate(SQLModel):
    student_id: str = Field(max_length=10)
    year_graduated: int
    gwa: float
    avg_prof_grade: Optional[float] = None
    avg_elec_grade: Optional[float] = None
    ojt_grade: Optional[float] = None
    leadership_pos: Optional[bool] = None
    act_member_pos: Optional[bool] = None
    course_abbv: str  # matched to Course by abbreviation
    alumni_id: str  # matched to Alumni by human-readable ID

    @field_validator("year_graduated")
    @classmethod
    def validate_year_graduated(cls, v):
        current_year = datetime.now().year
        if v > current_year:
            raise ValueError(
                f"Year graduated cannot be in the future (max: {current_year})"
            )
        if v < 1950:
            raise ValueError("Year graduated must be 1950 or later")
        return v

    @field_validator("course_abbv", "alumni_id", mode="before")
    @classmethod
    def uppercase_ids(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v


class StudentRecordUpdate(SQLModel):
    year_graduated: Optional[int] = None
    gwa: Optional[float] = None
    avg_prof_grade: Optional[float] = None
    avg_elec_grade: Optional[float] = None
    ojt_grade: Optional[float] = None
    leadership_pos: Optional[bool] = None
    act_member_pos: Optional[bool] = None
    alumni_id: Optional[str] = None

    @field_validator("year_graduated")
    @classmethod
    def validate_year_graduated(cls, v):
        if v is not None:
            current_year = datetime.now().year
            if v > current_year:
                raise ValueError(
                    f"Year graduated cannot be in the future (max: {current_year})"
                )
            if v < 1950:
                raise ValueError("Year graduated must be 1950 or later")
        return v

    @field_validator("alumni_id", mode="before")
    @classmethod
    def uppercase_alumni_id(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v


class StudentRecordPublic(SQLModel):
    student_id: str
    year_graduated: int
    gwa: float
    avg_prof_grade: Optional[float] = None
    avg_elec_grade: Optional[float] = None
    ojt_grade: Optional[float] = None
    leadership_pos: Optional[bool] = None
    act_member_pos: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        gmt8_time = value.astimezone(GMT8)
        return gmt8_time.strftime("%Y-%m-%d %H:%M:%S")


# ── Safe display models ─────────────────────────────────────────────────────


class StudentRecordCreateSafeDisplay(BaseModel):
    student_id: str
    course_abbv: str
    alumni_id: str


class StudentRecordUpdateSafeDisplay(BaseModel):
    student_id: str
    year_graduated: Optional[int] = None
    gwa: Optional[float] = None


# ── Batch create ────────────────────────────────────────────────────────────


class StudentRecordBatchCreateItem(BaseModel):
    index: int
    item: StudentRecordCreateSafeDisplay
    success: bool
    code: str
    message: str
    data: Optional[StudentRecordPublic] = None


class StudentRecordBatchCreate(BaseModel):
    items: List[StudentRecordCreate] = Field(..., min_length=1, max_length=100)


class StudentRecordBatchCreateResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[StudentRecordBatchCreateItem]


# ── Batch update ────────────────────────────────────────────────────────────


class StudentRecordBatchUpdateItem(BaseModel):
    student_id: str
    year_graduated: Optional[int] = None
    gwa: Optional[float] = None
    avg_prof_grade: Optional[float] = None
    avg_elec_grade: Optional[float] = None
    ojt_grade: Optional[float] = None
    leadership_pos: Optional[bool] = None
    act_member_pos: Optional[bool] = None
    alumni_id: Optional[str] = None

    @field_validator("year_graduated")
    @classmethod
    def validate_year_graduated(cls, v):
        if v is not None:
            current_year = datetime.now().year
            if v > current_year:
                raise ValueError(
                    f"Year graduated cannot be in the future (max: {current_year})"
                )
            if v < 1950:
                raise ValueError("Year graduated must be 1950 or later")
        return v

    @field_validator("alumni_id", mode="before")
    @classmethod
    def uppercase_alumni_id(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v


class StudentRecordBatchUpdateResult(BaseModel):
    index: int
    item: StudentRecordUpdateSafeDisplay
    success: bool
    code: str
    message: str
    data: Optional[StudentRecordPublic] = None


class StudentRecordBatchUpdate(BaseModel):
    items: List[StudentRecordBatchUpdateItem] = Field(..., min_length=1, max_length=100)


class StudentRecordBatchUpdateResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[StudentRecordBatchUpdateResult]


# ── Batch delete ────────────────────────────────────────────────────────────


class StudentRecordBatchDeleteResult(BaseModel):
    index: int
    student_id: str
    success: bool
    code: str
    message: str


class StudentRecordBatchDelete(BaseModel):
    ids: List[str] = Field(..., min_length=1, max_length=100)


class StudentRecordBatchDeleteResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[StudentRecordBatchDeleteResult]


# ── Batch restore ───────────────────────────────────────────────────────────


class StudentRecordBatchRestoreResult(BaseModel):
    index: int
    student_id: str
    success: bool
    code: str
    message: str


class StudentRecordBatchRestore(BaseModel):
    ids: List[str] = Field(..., min_length=1, max_length=100)


class StudentRecordBatchRestoreResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: List[StudentRecordBatchRestoreResult]
