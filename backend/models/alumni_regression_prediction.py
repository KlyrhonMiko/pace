import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from pydantic import field_serializer
from models.base import BaseTable
from utils.timezone import format_datetime_gmt8


# ──────────────────────────────────────────────────────────────
# Database table — stores Linear Regression predictions
# ──────────────────────────────────────────────────────────────


class AlumniRegressionPrediction(BaseTable, SQLModel, table=True):
    """Persists Linear Regression (salary + job search duration) prediction results."""

    __tablename__ = "alumni_regression_predictions"

    alumni_ref_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="alumni.id",
        description="Link to the alumni record",
    )

    # Full input and output stored as JSON for flexibility
    input_data: Any = Field(sa_column=Column(JSON, nullable=False))
    prediction_result: Any = Field(sa_column=Column(JSON, nullable=False))

    # Denormalized key results for easy querying / filtering
    predicted_salary: float = Field(
        description="Predicted starting salary in PHP/month"
    )
    predicted_duration_weeks: float = Field(
        description="Predicted job search duration in weeks"
    )
    salary_band: str = Field(
        max_length=10, description="'Low', 'Mid', or 'High'"
    )
    search_outlook: str = Field(
        max_length=10, description="'Short', 'Moderate', or 'Long'"
    )


# ──────────────────────────────────────────────────────────────
# Response schema — for GET endpoints
# ──────────────────────────────────────────────────────────────


class AlumniRegressionPredictionRead(SQLModel):
    """Public read schema returned by GET /predict/regression/{id}."""

    id: uuid.UUID
    alumni_ref_id: Optional[uuid.UUID]
    input_data: Any
    prediction_result: Any
    predicted_salary: float
    predicted_duration_weeks: float
    salary_band: str
    search_outlook: str
    created_at: datetime

    @field_serializer("created_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)
