import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True) # PROJECT, TASK, SUBTASK
    entity_id = Column(String(36), nullable=False, index=True)
    entity_title = Column(String(255), nullable=True)
    action = Column(String(50), nullable=False, index=True)      # CREATED, UPDATED, COMPLETED, REOPENED, DELETED, ARCHIVED, RESTORED
    details = Column(Text, nullable=True)                       # JSON or human readable details
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    user = relationship("User", back_populates="activity_logs")
