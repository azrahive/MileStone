from sqlalchemy import and_, not_, or_, select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.activity import ActivityLog
from app.models.project import Project
from app.models.subtask import Subtask
from app.models.task import Task


def cleanup_orphaned_project_tasks(db: Session) -> int:
    tasks = db.query(Task).outerjoin(
        Project, Task.project_id == Project.id
    ).filter(
        or_(
            Project.id.is_(None),
            Project.is_archived.is_not(False),
            Project.user_id != Task.user_id
        )
    ).all()

    if not tasks:
        return 0

    task_ids = [task.id for task in tasks]
    subtask_ids = [
        row[0]
        for row in db.query(Subtask.id).filter(Subtask.task_id.in_(task_ids)).all()
    ]
    entity_ids = task_ids + subtask_ids
    db.query(ActivityLog).filter(
        ActivityLog.entity_type.in_(["TASK", "SUBTASK"]),
        ActivityLog.entity_id.in_(entity_ids)
    ).delete(synchronize_session=False)

    for task in tasks:
        db.delete(task)
    db.commit()
    return len(tasks)


def purge_archived_projects_and_stale_logs(db: Session) -> tuple[int, int, int]:
    archived_projects = db.query(Project).filter(
        or_(
            Project.is_archived.is_not(False),
            Project.status == "ARCHIVED"
        )
    ).all()
    archived_project_ids = [project.id for project in archived_projects]

    deleted_tasks = cleanup_orphaned_project_tasks(db)

    archived_log_conditions = []
    if archived_project_ids:
        archived_task_ids = select(Task.id).where(Task.project_id.in_(archived_project_ids))
        archived_subtask_ids = select(Subtask.id).join(
            Task, Subtask.task_id == Task.id
        ).where(Task.project_id.in_(archived_project_ids))
        archived_log_conditions.extend((
            and_(ActivityLog.entity_type == "PROJECT", ActivityLog.entity_id.in_(archived_project_ids)),
            and_(ActivityLog.entity_type == "TASK", ActivityLog.entity_id.in_(archived_task_ids)),
            and_(ActivityLog.entity_type == "SUBTASK", ActivityLog.entity_id.in_(archived_subtask_ids))
        ))

    stale_entity_conditions = (
        and_(
            ActivityLog.entity_type == "PROJECT",
            not_(select(Project.id).where(Project.id == ActivityLog.entity_id).exists())
        ),
        and_(
            ActivityLog.entity_type == "TASK",
            not_(select(Task.id).where(Task.id == ActivityLog.entity_id).exists())
        ),
        and_(
            ActivityLog.entity_type == "SUBTASK",
            not_(select(Subtask.id).where(Subtask.id == ActivityLog.entity_id).exists())
        )
    )
    deleted_logs = db.query(ActivityLog).filter(
        or_(*(archived_log_conditions + list(stale_entity_conditions)))
    ).delete(synchronize_session=False)

    for project in archived_projects:
        db.delete(project)
    db.commit()
    return len(archived_projects), deleted_tasks, deleted_logs


def main() -> None:
    with SessionLocal() as db:
        deleted_projects, deleted_tasks, deleted_logs = purge_archived_projects_and_stale_logs(db)
    print(
        f"Deleted {deleted_projects} archived projects, {deleted_tasks} orphaned tasks, "
        f"and {deleted_logs} stale activity logs."
    )


if __name__ == "__main__":
    main()
