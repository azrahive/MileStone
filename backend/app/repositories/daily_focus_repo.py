from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from app.models.daily_focus import DailyFocus


class DailyFocusRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_date(self, user_id: str, focus_date: date) -> List[DailyFocus]:
        return self.db.query(DailyFocus).filter(
            DailyFocus.user_id == user_id,
            DailyFocus.focus_date == focus_date
        ).order_by(DailyFocus.sort_order.asc()).all()

    def add(self, user_id: str, task_id: str, focus_date: date) -> DailyFocus:
        existing = self.db.query(DailyFocus).filter(
            DailyFocus.user_id == user_id,
            DailyFocus.task_id == task_id,
            DailyFocus.focus_date == focus_date
        ).first()
        if existing:
            return existing

        item = DailyFocus(
            user_id=user_id,
            task_id=task_id,
            focus_date=focus_date
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def remove(self, user_id: str, task_id: str, focus_date: date) -> bool:
        item = self.db.query(DailyFocus).filter(
            DailyFocus.user_id == user_id,
            DailyFocus.task_id == task_id,
            DailyFocus.focus_date == focus_date
        ).first()
        if item:
            self.db.delete(item)
            self.db.commit()
            return True
        return False

    def reset_for_date(self, user_id: str, focus_date: date) -> int:
        count = self.db.query(DailyFocus).filter(
            DailyFocus.user_id == user_id,
            DailyFocus.focus_date == focus_date
        ).delete()
        self.db.commit()
        return count
