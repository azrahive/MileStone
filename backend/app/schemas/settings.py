from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserSettingsBase(BaseModel):
    theme: Optional[str] = "system"
    api_server_url: Optional[str] = None
    notifications_enabled: Optional[bool] = True
    sound_enabled: Optional[bool] = True
    default_task_view: Optional[str] = "pending"


class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    api_server_url: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    default_task_view: Optional[str] = None


class UserSettingsResponse(UserSettingsBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
