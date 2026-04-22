"""add employer to usertype and increase user_id length

Revision ID: 5c85fae99dee
Revises: 28f2409aa5c1
Create Date: 2026-04-23 01:22:06.551658

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '5c85fae99dee'
down_revision: Union[str, Sequence[str], None] = '28f2409aa5c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add EMPLOYER value to usertype enum
    # Note: Postgres ALTER TYPE ... ADD VALUE cannot be rolled back easily in some old versions,
    # but PACE uses modern SQLModel/SQLAlchemy which usually handles this via autocommit or explicit execution.
    op.execute("ALTER TYPE usertype ADD VALUE 'EMPLOYER'")
    
    # Increase user_id length from 12 to 20
    op.alter_column('users', 'user_id',
               existing_type=sa.VARCHAR(length=12),
               type_=sa.VARCHAR(length=20),
               existing_nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Reverting to length 12
    op.alter_column('users', 'user_id',
               existing_type=sa.VARCHAR(length=20),
               type_=sa.VARCHAR(length=12),
               existing_nullable=False)
    
    # Enum removal is complex in Postgres (requires recreating the type/table)
    # Usually skipped unless strictly necessary.
    pass
