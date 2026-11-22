from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskReorder
from app.services.task_service import TaskService

router = APIRouter()


@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status_mode: Optional[str] = Query(None, description="pending, completed, all, overdue"),
    project_id: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    tag_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    due_from: Optional[datetime] = Query(None),
    due_to: Optional[datetime] = Query(None),
    include_archived: bool = Query(False),
    sort_by: Optional[str] = Query("order_asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.get_all(
        user_id=current_user.id,
        project_id=project_id,
        status_mode=status_mode,
        priority=priority,
        tag_id=tag_id,
        search=search,
        due_from=due_from,
        due_to=due_to,
        include_archived=include_archived,
        sort_by=sort_by
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.create(task_in, current_user.id)


@router.post("/reorder", response_model=TaskResponse)
def reorder_task(
    reorder_data: TaskReorder,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.reorder(reorder_data, current_user.id)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.get_by_id(task_id, current_user.id)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.update(task_id, task_in, current_user.id)


@router.post("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.complete(task_id, current_user.id)


@router.post("/{task_id}/reopen", response_model=TaskResponse)
def reopen_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.reopen(task_id, current_user.id)


@router.post("/{task_id}/duplicate", response_model=TaskResponse)
def duplicate_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.duplicate(task_id, current_user.id)


@router.post("/{task_id}/archive", response_model=TaskResponse)
def archive_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.archive(task_id, current_user.id)


@router.post("/{task_id}/restore", response_model=TaskResponse)
def restore_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    return service.restore(task_id, current_user.id)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    service.delete(task_id, current_user.id)
    return None
