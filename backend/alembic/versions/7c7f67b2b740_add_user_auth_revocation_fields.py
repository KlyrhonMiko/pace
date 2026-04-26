"""add user auth revocation fields

Revision ID: 7c7f67b2b740
Revises: 3bf46f8938ef
Create Date: 2026-04-26 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "7c7f67b2b740"
down_revision = "3bf46f8938ef"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("auth_revoked_after", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("password_changed_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "password_changed_at")
    op.drop_column("users", "auth_revoked_after")
