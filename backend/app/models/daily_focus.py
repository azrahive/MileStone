import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Date, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DailyFocus(Base):
    __tablename__ = "daily_focus"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    focus_date = Column(Date, default=date.today, index=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="daily_focus_items")
    task = relationship("Task", back_populates="daily_focus")

    __table_args__ = (
        UniqueConstraint("user_id", "task_id", "focus_date", name="uq_user_task_date"),
    )
