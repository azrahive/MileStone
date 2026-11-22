from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate


class ReminderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, user_id: str, upcoming_only: bool = True) -> List[Reminder]:
        query = self.db.query(Reminder).filter(Reminder.user_id == user_id)
        if upcoming_only:
            query = query.filter(Reminder.remind_at >= datetime.now(timezone.utc), Reminder.is_sent.is_(False))
        return query.order_by(Reminder.remind_at.asc()).all()

    def get_by_id(self, reminder_id: str, user_id: str) -> Optional[Reminder]:
        return self.db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == user_id).first()

    def create(self, reminder_in: ReminderCreate, user_id: str) -> Reminder:
        reminder = Reminder(
            user_id=user_id,
            task_id=reminder_in.task_id,
            remind_at=reminder_in.remind_at
        )
        self.db.add(reminder)
        self.db.commit()
        self.db.refresh(reminder)
        return reminder

    def update(self, reminder: Reminder, reminder_in: ReminderUpdate) -> Reminder:
        if reminder_in.remind_at is not None:
            reminder.remind_at = reminder_in.remind_at
        if reminder_in.is_sent is not None:
            reminder.is_sent = reminder_in.is_sent
        self.db.commit()
        self.db.refresh(reminder)
        return reminder

    def delete(self, reminder: Reminder) -> None:
        self.db.delete(reminder)
        self.db.commit()
