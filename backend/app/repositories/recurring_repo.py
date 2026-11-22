from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.recurring import RecurringTask
from app.schemas.recurring import RecurringTaskCreate, RecurringTaskUpdate


class RecurringRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_task_id(self, task_id: str, user_id: str) -> Optional[RecurringTask]:
        return self.db.query(RecurringTask).filter(
            RecurringTask.base_task_id == task_id,
            RecurringTask.user_id == user_id
        ).first()

    def get_all_active(self, user_id: str) -> List[RecurringTask]:
        return self.db.query(RecurringTask).filter(
            RecurringTask.user_id == user_id,
            RecurringTask.is_active.is_(True)
        ).all()

    def create(self, rec_in: RecurringTaskCreate, user_id: str) -> RecurringTask:
        rec = RecurringTask(
            user_id=user_id,
            base_task_id=rec_in.base_task_id,
            frequency=rec_in.frequency.upper(),
            interval_days=rec_in.interval_days or 1,
            day_of_week=rec_in.day_of_week,
            day_of_month=rec_in.day_of_month,
            is_active=rec_in.is_active if rec_in.is_active is not None else True
        )
        self.db.add(rec)
        self.db.commit()
        self.db.refresh(rec)
        return rec

    def update(self, rec: RecurringTask, rec_in: RecurringTaskUpdate) -> RecurringTask:
        if rec_in.frequency is not None:
            rec.frequency = rec_in.frequency.upper()
        if rec_in.interval_days is not None:
            rec.interval_days = rec_in.interval_days
        if rec_in.day_of_week is not None:
            rec.day_of_week = rec_in.day_of_week
        if rec_in.day_of_month is not None:
            rec.day_of_month = rec_in.day_of_month
        if rec_in.is_active is not None:
            rec.is_active = rec_in.is_active
        self.db.commit()
        self.db.refresh(rec)
        return rec

    def delete(self, rec: RecurringTask) -> None:
        self.db.delete(rec)
        self.db.commit()
