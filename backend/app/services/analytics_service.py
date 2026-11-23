from datetime import datetime, timezone, timedelta, date
from typing import List
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.project import Project
from app.schemas.analytics import (
    DashboardStats,
    ProductivityTrendItem,
    PriorityDistributionItem,
    StatusDistributionItem,
    ProjectProgressItem
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_stats(self, user_id: str) -> DashboardStats:
        now = utc_now()
        today = now.date()

        # Projects count
        total_projects = self.db.query(Project).filter(
            Project.user_id == user_id,
            Project.is_archived.is_(False)
        ).count()

        # Tasks counts
        base_task_query = self.db.query(Task).join(
            Project, Task.project_id == Project.id
        ).filter(
            Task.user_id == user_id,
            Task.is_archived.is_(False),
            Project.user_id == user_id,
            Project.is_archived.is_(False)
        )

        total_tasks = base_task_query.count()
        completed_tasks = base_task_query.filter(Task.status == "COMPLETED").count()
        pending_tasks = base_task_query.filter(Task.status == "PENDING").count()
        in_progress_tasks = base_task_query.filter(Task.status == "IN_PROGRESS").count()

        overdue_tasks = base_task_query.filter(
            Task.status.in_(["PENDING", "IN_PROGRESS", "ON_HOLD"]),
            Task.due_date.isnot(None),
            Task.due_date < now
        ).count()

        today_start = datetime(today.year, today.month, today.day, 0, 0, 0, tzinfo=timezone.utc)
        today_end = datetime(today.year, today.month, today.day, 23, 59, 59, tzinfo=timezone.utc)
        today_tasks = base_task_query.filter(
            Task.due_date >= today_start,
            Task.due_date <= today_end
        ).count()

        overall_completion_pct = round((completed_tasks / total_tasks * 100.0), 1) if total_tasks > 0 else 0.0

        # Weekly productivity (past 7 days)
        weekly_trend: List[ProductivityTrendItem] = []
        for i in range(6, -1, -1):
            day_target = today - timedelta(days=i)
            day_start = datetime(day_target.year, day_target.month, day_target.day, 0, 0, 0, tzinfo=timezone.utc)
            day_end = datetime(day_target.year, day_target.month, day_target.day, 23, 59, 59, tzinfo=timezone.utc)

            completed_count = base_task_query.filter(
                Task.completion_date >= day_start,
                Task.completion_date <= day_end
            ).count()

            created_count = base_task_query.filter(
                Task.created_at >= day_start,
                Task.created_at <= day_end
            ).count()

            weekly_trend.append(ProductivityTrendItem(
                date=day_target.strftime("%a %d"),
                completed=completed_count,
                created=created_count
            ))

        # Priority distribution
        priority_items: List[PriorityDistributionItem] = []
        for p in ["HIGH", "MEDIUM", "LOW"]:
            p_count = base_task_query.filter(Task.priority == p).count()
            p_pct = round((p_count / total_tasks * 100.0), 1) if total_tasks > 0 else 0.0
            priority_items.append(PriorityDistributionItem(
                priority=p,
                count=p_count,
                percentage=p_pct
            ))

        # Status distribution
        status_items: List[StatusDistributionItem] = []
        for s in ["PENDING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"]:
            s_count = base_task_query.filter(Task.status == s).count()
            status_items.append(StatusDistributionItem(status=s, count=s_count))

        # Project progress
        projects = self.db.query(Project).filter(
            Project.user_id == user_id,
            Project.is_archived.is_(False)
        ).order_by(Project.sort_order.asc(), Project.created_at.desc()).limit(10).all()

        project_progress_items: List[ProjectProgressItem] = []
        for proj in projects:
            p_total = self.db.query(Task).filter(Task.project_id == proj.id, Task.is_archived.is_(False)).count()
            p_completed = self.db.query(Task).filter(
                Task.project_id == proj.id,
                Task.status == "COMPLETED",
                Task.is_archived.is_(False)
            ).count()
            rate = round((p_completed / p_total * 100.0), 1) if p_total > 0 else 0.0
            project_progress_items.append(ProjectProgressItem(
                project_id=proj.id,
                title=proj.title,
                color=proj.color or "#6366f1",
                total_tasks=p_total,
                completed_tasks=p_completed,
                completion_rate=rate
            ))

        return DashboardStats(
            total_projects=total_projects,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            pending_tasks=pending_tasks,
            in_progress_tasks=in_progress_tasks,
            overdue_tasks=overdue_tasks,
            today_tasks=today_tasks,
            overall_completion_percentage=overall_completion_pct,
            weekly_productivity=weekly_trend,
            priority_distribution=priority_items,
            status_distribution=status_items,
            project_progress=project_progress_items
        )
