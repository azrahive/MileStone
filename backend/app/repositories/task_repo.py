from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.tag import Tag
from app.schemas.task import TaskCreate, TaskUpdate


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        user_id: str,
        project_id: Optional[str] = None,
        status_mode: Optional[str] = None,  # pending, completed, all, overdue
        priority: Optional[str] = None,
        tag_id: Optional[str] = None,
        search: Optional[str] = None,
        due_from: Optional[datetime] = None,
        due_to: Optional[datetime] = None,
        include_archived: bool = False,
        sort_by: Optional[str] = "order_asc"
    ) -> List[Task]:
        query = self.db.query(Task).filter(Task.user_id == user_id)

        if not include_archived:
            query = query.filter(Task.is_archived.is_(False))

        if project_id:
            query = query.filter(Task.project_id == project_id)

        # Status filtering
        now = utc_now()
        if status_mode == "pending":
            query = query.filter(Task.status.in_(["PENDING", "IN_PROGRESS", "ON_HOLD"]))
        elif status_mode == "completed":
            query = query.filter(Task.status == "COMPLETED")
        elif status_mode == "overdue":
            query = query.filter(
                Task.status.in_(["PENDING", "IN_PROGRESS", "ON_HOLD"]),
                Task.due_date.isnot(None),
                Task.due_date < now
            )

        if priority:
            query = query.filter(Task.priority == priority.upper())

        if tag_id:
            query = query.filter(Task.tags.any(Tag.id == tag_id))

        if due_from:
            query = query.filter(Task.due_date >= due_from)
        if due_to:
            query = query.filter(Task.due_date <= due_to)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term),
                    Task.notes.ilike(search_term)
                )
            )

        # Ordering
        if sort_by == "due_asc":
            query = query.order_by(asc(Task.due_date).nullslast(), asc(Task.sort_order))
        elif sort_by == "due_desc":
            query = query.order_by(desc(Task.due_date).nullslast(), asc(Task.sort_order))
        elif sort_by == "priority_desc":
            query = query.order_by(desc(Task.priority), asc(Task.sort_order))
        elif sort_by == "created_desc":
            query = query.order_by(desc(Task.created_at))
        elif sort_by == "completed_desc":
            query = query.order_by(desc(Task.completion_date).nullslast(), desc(Task.updated_at))
        else:
            query = query.order_by(asc(Task.sort_order), desc(Task.created_at))

        return query.all()

    def get_by_id(self, task_id: str, user_id: str) -> Optional[Task]:
        return self.db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()

    def create(self, task_in: TaskCreate, user_id: str, tags: List[Tag] = None) -> Task:
        task = Task(
            user_id=user_id,
            project_id=task_in.project_id,
            title=task_in.title.strip(),
            description=task_in.description,
            priority=task_in.priority or "MEDIUM",
            status=task_in.status or "PENDING",
            start_date=task_in.start_date,
            due_date=task_in.due_date,
            estimated_minutes=task_in.estimated_minutes or 0,
            actual_minutes=task_in.actual_minutes or 0,
            notes=task_in.notes,
            sort_order=task_in.sort_order or 0,
            is_archived=False
        )
        if task.status == "COMPLETED":
            task.completion_date = utc_now()

        if tags:
            task.tags = tags

        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update(self, task: Task, task_in: TaskUpdate, tags: Optional[List[Tag]] = None) -> Task:
        update_data = task_in.model_dump(exclude_unset=True)
        if "tag_ids" in update_data:
            del update_data["tag_ids"]

        # Check if status is changed to COMPLETED
        if "status" in update_data:
            new_status = update_data["status"]
            if new_status == "COMPLETED" and task.status != "COMPLETED":
                task.completion_date = utc_now()
            elif new_status != "COMPLETED" and task.status == "COMPLETED":
                task.completion_date = None

        for key, value in update_data.items():
            setattr(task, key, value)

        if tags is not None:
            task.tags = tags

        self.db.commit()
        self.db.refresh(task)
        return task

    def reorder(self, task: Task, target_order: int, target_status: Optional[str] = None) -> Task:
        task.sort_order = target_order
        if target_status and target_status != task.status:
            if target_status == "COMPLETED" and task.status != "COMPLETED":
                task.completion_date = utc_now()
            elif target_status != "COMPLETED" and task.status == "COMPLETED":
                task.completion_date = None
            task.status = target_status
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete(self, task: Task) -> None:
        self.db.delete(task)
        self.db.commit()
