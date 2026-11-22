from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.task import TaskResponse


class DailyFocusCreate(BaseModel):
    task_id: str
    focus_date: Optional[date] = None


class DailyFocusResponse(BaseModel):
    id: str
    user_id: str
    task_id: str
    focus_date: date
    sort_order: int
    created_at: datetime
    task: Optional[TaskResponse] = None

    model_config = ConfigDict(from_attributes=True)


class DailyFocusSummary(BaseModel):
    focus_date: date
    total_count: int
    completed_count: int
    completion_percentage: float
    items: list[DailyFocusResponse]
