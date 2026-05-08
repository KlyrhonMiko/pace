"""add_vector_embedding_and_requirements_to_job_listings

Revision ID: 4046144b69c2
Revises: 2e6a594f620c
Create Date: 2026-05-08 22:56:51.242604

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '4046144b69c2'
down_revision: Union[str, Sequence[str], None] = '2e6a594f620c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('job_listings', sa.Column('requirements', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('job_listings', sa.Column('vector_embedding', sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('job_listings', 'vector_embedding')
    op.drop_column('job_listings', 'requirements')
