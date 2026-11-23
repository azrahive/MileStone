from typing import List, Optional
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.project_repo import ProjectRepository
from app.repositories.activity_repo import ActivityRepository
from app.models.task import Task
from app.models.project import Project
from app.models.activity import ActivityLog
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.schemas.category import CategoryResponse


class ProjectService:
    def __init__(self, db: Session):
        self.db = db
        self.project_repo = ProjectRepository(db)
        self.activity_repo = ActivityRepository(db)

    def _enrich_project(self, project: Project) -> ProjectResponse:
        total_tasks = self.db.query(Task).filter(Task.project_id == project.id, Task.is_archived.is_(False)).count()
        completed_tasks = self.db.query(Task).filter(
            Task.project_id == project.id,
            Task.status == "COMPLETED",
            Task.is_archived.is_(False)
        ).count()
        pending_tasks = total_tasks - completed_tasks
        progress = round((completed_tasks / total_tasks * 100.0), 1) if total_tasks > 0 else 0.0

        resp = ProjectResponse(
            id=project.id,
            user_id=project.user_id,
            title=project.title,
            description=project.description,
            category_id=project.category_id,
            color=project.color,
            icon=project.icon,
            start_date=project.start_date,
            due_date=project.due_date,
            priority=project.priority,
            status=project.status,
            sort_order=project.sort_order,
            is_archived=project.is_archived,
            created_at=project.created_at,
            updated_at=project.updated_at,
            category=CategoryResponse.model_validate(project.category) if project.category else None,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            pending_tasks=pending_tasks,
            progress_percentage=progress
        )
        return resp

    def get_all(
        self,
        user_id: str,
        include_archived: bool = False,
        search: Optional[str] = None,
        category_id: Optional[str] = None,
        priority: Optional[str] = None,
        status_filter: Optional[str] = None,
        sort_by: Optional[str] = "order_asc"
    ) -> List[ProjectResponse]:
        projects = self.project_repo.get_all(
            user_id=user_id,
            include_archived=include_archived,
            search=search,
            category_id=category_id,
            priority=priority,
            status=status_filter,
            sort_by=sort_by
        )
        return [self._enrich_project(p) for p in projects]

    def get_by_id(self, project_id: str, user_id: str) -> ProjectResponse:
        project = self.project_repo.get_by_id(project_id, user_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return self._enrich_project(project)

    def create(self, project_in: ProjectCreate, user_id: str) -> ProjectResponse:
        project = self.project_repo.create(project_in, user_id)
        self.activity_repo.log(
            user_id=user_id,
            entity_type="PROJECT",
            entity_id=project.id,
            entity_title=project.title,
            action="CREATED",
            details=f"Project '{project.title}' was created"
        )
        return self._enrich_project(project)

    def update(self, project_id: str, project_in: ProjectUpdate, user_id: str) -> ProjectResponse:
        project = self.project_repo.get_by_id(project_id, user_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        updated = self.project_repo.update(project, project_in)
        self.activity_repo.log(
            user_id=user_id,
            entity_type="PROJECT",
            entity_id=updated.id,
            entity_title=updated.title,
            action="UPDATED",
            details="Project details were updated"
        )
        return self._enrich_project(updated)

    def archive(self, project_id: str, user_id: str) -> ProjectResponse:
        project = self.project_repo.get_by_id(project_id, user_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        archived = self.project_repo.archive(project)
        self.activity_repo.log(
            user_id=user_id,
            entity_type="PROJECT",
            entity_id=archived.id,
            entity_title=archived.title,
            action="ARCHIVED",
            details="Project was archived"
        )
        return self._enrich_project(archived)

    def restore(self, project_id: str, user_id: str) -> ProjectResponse:
        project = self.project_repo.get_by_id(project_id, user_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        restored = self.project_repo.restore(project)
        self.activity_repo.log(
            user_id=user_id,
            entity_type="PROJECT",
            entity_id=restored.id,
            entity_title=restored.title,
            action="RESTORED",
            details="Project was restored from archive"
        )
        return self._enrich_project(restored)

    def delete(self, project_id: str, user_id: str) -> None:
        project = self.project_repo.get_by_id(project_id, user_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        tasks = list(project.tasks)
        task_ids = [task.id for task in tasks]
        subtask_ids = [
            subtask.id
            for task in tasks
            for subtask in task.subtasks
        ]
        task_activity_entity_ids = task_ids + subtask_ids
        activity_filters = [
            and_(
                ActivityLog.entity_type == "PROJECT",
                ActivityLog.entity_id == project_id
            )
        ]
        if task_activity_entity_ids:
            activity_filters.append(and_(
                ActivityLog.entity_type.in_(["TASK", "SUBTASK"]),
                ActivityLog.entity_id.in_(task_activity_entity_ids)
            ))
        self.db.query(ActivityLog).filter(
            ActivityLog.user_id == user_id,
            or_(*activity_filters)
        ).delete(synchronize_session=False)
        for task in tasks:
            self.db.delete(task)
        self.project_repo.delete(project)
