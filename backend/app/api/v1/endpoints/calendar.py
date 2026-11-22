from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.task import TaskResponse
from app.services.task_service import TaskService

router = APIRouter()


@router.get("", response_model=List[TaskResponse])
def get_calendar_tasks(
    start: datetime = Query(..., description="Start of date range in ISO format"),
    end: datetime = Query(..., description="End of date range in ISO format"),
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.get_all(
        user_id=current_user.id,
        project_id=project_id,
        due_from=start,
        due_to=end,
        sort_by="due_asc"
    )
