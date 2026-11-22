from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.project import ProjectResponse
from app.schemas.task import TaskResponse
from app.services.project_service import ProjectService
from app.services.task_service import TaskService

router = APIRouter()


@router.get("", response_model=Dict[str, Any])
def get_archive(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project_service = ProjectService(db)
    task_service = TaskService(db)

    archived_projects = project_service.get_all(current_user.id, include_archived=True)
    archived_projects = [p for p in archived_projects if p.is_archived]

    archived_tasks = task_service.get_all(current_user.id, include_archived=True)
    archived_tasks = [t for t in archived_tasks if t.is_archived]

    return {
        "projects": archived_projects,
        "tasks": archived_tasks,
        "total_archived_projects": len(archived_projects),
        "total_archived_tasks": len(archived_tasks)
    }
