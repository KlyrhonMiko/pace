import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from utils.timezone import ensure_aware_datetime

class NotificationBase(BaseModel):
    title: str = Field(..., max_length=255)
    message: str = Field(..., max_length=1000)
    link: Optional[str] = Field(None, max_length=500)

class NotificationCreate(NotificationBase):
    user_ref_id: uuid.UUID

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationResponse(NotificationBase):
    id: uuid.UUID
    user_ref_id: uuid.UUID
    is_read: bool
    created_at: datetime
    
    @field_validator("created_at", mode="before")
    @classmethod
    def ensure_aware(cls, v):
        if isinstance(v, datetime):
            return ensure_aware_datetime(v)
        return v

    class Config:
        from_attributes = True
