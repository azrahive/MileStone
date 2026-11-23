"""cascade project task deletes and remove orphaned tasks

Revision ID: 8d4c2b1f6a90
Revises: c6a9f4e2d17b
Create Date: 2026-11-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8d4c2b1f6a90"
down_revision: Union[str, Sequence[str], None] = "c6a9f4e2d17b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _project_foreign_key_name() -> str:
    foreign_keys = sa.inspect(op.get_bind()).get_foreign_keys("tasks")
    project_foreign_key = next(
        foreign_key
        for foreign_key in foreign_keys
        if foreign_key["constrained_columns"] == ["project_id"]
        and foreign_key["referred_table"] == "projects"
    )
    return project_foreign_key["name"] or "fk_tasks_project_id_projects"


def upgrade() -> None:
    op.execute(
        "DELETE FROM activity_logs "
        "WHERE (entity_type = 'TASK' AND entity_id IN ("
        "SELECT tasks.id FROM tasks LEFT JOIN projects ON projects.id = tasks.project_id "
        "WHERE projects.id IS NULL OR projects.is_archived IS NOT FALSE "
        "OR projects.user_id != tasks.user_id"
        ")) OR (entity_type = 'SUBTASK' AND entity_id IN ("
        "SELECT subtasks.id FROM subtasks "
        "JOIN tasks ON tasks.id = subtasks.task_id "
        "LEFT JOIN projects ON projects.id = tasks.project_id "
        "WHERE projects.id IS NULL OR projects.is_archived IS NOT FALSE "
        "OR projects.user_id != tasks.user_id"
        "))"
    )
    op.execute(
        "DELETE FROM tasks WHERE project_id IS NULL OR NOT EXISTS ("
        "SELECT 1 FROM projects WHERE projects.id = tasks.project_id "
        "AND projects.is_archived IS FALSE AND projects.user_id = tasks.user_id"
        ")"
    )

    foreign_key_name = _project_foreign_key_name()
    with op.batch_alter_table(
        "tasks",
        naming_convention={
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
        }
    ) as batch_op:
        batch_op.drop_constraint(
            foreign_key_name,
            type_="foreignkey"
        )
        batch_op.create_foreign_key(
            "fk_tasks_project_id_projects",
            "projects",
            ["project_id"],
            ["id"],
            ondelete="CASCADE"
        )
        batch_op.alter_column(
            "project_id",
            existing_type=sa.String(length=36),
            nullable=False
        )


def downgrade() -> None:
    foreign_key_name = _project_foreign_key_name()
    with op.batch_alter_table(
        "tasks",
        naming_convention={
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
        }
    ) as batch_op:
        batch_op.drop_constraint(
            foreign_key_name,
            type_="foreignkey"
        )
        batch_op.create_foreign_key(
            "fk_tasks_project_id_projects",
            "projects",
            ["project_id"],
            ["id"],
            ondelete="SET NULL"
        )
        batch_op.alter_column(
            "project_id",
            existing_type=sa.String(length=36),
            nullable=True
        )
