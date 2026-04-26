import uuid
from typing import Optional
from sqlmodel import Field

from .base import BaseTable

class Notification(BaseTable, table=True):
    __tablename__ = "notifications"

    user_ref_id: uuid.UUID = Field(index=True)
    title: str = Field(max_length=255)
    message: str = Field(max_length=1000)
    link: Optional[str] = Field(default=None, max_length=500)
    is_read: bool = Field(default=False)
