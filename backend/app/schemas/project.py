from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.category import CategoryResponse


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    color: Optional[str] = "#6366f1"
    icon: Optional[str] = "folder"
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = "MEDIUM"      # HIGH, MEDIUM, LOW
    status: Optional[str] = "ACTIVE"        # ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
    sort_order: Optional[int] = 0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    sort_order: Optional[int] = None
    is_archived: Optional[bool] = None
    archived_at: Optional[datetime] = None


class ProjectResponse(ProjectBase):
    id: str
    user_id: str
    is_archived: bool
    archived_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    
    # Dynamic stats
    total_tasks: int = 0
    completed_tasks: int = 0
    pending_tasks: int = 0
    progress_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)
