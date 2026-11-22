from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.subtask import SubtaskResponse
from app.schemas.tag import TagResponse


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    priority: Optional[str] = "MEDIUM"      # HIGH, MEDIUM, LOW
    status: Optional[str] = "PENDING"       # PENDING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_minutes: Optional[int] = 0
    actual_minutes: Optional[int] = 0
    notes: Optional[str] = None
    sort_order: Optional[int] = 0


class TaskCreate(TaskBase):
    tag_ids: Optional[List[str]] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = None
    is_archived: Optional[bool] = None
    tag_ids: Optional[List[str]] = None


class TaskReorder(BaseModel):
    task_id: str
    target_status: Optional[str] = None
    target_order: int


class TaskResponse(TaskBase):
    id: str
    user_id: str
    completion_date: Optional[datetime] = None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskResponse] = []
    tags: List[TagResponse] = []
    
    # Computed metrics
    total_subtasks: int = 0
    completed_subtasks: int = 0
    is_overdue: bool = False
    project_title: Optional[str] = None
    project_color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
