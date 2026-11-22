from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.subtask import SubtaskCreate, SubtaskUpdate, SubtaskResponse
from app.services.subtask_service import SubtaskService

router = APIRouter()


@router.get("/task/{task_id}", response_model=List[SubtaskResponse])
def get_subtasks(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SubtaskService(db)
    return service.get_by_task_id(task_id, current_user.id)


@router.post("/task/{task_id}", response_model=SubtaskResponse, status_code=status.HTTP_201_CREATED)
def create_subtask(
    task_id: str,
    subtask_in: SubtaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SubtaskService(db)
    return service.create(task_id, subtask_in, current_user.id)


@router.put("/{subtask_id}", response_model=SubtaskResponse)
def update_subtask(
    subtask_id: str,
    subtask_in: SubtaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SubtaskService(db)
    return service.update(subtask_id, subtask_in, current_user.id)


@router.post("/{subtask_id}/toggle", response_model=SubtaskResponse)
def toggle_subtask(
    subtask_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SubtaskService(db)
    return service.toggle(subtask_id, current_user.id)


@router.delete("/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subtask(
    subtask_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SubtaskService(db)
    service.delete(subtask_id, current_user.id)
    return None
