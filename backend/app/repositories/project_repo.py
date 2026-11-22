from typing import List, Optional
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        user_id: str,
        include_archived: bool = False,
        search: Optional[str] = None,
        category_id: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: Optional[str] = "created_desc"
    ) -> List[Project]:
        query = self.db.query(Project).filter(Project.user_id == user_id)

        if not include_archived:
            query = query.filter(Project.is_archived.is_(False))

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Project.title.ilike(search_term),
                    Project.description.ilike(search_term)
                )
            )

        if category_id:
            query = query.filter(Project.category_id == category_id)

        if priority:
            query = query.filter(Project.priority == priority.upper())

        if status:
            query = query.filter(Project.status == status.upper())

        # Sorting
        if sort_by == "created_asc":
            query = query.order_by(asc(Project.created_at))
        elif sort_by == "due_asc":
            query = query.order_by(asc(Project.due_date))
        elif sort_by == "due_desc":
            query = query.order_by(desc(Project.due_date))
        elif sort_by == "title_asc":
            query = query.order_by(asc(Project.title))
        elif sort_by == "order_asc":
            query = query.order_by(asc(Project.sort_order), desc(Project.created_at))
        else:
            query = query.order_by(asc(Project.sort_order), desc(Project.created_at))

        return query.all()

    def get_by_id(self, project_id: str, user_id: str) -> Optional[Project]:
        return self.db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == user_id
        ).first()

    def create(self, project_in: ProjectCreate, user_id: str) -> Project:
        project = Project(
            user_id=user_id,
            title=project_in.title.strip(),
            description=project_in.description,
            category_id=project_in.category_id,
            color=project_in.color or "#6366f1",
            icon=project_in.icon or "folder",
            start_date=project_in.start_date,
            due_date=project_in.due_date,
            priority=project_in.priority or "MEDIUM",
            status=project_in.status or "ACTIVE",
            sort_order=project_in.sort_order or 0,
            is_archived=False
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: Project, project_in: ProjectUpdate) -> Project:
        update_data = project_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(project, key, value)
        self.db.commit()
        self.db.refresh(project)
        return project

    def archive(self, project: Project) -> Project:
        project.is_archived = True
        project.status = "ARCHIVED"
        self.db.commit()
        self.db.refresh(project)
        return project

    def restore(self, project: Project) -> Project:
        project.is_archived = False
        project.status = "ACTIVE"
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        self.db.delete(project)
        self.db.commit()
