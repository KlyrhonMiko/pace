"""add employer_id to job_listings

Revision ID: 959eaf6822fb
Revises: 5c85fae99dee
Create Date: 2026-04-23 01:37:49.957122

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '959eaf6822fb'
down_revision: Union[str, Sequence[str], None] = '5c85fae99dee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('job_listings', sa.Column('employer_id', sa.Uuid(), nullable=True))
    op.create_index(op.f('ix_job_listings_employer_id'), 'job_listings', ['employer_id'], unique=False)
    op.create_foreign_key(None, 'job_listings', 'employers', ['employer_id'], ['employer_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(None, 'job_listings', type_='foreignkey')
    op.drop_index(op.f('ix_job_listings_employer_id'), table_name='job_listings')
    op.drop_column('job_listings', 'employer_id')
