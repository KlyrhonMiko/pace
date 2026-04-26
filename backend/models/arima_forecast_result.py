import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from pydantic import field_serializer
from models.base import BaseTable
from utils.timezone import format_datetime_gmt8


# ──────────────────────────────────────────────────────────────
# Database table — stores ARIMA forecast results
# ──────────────────────────────────────────────────────────────


class ArimaForecastResult(BaseTable, SQLModel, table=True):
    """Persists ARIMA(1,1,1) employment trend forecast results."""

    __tablename__ = "arima_forecast_results"

    requested_by_ref_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="users.id",
        description="User who requested the forecast",
    )

    # Full forecast output stored as JSON
    forecast_data: Any = Field(sa_column=Column(JSON, nullable=False))

    # Denormalized key fields for querying
    data_source: str = Field(
        max_length=10, description="'synthetic' or 'real'"
    )
    observations_count: int = Field(
        description="Number of data points used to fit the model"
    )
    forecast_steps: int = Field(
        description="Number of years forecasted ahead"
    )


# ──────────────────────────────────────────────────────────────
# Response schema — for GET endpoints
# ──────────────────────────────────────────────────────────────


class ArimaForecastResultRead(SQLModel):
    """Public read schema returned by GET /predict/forecast/{id}."""

    id: uuid.UUID
    requested_by_ref_id: Optional[uuid.UUID]
    forecast_data: Any
    data_source: str
    observations_count: int
    forecast_steps: int
    created_at: datetime

    @field_serializer("created_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)
