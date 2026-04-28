"""add missing activity types to activitytype enum

Revision ID: c1dc84011e6f
Revises: bdaecac698e8
Create Date: 2026-04-28 22:19:27.917358

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c1dc84011e6f'
down_revision: Union[str, Sequence[str], None] = 'bdaecac698e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE activitytype ADD VALUE IF NOT EXISTS 'UPDATE_COMPANY_PROFILE'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres doesn't support removing values from an enum type easily.
    pass
