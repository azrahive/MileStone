from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.activity import ActivityLogResponse
from app.repositories.activity_repo import ActivityRepository

router = APIRouter()


@router.get("", response_model=List[ActivityLogResponse])
def get_activity_log(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = ActivityRepository(db)
    logs = repo.get_recent(current_user.id, limit=limit)
    return [ActivityLogResponse.model_validate(l) for l in logs]
