import csv
import io
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.tag import Tag
from app.models.project import Project
from app.models.task import Task
from app.models.subtask import Subtask
from app.models.user import User
from app.schemas.backup import BackupExportData, RestoreRequest


def utc_now_str() -> str:
    return datetime.now(timezone.utc).isoformat()


class BackupService:
    def __init__(self, db: Session):
        self.db = db

    def export_json(self, user: User) -> Dict[str, Any]:
        categories = self.db.query(Category).filter(Category.user_id == user.id).all()
        tags = self.db.query(Tag).filter(Tag.user_id == user.id).all()
        projects = self.db.query(Project).filter(Project.user_id == user.id).all()
        tasks = self.db.query(Task).filter(Task.user_id == user.id).all()

        task_ids = [t.id for t in tasks]
        subtasks = self.db.query(Subtask).filter(Subtask.task_id.in_(task_ids)).all() if task_ids else []

        data = {
            "version": "1.0.0",
            "exported_at": utc_now_str(),
            "user_email": user.email,
            "categories": [
                {"id": c.id, "name": c.name, "color": c.color, "icon": c.icon}
                for c in categories
            ],
            "tags": [
                {"id": t.id, "name": t.name, "color": t.color}
                for t in tags
            ],
            "projects": [
                {
                    "id": p.id,
                    "title": p.title,
                    "description": p.description,
                    "category_id": p.category_id,
                    "color": p.color,
                    "icon": p.icon,
                    "priority": p.priority,
                    "status": p.status,
                    "sort_order": p.sort_order,
                    "is_archived": p.is_archived,
                    "start_date": p.start_date.isoformat() if p.start_date else None,
                    "due_date": p.due_date.isoformat() if p.due_date else None,
                }
                for p in projects
            ],
            "tasks": [
                {
                    "id": t.id,
                    "project_id": t.project_id,
                    "title": t.title,
                    "description": t.description,
                    "priority": t.priority,
                    "status": t.status,
                    "sort_order": t.sort_order,
                    "is_archived": t.is_archived,
                    "start_date": t.start_date.isoformat() if t.start_date else None,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                    "completion_date": t.completion_date.isoformat() if t.completion_date else None,
                    "estimated_minutes": t.estimated_minutes,
                    "actual_minutes": t.actual_minutes,
                    "notes": t.notes,
                }
                for t in tasks
            ],
            "subtasks": [
                {
                    "id": s.id,
                    "task_id": s.task_id,
                    "title": s.title,
                    "is_completed": s.is_completed,
                    "sort_order": s.sort_order,
                }
                for s in subtasks
            ]
        }
        return data

    def export_csv(self, user_id: str) -> str:
        tasks = self.db.query(Task).filter(Task.user_id == user_id).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Task ID", "Title", "Project", "Priority", "Status",
            "Due Date", "Completion Date", "Estimated Minutes", "Actual Minutes", "Notes"
        ])
        for t in tasks:
            writer.writerow([
                t.id,
                t.title,
                t.project.title if t.project else "",
                t.priority,
                t.status,
                t.due_date.isoformat() if t.due_date else "",
                t.completion_date.isoformat() if t.completion_date else "",
                t.estimated_minutes,
                t.actual_minutes,
                t.notes or ""
            ])
        return output.getvalue()

    def restore_json(self, user: User, restore_req: RestoreRequest) -> Dict[str, Any]:
        data = restore_req.backup_data

        if restore_req.merge_strategy == "replace":
            # Delete existing subtasks, tasks, projects, tags, categories
            existing_tasks = self.db.query(Task).filter(Task.user_id == user.id).all()
            for t in existing_tasks:
                self.db.delete(t)
            existing_projects = self.db.query(Project).filter(Project.user_id == user.id).all()
            for p in existing_projects:
                self.db.delete(p)
            self.db.commit()

        # Restore Categories
        cat_id_map = {}
        for c in data.categories:
            existing_c = self.db.query(Category).filter(Category.id == c["id"]).first()
            if not existing_c:
                new_c = Category(
                    id=c["id"],
                    user_id=user.id,
                    name=c["name"],
                    color=c.get("color", "#6366f1"),
                    icon=c.get("icon", "folder")
                )
                self.db.add(new_c)
                cat_id_map[c["id"]] = new_c.id
            else:
                cat_id_map[c["id"]] = existing_c.id
        self.db.commit()

        # Restore Projects
        proj_id_map = {}
        for p in data.projects:
            existing_p = self.db.query(Project).filter(Project.id == p["id"]).first()
            category_id = cat_id_map.get(p.get("category_id"))
            if not existing_p:
                new_p = Project(
                    id=p["id"],
                    user_id=user.id,
                    title=p["title"],
                    description=p.get("description"),
                    category_id=category_id,
                    color=p.get("color", "#6366f1"),
                    icon=p.get("icon", "folder"),
                    priority=p.get("priority", "MEDIUM"),
                    status=p.get("status", "ACTIVE"),
                    sort_order=p.get("sort_order", 0),
                    is_archived=p.get("is_archived", False)
                )
                self.db.add(new_p)
                proj_id_map[p["id"]] = new_p.id
            else:
                proj_id_map[p["id"]] = existing_p.id
        self.db.commit()

        # Restore Tasks
        task_id_map = {}
        for t in data.tasks:
            existing_t = self.db.query(Task).filter(Task.id == t["id"]).first()
            project_id = proj_id_map.get(t.get("project_id"))
            if not existing_t:
                new_t = Task(
                    id=t["id"],
                    user_id=user.id,
                    project_id=project_id,
                    title=t["title"],
                    description=t.get("description"),
                    priority=t.get("priority", "MEDIUM"),
                    status=t.get("status", "PENDING"),
                    sort_order=t.get("sort_order", 0),
                    is_archived=t.get("is_archived", False),
                    estimated_minutes=t.get("estimated_minutes", 0),
                    actual_minutes=t.get("actual_minutes", 0),
                    notes=t.get("notes")
                )
                self.db.add(new_t)
                task_id_map[t["id"]] = new_t.id
            else:
                task_id_map[t["id"]] = existing_t.id
        self.db.commit()

        # Restore Subtasks
        for s in data.subtasks:
            task_id = task_id_map.get(s.get("task_id"))
            if task_id:
                existing_s = self.db.query(Subtask).filter(Subtask.id == s["id"]).first()
                if not existing_s:
                    new_s = Subtask(
                        id=s["id"],
                        task_id=task_id,
                        title=s["title"],
                        is_completed=s.get("is_completed", False),
                        sort_order=s.get("sort_order", 0)
                    )
                    self.db.add(new_s)
        self.db.commit()

        return {
            "status": "success",
            "message": "Data successfully restored",
            "categories_restored": len(data.categories),
            "projects_restored": len(data.projects),
            "tasks_restored": len(data.tasks),
            "subtasks_restored": len(data.subtasks)
        }
