from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RecurringTaskBase(BaseModel):
    frequency: str  # DAILY, WEEKLY, MONTHLY, CUSTOM
    interval_days: Optional[int] = 1
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    is_active: Optional[bool] = True


class RecurringTaskCreate(RecurringTaskBase):
    base_task_id: str


class RecurringTaskUpdate(BaseModel):
    frequency: Optional[str] = None
    interval_days: Optional[int] = None
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    is_active: Optional[bool] = None


class RecurringTaskResponse(RecurringTaskBase):
    id: str
    user_id: str
    base_task_id: str
    next_due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
