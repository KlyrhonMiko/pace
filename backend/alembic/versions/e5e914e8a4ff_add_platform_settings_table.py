"""add platform_settings table

Revision ID: e5e914e8a4ff
Revises: c3f1a8b2d9e0
Create Date: 2026-05-02 13:10:13.091359

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'e5e914e8a4ff'
down_revision: Union[str, Sequence[str], None] = 'c3f1a8b2d9e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create platform_settings singleton table and seed the default row."""
    op.create_table(
        'platform_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('maintenance_mode', sa.Boolean(), nullable=False),
        sa.Column('public_registrations', sa.Boolean(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('updated_by', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    # Seed the one-and-only settings row with safe defaults.
    op.execute(
        "INSERT INTO platform_settings (id, maintenance_mode, public_registrations, updated_at) "
        "VALUES (1, false, true, NOW())"
    )


def downgrade() -> None:
    """Drop platform_settings table."""
    op.drop_table('platform_settings')
