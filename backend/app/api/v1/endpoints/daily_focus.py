from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.daily_focus import DailyFocus
from app.models.task import Task
from app.schemas.daily_focus import DailyFocusCreate, DailyFocusResponse, DailyFocusSummary
from app.schemas.task import TaskResponse
from app.repositories.daily_focus_repo import DailyFocusRepository
from app.services.task_service import TaskService

router = APIRouter()


@router.get("", response_model=DailyFocusSummary)
def get_daily_focus(
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    focus_date = target_date or date.today()
    repo = DailyFocusRepository(db)
    task_service = TaskService(db)

    items = repo.get_by_date(current_user.id, focus_date)
    enriched_items = []
    completed_count = 0

    for item in items:
        task = db.query(Task).filter(Task.id == item.task_id).first()
        task_resp = task_service._enrich_task(task) if task else None
        if task and task.status == "COMPLETED":
            completed_count += 1

        enriched_items.append(DailyFocusResponse(
            id=item.id,
            user_id=item.user_id,
            task_id=item.task_id,
            focus_date=item.focus_date,
            sort_order=item.sort_order,
            created_at=item.created_at,
            task=task_resp
        ))

    total = len(enriched_items)
    percentage = round((completed_count / total * 100.0), 1) if total > 0 else 0.0

    return DailyFocusSummary(
        focus_date=focus_date,
        total_count=total,
        completed_count=completed_count,
        completion_percentage=percentage,
        items=enriched_items
    )


@router.post("/add", response_model=DailyFocusResponse, status_code=status.HTTP_201_CREATED)
def add_to_daily_focus(
    focus_in: DailyFocusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    focus_date = focus_in.focus_date or date.today()
    task = db.query(Task).filter(Task.id == focus_in.task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    repo = DailyFocusRepository(db)
    item = repo.add(current_user.id, focus_in.task_id, focus_date)
    task_service = TaskService(db)

    return DailyFocusResponse(
        id=item.id,
        user_id=item.user_id,
        task_id=item.task_id,
        focus_date=item.focus_date,
        sort_order=item.sort_order,
        created_at=item.created_at,
        task=task_service._enrich_task(task)
    )


@router.post("/remove")
def remove_from_daily_focus(
    task_id: str = Query(...),
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    focus_date = target_date or date.today()
    repo = DailyFocusRepository(db)
    removed = repo.remove(current_user.id, task_id, focus_date)
    return {"success": removed}


@router.post("/reset")
def reset_daily_focus(
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    focus_date = target_date or date.today()
    repo = DailyFocusRepository(db)
    count = repo.reset_for_date(current_user.id, focus_date)
    return {"message": f"Reset {count} tasks from Daily Focus for {focus_date}"}
