from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.task import TaskResponse, TaskUpdate
from app.services.task_service import TaskService

router = APIRouter()


@router.get("", response_model=List[TaskResponse])
def get_overdue_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.get_all(
        user_id=current_user.id,
        status_mode="overdue",
        sort_by="due_asc"
    )


@router.post("/{task_id}/reschedule", response_model=TaskResponse)
def reschedule_overdue_task(
    task_id: str,
    new_due_date: datetime = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.update(task_id, TaskUpdate(due_date=new_due_date), current_user.id)
