from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReminderBase(BaseModel):
    task_id: str
    remind_at: datetime


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    remind_at: Optional[datetime] = None
    is_sent: Optional[bool] = None


class ReminderResponse(ReminderBase):
    id: str
    user_id: str
    is_sent: bool
    created_at: datetime
    task_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
