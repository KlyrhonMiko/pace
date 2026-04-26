import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from pydantic import field_serializer, field_validator
from models.base import BaseTable
from utils.timezone import format_datetime_gmt8, get_current_year_gmt8


# ──────────────────────────────────────────────────────────────
# Request schema — validates the POST body
# ──────────────────────────────────────────────────────────────

VALID_DEGREES = [
    "BSIT",
    "BSCS",
    "BSA",
    "BSBA-Entrepreneurship",
    "BSBA-Marketing",
    "BSEd-Filipino",
    "BSEd-English",
]


class EmployabilityInput(SQLModel):
    """
    Input schema for the /predict/employability endpoint.

    Field names use snake_case for the API; the to_predictor_dict()
    method maps them to the exact keys the EmployabilityPredictor expects.
    """

    # ── Required fields (all students) ──────────────────────────
    cgpa: float = Field(
        ..., ge=1.0, le=5.0, description="CGPA (1.0 best → 5.0 worst, inverted scale)"
    )
    average_prof_grade: float = Field(
        ..., ge=0, le=100, description="Average professional subject grade"
    )
    average_elec_grade: float = Field(
        ..., ge=0, le=100, description="Average elective grade"
    )
    ojt_grade: float = Field(..., ge=0, le=100, description="OJT / internship grade")
    leadership_pos: str = Field(
        ..., description="Leadership position held: 'Yes' or 'No'"
    )
    act_member_pos: str = Field(
        ..., description="Active member of org/club: 'Yes' or 'No'"
    )
    soft_skills_ave: float = Field(
        ..., ge=0, le=100, description="Average soft skills score"
    )
    hard_skills_ave: float = Field(
        ..., ge=0, le=100, description="Average hard skills score"
    )
    degree: str = Field(..., description="Degree program, e.g. 'BSIT'")
    year_graduated: int = Field(..., description="Graduation year, e.g. 2024")

    # ── BSIT / BSCS skills (optional, default 0) ───────────────
    python_programming_skills: float = Field(default=0.0, ge=0, le=100)
    java_programming_skills: float = Field(default=0.0, ge=0, le=100)
    database_management_skills: float = Field(default=0.0, ge=0, le=100)
    web_development_skills: float = Field(default=0.0, ge=0, le=100)
    networking_skills: float = Field(default=0.0, ge=0, le=100)
    cloud_computing_skills: float = Field(default=0.0, ge=0, le=100)
    software_engineering_skills: float = Field(default=0.0, ge=0, le=100)
    data_structures_algorithms: float = Field(default=0.0, ge=0, le=100)
    machine_learning_skills: float = Field(default=0.0, ge=0, le=100)
    system_design_skills: float = Field(default=0.0, ge=0, le=100)
    cybersecurity_skills: float = Field(default=0.0, ge=0, le=100)
    artificial_intelligence_skills: float = Field(default=0.0, ge=0, le=100)
    programming_logic_skills: float = Field(default=0.0, ge=0, le=100)

    # ── BSA / BSBA skills (optional, default 0) ────────────────
    financial_accounting_skills: float = Field(default=0.0, ge=0, le=100)
    budgeting_analysis_skills: float = Field(default=0.0, ge=0, le=100)
    marketing_skills: float = Field(default=0.0, ge=0, le=100)
    auditing_skills: float = Field(default=0.0, ge=0, le=100)
    financial_management_skills: float = Field(default=0.0, ge=0, le=100)
    taxation_skills: float = Field(default=0.0, ge=0, le=100)
    strategic_planning_skills: float = Field(default=0.0, ge=0, le=100)
    risk_management_skills: float = Field(default=0.0, ge=0, le=100)
    innovation_business_planning_skills: float = Field(default=0.0, ge=0, le=100)
    consumer_behavior_analysis: float = Field(default=0.0, ge=0, le=100)
    sales_management_skills: float = Field(default=0.0, ge=0, le=100)
    leadership_decision_making_skills: float = Field(default=0.0, ge=0, le=100)

    # ── BSEd skills (optional, default 0) ──────────────────────
    teaching_skills: float = Field(default=0.0, ge=0, le=100)
    classroom_management_skills: float = Field(default=0.0, ge=0, le=100)
    curriculum_development_skills: float = Field(default=0.0, ge=0, le=100)
    educational_technology_skills: float = Field(default=0.0, ge=0, le=100)
    english_communication_writing_skills: float = Field(default=0.0, ge=0, le=100)
    filipino_communication_writing_skills: float = Field(default=0.0, ge=0, le=100)

    # ── Validators ─────────────────────────────────────────────

    @field_validator("leadership_pos", "act_member_pos", mode="before")
    @classmethod
    def validate_yes_no(cls, v: str) -> str:
        if v not in ("Yes", "No"):
            raise ValueError("Must be 'Yes' or 'No'")
        return v

    @field_validator("degree", mode="before")
    @classmethod
    def validate_degree(cls, v: str) -> str:
        if v not in VALID_DEGREES:
            raise ValueError(
                f"Invalid degree. Must be one of: {', '.join(VALID_DEGREES)}"
            )
        return v

    @field_validator("year_graduated")
    @classmethod
    def validate_year(cls, v: int) -> int:
        current_year = get_current_year_gmt8()
        if v > current_year:
            raise ValueError(
                f"Year graduated cannot be in the future (max: {current_year})"
            )
        if v < 1950:
            raise ValueError("Year graduated must be 1950 or later")
        return v

    # ── Mapper ─────────────────────────────────────────────────

    def to_predictor_dict(self) -> dict:
        """
        Convert snake_case API fields to the exact key names
        that EmployabilityPredictor.predict() expects.
        """
        return {
            # Required fields
            "CGPA": self.cgpa,
            "Average Prof Grade": self.average_prof_grade,
            "Average Elec Grade": self.average_elec_grade,
            "OJT Grade": self.ojt_grade,
            "Leadership POS": self.leadership_pos,
            "Act Member POS": self.act_member_pos,
            "Soft Skills Ave": self.soft_skills_ave,
            "Hard Skills Ave": self.hard_skills_ave,
            "Degree": self.degree,
            "Year Graduated": self.year_graduated,
            # BSIT / BSCS
            "Python Programming Skills": self.python_programming_skills,
            "Java Programming Skills": self.java_programming_skills,
            "Database Management Skills": self.database_management_skills,
            "Web Development Skills": self.web_development_skills,
            "Networking Skills": self.networking_skills,
            "Cloud Computing Skills": self.cloud_computing_skills,
            "Software Engineering Skills": self.software_engineering_skills,
            "Data Structures & Algorithms": self.data_structures_algorithms,
            "Machine Learning Skills": self.machine_learning_skills,
            "System Design Skills": self.system_design_skills,
            "Cybersecurity Skills": self.cybersecurity_skills,
            "Artificial Intelligence Skills": self.artificial_intelligence_skills,
            "Programming Logic Skills": self.programming_logic_skills,
            # BSA / BSBA
            "Financial Accounting Skills": self.financial_accounting_skills,
            "Budgeting & Analysis Skills": self.budgeting_analysis_skills,
            "Marketing Skills": self.marketing_skills,
            "Auditing Skills": self.auditing_skills,
            "Financial Management Skills": self.financial_management_skills,
            "Taxation Skills": self.taxation_skills,
            "Strategic Planning Skills": self.strategic_planning_skills,
            "Risk Management Skills": self.risk_management_skills,
            "Innovation & Business Planning Skills": self.innovation_business_planning_skills,
            "Consumer Behavior Analysis": self.consumer_behavior_analysis,
            "Sales Management Skills": self.sales_management_skills,
            "Leadership & Decision-Making Skills": self.leadership_decision_making_skills,
            # BSEd
            "Teaching Skills": self.teaching_skills,
            "Classroom Management Skills": self.classroom_management_skills,
            "Curriculum Development Skills": self.curriculum_development_skills,
            "Educational Technology Skills": self.educational_technology_skills,
            "English Communication & Writing Skills": self.english_communication_writing_skills,
            "Filipino Communication & Writing Skills": self.filipino_communication_writing_skills,
        }


