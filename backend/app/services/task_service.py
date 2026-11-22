from typing import List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.task_repo import TaskRepository
from app.repositories.tag_repo import TagRepository
from app.repositories.activity_repo import ActivityRepository
from app.repositories.recurring_repo import RecurringRepository
from app.models.task import Task
from app.models.subtask import Subtask
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskReorder
from app.schemas.subtask import SubtaskResponse
from app.schemas.tag import TagResponse


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TaskService:
    def __init__(self, db: Session):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.tag_repo = TagRepository(db)
        self.activity_repo = ActivityRepository(db)
        self.rec_repo = RecurringRepository(db)

    def _enrich_task(self, task: Task) -> TaskResponse:
        subtasks_list = self.db.query(Subtask).filter(Subtask.task_id == task.id).order_by(Subtask.sort_order.asc(), Subtask.created_at.asc()).all()
        total_subtasks = len(subtasks_list)
        completed_subtasks = sum(1 for s in subtasks_list if s.is_completed)

        now = utc_now()
        is_overdue = False
        if task.due_date and task.status not in ["COMPLETED", "CANCELLED"]:
            # Ensure due_date comparison is timezone aware
            due = task.due_date if task.due_date.tzinfo else task.due_date.replace(tzinfo=timezone.utc)
            if due < now:
                is_overdue = True

        resp = TaskResponse(
            id=task.id,
            user_id=task.user_id,
            project_id=task.project_id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            start_date=task.start_date,
            due_date=task.due_date,
            completion_date=task.completion_date,
            estimated_minutes=task.estimated_minutes,
            actual_minutes=task.actual_minutes,
            notes=task.notes,
            sort_order=task.sort_order,
            is_archived=task.is_archived,
            created_at=task.created_at,
            updated_at=task.updated_at,
            subtasks=[SubtaskResponse.model_validate(s) for s in subtasks_list],
            tags=[TagResponse.model_validate(t) for t in task.tags],
            total_subtasks=total_subtasks,
            completed_subtasks=completed_subtasks,
            is_overdue=is_overdue,
            project_title=task.project.title if task.project else None,
            project_color=task.project.color if task.project else None
        )
        return resp

    def get_all(
        self,
        user_id: str,
        project_id: Optional[str] = None,
        status_mode: Optional[str] = None,
        priority: Optional[str] = None,
        tag_id: Optional[str] = None,
        search: Optional[str] = None,
        due_from: Optional[datetime] = None,
        due_to: Optional[datetime] = None,
        include_archived: bool = False,
        sort_by: Optional[str] = "order_asc"
    ) -> List[TaskResponse]:
        tasks = self.task_repo.get_all(
            user_id=user_id,
            project_id=project_id,
            status_mode=status_mode,
            priority=priority,
            tag_id=tag_id,
            search=search,
            due_from=due_from,
            due_to=due_to,
            include_archived=include_archived,
            sort_by=sort_by
        )
        return [self._enrich_task(t) for t in tasks]

    def get_by_id(self, task_id: str, user_id: str) -> TaskResponse:
        task = self.task_repo.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return self._enrich_task(task)

    def create(self, task_in: TaskCreate, user_id: str) -> TaskResponse:
        tags = []
        if task_in.tag_ids:
            tags = self.tag_repo.get_by_ids(task_in.tag_ids, user_id)

        task = self.task_repo.create(task_in, user_id, tags)
        self.activity_repo.log(
            user_id=user_id,
            entity_type="TASK",
            entity_id=task.id,
            entity_title=task.title,
            action="CREATED",
            details=f"Task '{task.title}' was created"
        )
        return self._enrich_task(task)

    def update(self, task_id: str, task_in: TaskUpdate, user_id: str) -> TaskResponse:
        task = self.task_repo.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

        old_status = task.status
        old_priority = task.priority
        old_due = task.due_date

        tags = None
        if task_in.tag_ids is not None:
            tags = self.tag_repo.get_by_ids(task_in.tag_ids, user_id)

        updated = self.task_repo.update(task, task_in, tags)

        # Audit logs for meaningful changes
        if task_in.status and task_in.status != old_status:
            if task_in.status == "COMPLETED":
                self.activity_repo.log(user_id, "TASK", task.id, "COMPLETED", task.title, "Task marked as completed")
                # Trigger recurring task generation if configured
                self._handle_recurrence_on_complete(task, user_id)
            else:
                self.activity_repo.log(user_id, "TASK", task.id, "STATUS_CHANGED", task.title, f"Status changed to {task_in.status}")
        elif task_in.priority and task_in.priority != old_priority:
            self.activity_repo.log(user_id, "TASK", task.id, "PRIORITY_CHANGED", task.title, f"Priority changed to {task_in.priority}")
        elif task_in.due_date != old_due:
            self.activity_repo.log(user_id, "TASK", task.id, "DUE_DATE_CHANGED", task.title, "Due date was updated")
        else:
            self.activity_repo.log(user_id, "TASK", task.id, "UPDATED", task.title, "Task details were updated")

        return self._enrich_task(updated)

    def complete(self, task_id: str, user_id: str) -> TaskResponse:
        task = self.task_repo.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        task.status = "COMPLETED"
        task.completion_date = utc_now()
        self.db.commit()
        self.db.refresh(task)
        self.activity_repo.log(user_id, "TASK", task.id, "COMPLETED", task.title, "Task marked as completed")
        self._handle_recurrence_on_complete(task, user_id)
        return self._enrich_task(task)

    def reopen(self, task_id: str, user_id: str) -> TaskResponse:
        task = self.task_repo.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        task.status = "PENDING"
        task.completion_date = None
        self.db.commit()
        self.db.refresh(task)
        self.activity_repo.log(user_id, "TASK", task.id, "REOPENED", task.title, "Task reopened")
        return self._enrich_task(task)

    def reorder(self, reorder_data: TaskReorder, user_id: str) -> TaskResponse:
        task = self.task_repo.get_by_id(reorder_data.task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        updated = self.task_repo.reorder(task, reorder_data.target_order, reorder_data.target_status)
        return self._enrich_task(updated)

    def duplicate(self, task_id: str, user_id: str) -> TaskResponse:
        original = self.task_repo.get_by_id(task_id, user_id)
        if not original:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
        dup = Task(
            user_id=user_id,
            project_id=original.project_id,
            title=f"{original.title} (Copy)",
            description=original.description,
            priority=original.priority,
            status="PENDING",
            start_date=original.start_date,
            due_date=original.due_date,
            estimated_minutes=original.estimated_minutes,
            actual_minutes=0,
            notes=original.notes,
            sort_order=original.sort_order + 1,
            is_archived=False
        )
        dup.tags = list(original.tags)
        self.db.add(dup)
        self.db.flush()

        # Duplicate subtasks
        for s in original.subtasks:
            sub = Subtask(
                task_id=dup.id,
                title=s.title,
                sort_order=s.sort_order,
                is_completed=False
            )
            self.db.add(sub)

        self.db.commit()
        self.db.refresh(dup)
        self.activity_repo.log(user_id, "TASK", dup.id, "DUPLICATED", dup.title, f"Duplicated from '{original.title}'")
        return self._enrich_task(dup)

    def archive(self, task_id: str, user_id: str) -> TaskResponse:
        task = self.task_repo.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        task.is_archived = True
        task.archived_at = utc_now()
        self.db.commit()
        self.db.refresh(task)
        self.activity_repo.log(user_id, "TASK", task.id, "ARCHIVED", task.title, "Task moved to Archive Vault")
        return self._enrich_task(task)

    def restore(self, task_id: str, user_id: str) -> TaskResponse:
        task = self.task_repo.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        task.is_archived = False
        task.archived_at = None
        self.db.commit()
        self.db.refresh(task)
        self.activity_repo.log(user_id, "TASK", task.id, "RESTORED", task.title, "Task restored from archive")
        return self._enrich_task(task)

    def delete(self, task_id: str, user_id: str, permanent: bool = False) -> None:
        task = self.task_repo.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        if not permanent:
            # Soft-delete to archive vault
            self.archive(task_id, user_id)
        else:
            # Permanent removal
            title = task.title
            self.task_repo.delete(task)
            self.activity_repo.log(user_id, "TASK", task_id, "DELETED", title, f"Task '{title}' was permanently deleted")

    def _handle_recurrence_on_complete(self, task: Task, user_id: str):
        rec = self.rec_repo.get_by_task_id(task.id, user_id)
        if not rec or not rec.is_active:
            return
        
        now = utc_now()
        base_due = task.due_date or now
        if not base_due.tzinfo:
            base_due = base_due.replace(tzinfo=timezone.utc)

        next_due = None
        if rec.frequency == "DAILY":
            next_due = base_due + timedelta(days=rec.interval_days or 1)
        elif rec.frequency == "WEEKLY":
            next_due = base_due + timedelta(weeks=rec.interval_days or 1)
        elif rec.frequency == "MONTHLY":
            next_due = base_due + timedelta(days=30 * (rec.interval_days or 1))
        else:
            next_due = base_due + timedelta(days=rec.interval_days or 1)

        # Create next occurrence
        next_task = Task(
            user_id=user_id,
            project_id=task.project_id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status="PENDING",
            start_date=now,
            due_date=next_due,
            estimated_minutes=task.estimated_minutes,
            notes=task.notes,
            sort_order=task.sort_order,
            is_archived=False
        )
        next_task.tags = list(task.tags)
        self.db.add(next_task)
        self.db.flush()

        # Copy subtasks (uncompleted)
        for s in task.subtasks:
            sub = Subtask(
                task_id=next_task.id,
                title=s.title,
                sort_order=s.sort_order,
                is_completed=False
            )
            self.db.add(sub)

        # Re-link recurrence to new task
        rec.base_task_id = next_task.id
        rec.next_due_date = next_due
        self.db.commit()
        self.activity_repo.log(user_id, "TASK", next_task.id, "RECURRENCE_GENERATED", next_task.title, f"Next recurring task spawned for {next_due.date()}")
