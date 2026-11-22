from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    projects,
    tasks,
    subtasks,
    categories,
    tags,
    daily_focus,
    calendar,
    overdue,
    reminders,
    recurring,
    activity,
    analytics,
    archive,
    backup,
    settings,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(subtasks.router, prefix="/subtasks", tags=["Subtasks"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(tags.router, prefix="/tags", tags=["Tags"])
api_router.include_router(daily_focus.router, prefix="/daily-focus", tags=["Daily Focus"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
api_router.include_router(overdue.router, prefix="/overdue", tags=["Overdue"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["Reminders"])
api_router.include_router(recurring.router, prefix="/recurring", tags=["Recurring Tasks"])
api_router.include_router(activity.router, prefix="/activity", tags=["Activity History"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Reports"])
api_router.include_router(archive.router, prefix="/archive", tags=["Archive"])
api_router.include_router(backup.router, prefix="/backup", tags=["Backup & Restore"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