# ──────────────────────────────────────────────────────────────
# Database table — stores predictions
# ──────────────────────────────────────────────────────────────


class EmployabilityPrediction(BaseTable, SQLModel, table=True):
    """Persists prediction input + results for audit and history."""

    __tablename__ = "employability_predictions"

    alumni_ref_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="alumni.id",
        description="Optional link to an alumni record",
    )

    # Full input and output stored as JSON for flexibility
    input_data: Any = Field(sa_column=Column(JSON, nullable=False))
    prediction_result: Any = Field(sa_column=Column(JSON, nullable=False))

    # Denormalized key results for easy querying / filtering
    realistic_prediction: str = Field(
        max_length=20, description="'Employable' or 'Not Employable'"
    )
    realistic_probability: float = Field(
        description="0–100, employability likelihood (Model 1)"
    )
    improvement_prediction: str = Field(
        max_length=20, description="'Employable' or 'Not Employable'"
    )
    improvement_probability: float = Field(
        description="0–100, employability likelihood (Model 2)"
    )


# ──────────────────────────────────────────────────────────────
# Response schema — for GET endpoints
# ──────────────────────────────────────────────────────────────


class EmployabilityPredictionRead(SQLModel):
    """Public read schema returned by GET /predict/employability/{id}."""

    id: uuid.UUID
    alumni_ref_id: Optional[uuid.UUID]
    input_data: Any
    prediction_result: Any
    realistic_prediction: str
    realistic_probability: float
    improvement_prediction: str
    improvement_probability: float
    created_at: datetime

    @field_serializer("created_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)
