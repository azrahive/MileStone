from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.settings import UserSettingsResponse, UserSettingsUpdate
from app.repositories.settings_repo import SettingsRepository

router = APIRouter()


@router.get("", response_model=UserSettingsResponse)
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = SettingsRepository(db)
    settings = repo.get_by_user_id(current_user.id)
    return UserSettingsResponse.model_validate(settings)


@router.put("", response_model=UserSettingsResponse)
def update_user_settings(
    settings_in: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = SettingsRepository(db)
    updated = repo.update(current_user.id, settings_in)
    return UserSettingsResponse.model_validate(updated)
