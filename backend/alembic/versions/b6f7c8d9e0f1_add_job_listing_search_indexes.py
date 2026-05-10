"""add job listing search indexes

Revision ID: b6f7c8d9e0f1
Revises: 2659cb436bd9
Create Date: 2026-05-10 18:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'b6f7c8d9e0f1'
down_revision = '2659cb436bd9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_job_listings_deleted_active",
        "job_listings",
        ["is_deleted", "is_active"],
    )
    op.create_index(
        "ix_job_listings_source_api",
        "job_listings",
        ["source_api"],
    )
    op.create_index(
        "ix_job_listings_external_id",
        "job_listings",
        ["external_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_job_listings_external_id", table_name="job_listings")
    op.drop_index("ix_job_listings_source_api", table_name="job_listings")
    op.drop_index("ix_job_listings_deleted_active", table_name="job_listings")
