from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.schemas.recurring import RecurringTaskCreate, RecurringTaskUpdate, RecurringTaskResponse
from app.repositories.recurring_repo import RecurringRepository

router = APIRouter()


@router.get("/task/{task_id}", response_model=Optional[RecurringTaskResponse])
def get_task_recurrence(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = RecurringRepository(db)
    rec = repo.get_by_task_id(task_id, current_user.id)
    if not rec:
        return None
    return RecurringTaskResponse.model_validate(rec)


@router.post("", response_model=RecurringTaskResponse, status_code=status.HTTP_201_CREATED)
def set_recurring_task(
    rec_in: RecurringTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == rec_in.base_task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    repo = RecurringRepository(db)
    existing = repo.get_by_task_id(rec_in.base_task_id, current_user.id)
    if existing:
        updated = repo.update(existing, RecurringTaskUpdate(**rec_in.model_dump(exclude={"base_task_id"})))
        return RecurringTaskResponse.model_validate(updated)

    created = repo.create(rec_in, current_user.id)
    return RecurringTaskResponse.model_validate(created)


@router.delete("/task/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_recurrence(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = RecurringRepository(db)
    rec = repo.get_by_task_id(task_id, current_user.id)
    if rec:
        repo.delete(rec)
    return None
