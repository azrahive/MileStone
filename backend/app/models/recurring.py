import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RecurringTask(Base):
    __tablename__ = "recurring_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    base_task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, unique=True)
    frequency = Column(String(20), nullable=False)  # DAILY, WEEKLY, MONTHLY, CUSTOM
    interval_days = Column(Integer, default=1)
    day_of_week = Column(Integer, nullable=True)     # 0-6 for Mon-Sun
    day_of_month = Column(Integer, nullable=True)    # 1-31
    next_due_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="recurring_tasks")
    base_task = relationship("Task", back_populates="recurring_config")
