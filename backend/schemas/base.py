import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_serializer
from sqlmodel import SQLModel

from utils.timezone import format_datetime_gmt8


class AuditPublicSQLModel(SQLModel):
    id: Optional[uuid.UUID] = None
    created_by: Optional[uuid.UUID] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("deleted_at")
    def serialize_deleted_at(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)


class AuditPublicBaseModel(BaseModel):
    id: Optional[uuid.UUID] = None
    created_by: Optional[uuid.UUID] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("deleted_at")
    def serialize_deleted_at(self, value: Optional[datetime]) -> Optional[str]:
        return format_datetime_gmt8(value)
