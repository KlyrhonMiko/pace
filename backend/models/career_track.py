import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from pydantic import field_serializer
from models.base import BaseTable
from utils.timezone import format_datetime_gmt8


class CareerTrackPrediction(BaseTable, SQLModel, table=True):
    """Persists career track prediction inputs + results."""

    __tablename__ = "career_track_predictions"

    alumni_ref_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="alumni.id",
        description="Link to an alumni record",
    )

    # Full input and output stored as JSON
    input_data: Any = Field(sa_column=Column(JSON, nullable=False))
    prediction_result: Any = Field(sa_column=Column(JSON, nullable=False))

    # Denormalized key results
    predicted_track: str = Field(max_length=50)
    probability: float = Field(description="Percentage confidence (0–100)")


class CareerTrackPredictionRead(SQLModel):
    """Public read schema for career track history."""

    id: uuid.UUID
    alumni_ref_id: Optional[uuid.UUID]
    input_data: Any
    prediction_result: Any
    predicted_track: str
    probability: float
    created_at: datetime

    @field_serializer("created_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)
