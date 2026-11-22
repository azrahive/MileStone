from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from app.repositories.reminder_repo import ReminderRepository
from app.models.task import Task

router = APIRouter()


@router.get("", response_model=List[ReminderResponse])
def get_reminders(
    upcoming_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = ReminderRepository(db)
    reminders = repo.get_all(current_user.id, upcoming_only=upcoming_only)
    resp = []
    for r in reminders:
        task = db.query(Task).filter(Task.id == r.task_id).first()
        item = ReminderResponse.model_validate(r)
        item.task_title = task.title if task else None
        resp.append(item)
    return resp


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder_in: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == reminder_in.task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    repo = ReminderRepository(db)
    reminder = repo.create(reminder_in, current_user.id)
    resp = ReminderResponse.model_validate(reminder)
    resp.task_title = task.title
    return resp


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: str,
    reminder_in: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = ReminderRepository(db)
    reminder = repo.get_by_id(reminder_id, current_user.id)
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    updated = repo.update(reminder, reminder_in)
    return ReminderResponse.model_validate(updated)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = ReminderRepository(db)
    reminder = repo.get_by_id(reminder_id, current_user.id)
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    repo.delete(reminder)
    return None
