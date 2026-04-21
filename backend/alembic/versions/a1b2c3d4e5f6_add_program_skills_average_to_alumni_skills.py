"""add program_skills_average to alumni_skills

Revision ID: a1b2c3d4e5f6
Revises: 9522883d1b6b
Create Date: 2026-04-21 12:40:00.000000+08:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9522883d1b6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'alumni_skills',
        sa.Column('program_skills_average', sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('alumni_skills', 'program_skills_average')
