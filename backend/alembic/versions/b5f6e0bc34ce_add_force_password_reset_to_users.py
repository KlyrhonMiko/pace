"""add force_password_reset to users

Revision ID: b5f6e0bc34ce
Revises: 42984255b49e
Create Date: 2026-04-27 11:02:37.472632

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'b5f6e0bc34ce'
down_revision: Union[str, Sequence[str], None] = '42984255b49e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add force_password_reset column to users table."""
    op.add_column('users', sa.Column('force_password_reset', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    """Remove force_password_reset column from users table."""
    op.drop_column('users', 'force_password_reset')
