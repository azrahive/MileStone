from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class ProductivityTrendItem(BaseModel):
    date: str
    completed: int
    created: int


class PriorityDistributionItem(BaseModel):
    priority: str
    count: int
    percentage: float


class StatusDistributionItem(BaseModel):
    status: str
    count: int


class ProjectProgressItem(BaseModel):
    project_id: str
    title: str
    color: str
    total_tasks: int
    completed_tasks: int
    completion_rate: float


class DashboardStats(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    today_tasks: int
    overall_completion_percentage: float
    
    weekly_productivity: List[ProductivityTrendItem]
    priority_distribution: List[PriorityDistributionItem]
    status_distribution: List[StatusDistributionItem]
    project_progress: List[ProjectProgressItem]
