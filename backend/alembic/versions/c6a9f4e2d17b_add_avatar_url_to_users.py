"""add avatar_url to users

Revision ID: c6a9f4e2d17b
Revises: 3b360875023e
Create Date: 2026-11-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c6a9f4e2d17b"
down_revision: Union[str, Sequence[str], None] = "3b360875023e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
