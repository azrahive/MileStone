from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TagBase(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagResponse(TagBase):
    id: str
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
