from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field
from pydantic import field_serializer, field_validator, BaseModel
from utils.timezone import format_datetime_gmt8


# ── Accepted program-specific skill keys ─────────────────────────────────────
# These must exactly match the key names the EmployabilityPredictor expects.
VALID_PROGRAM_SKILL_KEYS = {
    # BSIT / BSCS
    "Python Programming Skills",
    "Java Programming Skills",
    "Database Management Skills",
    "Web Development Skills",
    "Networking Skills",
    "Cloud Computing Skills",
    "Software Engineering Skills",
    "Data Structures & Algorithms",
    "Machine Learning Skills",
    "System Design Skills",
    "Cybersecurity Skills",
    "Artificial Intelligence Skills",
    "Programming Logic Skills",
    # BSA / BSBA
    "Financial Accounting Skills",
    "Budgeting & Analysis Skills",
    "Marketing Skills",
    "Auditing Skills",
    "Financial Management Skills",
    "Taxation Skills",
    "Strategic Planning Skills",
    "Risk Management Skills",
    "Innovation & Business Planning Skills",
    "Consumer Behavior Analysis",
    "Sales Management Skills",
    "Leadership & Decision-Making Skills",
    # BSEd
    "Teaching Skills",
    "Classroom Management Skills",
    "Curriculum Development Skills",
    "Educational Technology Skills",
    "English Communication & Writing Skills",
    "Filipino Communication & Writing Skills",
}


def _validate_program_skills(
    v: Optional[Dict[str, float]],
) -> Optional[Dict[str, float]]:
    """Ensure all keys are recognized ML feature names and values are 0–100."""
    if v is None:
        return None
    invalid_keys = set(v.keys()) - VALID_PROGRAM_SKILL_KEYS
    if invalid_keys:
        raise ValueError(
            f"Unknown skill key(s): {invalid_keys}. "
            f"Allowed keys: {sorted(VALID_PROGRAM_SKILL_KEYS)}"
        )
    for key, val in v.items():
        if not (0.0 <= val <= 100.0):
            raise ValueError(
                f"Skill value for '{key}' must be between 0 and 100 (got {val})"
            )
    return v


# ── Create ────────────────────────────────────────────────────────────────────


class AlumniSkillsCreate(SQLModel):
    alumni_id: str  # Human-readable ID; resolved to alumni_code in query
    soft_skills_ave: Optional[float] = Field(default=None, ge=0, le=100)
    hard_skills_ave: Optional[float] = Field(default=None, ge=0, le=100)
    program_skills: Optional[Dict[str, float]] = None

    @field_validator("alumni_id", mode="before")
    @classmethod
    def uppercase_alumni_id(cls, v: str) -> str:
        return v.upper() if isinstance(v, str) else v

    @field_validator("program_skills", mode="before")
    @classmethod
    def validate_program_skills(cls, v):
        return _validate_program_skills(v)


# ── Update ────────────────────────────────────────────────────────────────────


class AlumniSkillsUpdate(SQLModel):
    soft_skills_ave: Optional[float] = Field(default=None, ge=0, le=100)
    hard_skills_ave: Optional[float] = Field(default=None, ge=0, le=100)
    program_skills: Optional[Dict[str, float]] = None

    @field_validator("program_skills", mode="before")
    @classmethod
    def validate_program_skills(cls, v):
        return _validate_program_skills(v)


# ── Public (read) ─────────────────────────────────────────────────────────────


class AlumniSkillsPublic(SQLModel):
    soft_skills_ave: Optional[float]
    hard_skills_ave: Optional[float]
    program_skills: Optional[Any]
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)


# ── Safe display (batch result) ───────────────────────────────────────────────


class AlumniSkillsSafeDisplay(BaseModel):
    alumni_id: str


# ── Batch create ──────────────────────────────────────────────────────────────


class AlumniSkillsBatchCreateItem(BaseModel):
    index: int
    item: AlumniSkillsSafeDisplay
    success: bool
    code: str
    message: str
    data: Optional[AlumniSkillsPublic] = None


class AlumniSkillsBatchCreate(BaseModel):
    items: list[AlumniSkillsCreate] = Field(..., min_length=1, max_length=100)


class AlumniSkillsBatchCreateResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: list[AlumniSkillsBatchCreateItem]


# ── Batch update ──────────────────────────────────────────────────────────────


class AlumniSkillsBatchUpdateItem(BaseModel):
    alumni_id: str
    soft_skills_ave: Optional[float] = Field(default=None, ge=0, le=100)
    hard_skills_ave: Optional[float] = Field(default=None, ge=0, le=100)
    program_skills: Optional[Dict[str, float]] = None

    @field_validator("alumni_id", mode="before")
    @classmethod
    def uppercase_alumni_id(cls, v: str) -> str:
        return v.upper() if isinstance(v, str) else v

    @field_validator("program_skills", mode="before")
    @classmethod
    def validate_program_skills(cls, v):
        return _validate_program_skills(v)


class AlumniSkillsBatchUpdateResult(BaseModel):
    index: int
    item: AlumniSkillsSafeDisplay
    success: bool
    code: str
    message: str
    data: Optional[AlumniSkillsPublic] = None


class AlumniSkillsBatchUpdate(BaseModel):
    items: list[AlumniSkillsBatchUpdateItem] = Field(..., min_length=1, max_length=100)


class AlumniSkillsBatchUpdateResponse(BaseModel):
    total_items: int
    successful: int
    failed: int
    results: list[AlumniSkillsBatchUpdateResult]
