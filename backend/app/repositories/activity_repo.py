from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.activity import ActivityLog
from app.schemas.activity import ActivityLogCreate


class ActivityRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_recent(self, user_id: str, limit: int = 50) -> List[ActivityLog]:
        return self.db.query(ActivityLog).filter(
            ActivityLog.user_id == user_id
        ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

    def log(self, user_id: str, entity_type: str, entity_id: str, action: str, entity_title: Optional[str] = None, details: Optional[str] = None) -> ActivityLog:
        log_entry = ActivityLog(
            user_id=user_id,
            entity_type=entity_type.upper(),
            entity_id=entity_id,
            entity_title=entity_title,
            action=action.upper(),
            details=details
        )
        self.db.add(log_entry)
        self.db.commit()
        self.db.refresh(log_entry)
        return log_entry
