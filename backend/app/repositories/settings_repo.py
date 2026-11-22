from typing import Optional
from sqlalchemy.orm import Session
from app.models.settings import UserSettings
from app.schemas.settings import UserSettingsUpdate


class SettingsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: str) -> UserSettings:
        settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not settings:
            settings = UserSettings(user_id=user_id)
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
        return settings

    def update(self, user_id: str, settings_in: UserSettingsUpdate) -> UserSettings:
        settings = self.get_by_user_id(user_id)
        update_data = settings_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(settings, key, value)
        self.db.commit()
        self.db.refresh(settings)
        return settings
