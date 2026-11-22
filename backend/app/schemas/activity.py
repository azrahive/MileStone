from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ActivityLogBase(BaseModel):
    entity_type: str
    entity_id: str
    entity_title: Optional[str] = None
    action: str
    details: Optional[str] = None


class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogResponse(ActivityLogBase):
    id: str
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
