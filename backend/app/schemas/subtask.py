from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SubtaskBase(BaseModel):
    title: str
    sort_order: Optional[int] = 0


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    sort_order: Optional[int] = None


class SubtaskResponse(SubtaskBase):
    id: str
    task_id: str
    is_completed: bool
    completion_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
