from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.subtask import Subtask
from app.schemas.subtask import SubtaskCreate, SubtaskUpdate


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SubtaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_task_id(self, task_id: str) -> List[Subtask]:
        return self.db.query(Subtask).filter(Subtask.task_id == task_id).order_by(Subtask.sort_order.asc(), Subtask.created_at.asc()).all()

    def get_by_id(self, subtask_id: str) -> Optional[Subtask]:
        return self.db.query(Subtask).filter(Subtask.id == subtask_id).first()

    def create(self, subtask_in: SubtaskCreate, task_id: str) -> Subtask:
        subtask = Subtask(
            task_id=task_id,
            title=subtask_in.title.strip(),
            sort_order=subtask_in.sort_order or 0,
            is_completed=False
        )
        self.db.add(subtask)
        self.db.commit()
        self.db.refresh(subtask)
        return subtask

    def update(self, subtask: Subtask, subtask_in: SubtaskUpdate) -> Subtask:
        if subtask_in.title is not None:
            subtask.title = subtask_in.title.strip()
        if subtask_in.sort_order is not None:
            subtask.sort_order = subtask_in.sort_order
        if subtask_in.is_completed is not None:
            if subtask_in.is_completed and not subtask.is_completed:
                subtask.is_completed = True
                subtask.completion_date = utc_now()
            elif not subtask_in.is_completed and subtask.is_completed:
                subtask.is_completed = False
                subtask.completion_date = None
        self.db.commit()
        self.db.refresh(subtask)
        return subtask

    def toggle_complete(self, subtask: Subtask) -> Subtask:
        if subtask.is_completed:
            subtask.is_completed = False
            subtask.completion_date = None
        else:
            subtask.is_completed = True
            subtask.completion_date = utc_now()
        self.db.commit()
        self.db.refresh(subtask)
        return subtask

    def delete(self, subtask: Subtask) -> None:
        self.db.delete(subtask)
        self.db.commit()
