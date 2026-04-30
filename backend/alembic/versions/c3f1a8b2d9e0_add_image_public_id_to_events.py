"""add image_public_id to events

Revision ID: c3f1a8b2d9e0
Revises: 311e7e90fd7b
Create Date: 2026-04-30 21:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3f1a8b2d9e0'
down_revision = 'c1dc84011e6f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'events',
        sa.Column('image_public_id', sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('events', 'image_public_id')
