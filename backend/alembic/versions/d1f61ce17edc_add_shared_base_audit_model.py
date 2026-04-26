"""add shared base audit model

Revision ID: d1f61ce17edc
Revises: 3713ea26f4f3
Create Date: 2026-04-26 11:14:24.714288

This migration assumes the database was intentionally cleared before the
refactor, with only the `users`, `job_listings`, and `alembic_version`
tables retaining data.
"""

from __future__ import annotations

import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d1f61ce17edc"
down_revision: Union[str, Sequence[str], None] = "3713ea26f4f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


LEGACY_PK_TABLES: dict[str, str] = {
    "alumni": "alumni_code",
    "alumni_resumes": "resume_code",
    "alumni_skills": "skill_code",
    "college_depts": "college_dept_code",
    "courses": "course_code",
    "employers": "employer_id",
    "event_registrations": "registration_code",
    "event_types": "event_type_code",
    "events": "event_code",
    "mentoring_sessions": "session_code",
    "questions": "question_code",
    "skills": "skill_code",
    "skills_list": "sl_code",
    "staff": "staff_code",
    "student_records": "student_code",
    "survey_questions": "survey_question_code",
    "survey_responses": "response_code",
    "surveys": "survey_code",
    "transaction_logs": "tl_code",
    "user_activities": "activity_code",
}


TABLES_WITH_CREATED_BY_ONLY = {
    "alumni",
    "college_depts",
    "courses",
    "event_types",
    "events",
    "mentoring_sessions",
    "questions",
    "skills",
    "staff",
    "student_records",
    "surveys",
}

TABLES_NEED_SOFT_DELETE = {
    "alumni_resumes",
    "alumni_skills",
    "employers",
    "skills_list",
    "transaction_logs",
    "user_activities",
}

TABLES_NEED_CREATED_UPDATED = {
    "event_registrations",
    "skills_list",
    "survey_questions",
    "survey_responses",
    "transaction_logs",
    "user_activities",
}

PREDICTION_TABLES = {
    "alumni_regression_predictions",
    "arima_forecast_results",
    "employability_predictions",
}


def _uuid7() -> uuid.UUID:
    factory = getattr(uuid, "uuid7", uuid.uuid4)
    return factory()


def _backfill_uuid_column(table_name: str, column_name: str = "id") -> None:
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(f'SELECT ctid FROM "{table_name}" WHERE {column_name} IS NULL')
    ).fetchall()
    for row in rows:
        conn.execute(
            sa.text(
                f'UPDATE "{table_name}" SET {column_name} = :value WHERE ctid = :ctid'
            ),
            {"value": _uuid7(), "ctid": row[0]},
        )


def _ensure_id_column(table_name: str) -> None:
    op.add_column(table_name, sa.Column("id", sa.Uuid(), nullable=True))
    _backfill_uuid_column(table_name, "id")
    op.alter_column(table_name, "id", nullable=False)


def _add_created_deleted_columns(table_name: str) -> None:
    op.add_column(table_name, sa.Column("created_by", sa.Uuid(), nullable=True))
    op.add_column(table_name, sa.Column("deleted_by", sa.Uuid(), nullable=True))


def _add_soft_delete_columns(table_name: str) -> None:
    op.add_column(
        table_name,
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(table_name, sa.Column("deleted_at", sa.DateTime(), nullable=True))
    op.alter_column(table_name, "is_deleted", server_default=None)


def _add_created_updated_columns(table_name: str, source_column: str | None = None) -> None:
    op.add_column(table_name, sa.Column("created_at", sa.DateTime(), nullable=True))
    op.add_column(table_name, sa.Column("updated_at", sa.DateTime(), nullable=True))
    if source_column is None:
        op.execute(
            sa.text(
                f'UPDATE "{table_name}" SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP '
                f"WHERE created_at IS NULL OR updated_at IS NULL"
            )
        )
    else:
        op.execute(
            sa.text(
                f'UPDATE "{table_name}" SET created_at = COALESCE(created_at, {source_column}), '
                f'updated_at = COALESCE(updated_at, {source_column}) '
                f"WHERE created_at IS NULL OR updated_at IS NULL"
            )
        )
    op.alter_column(table_name, "created_at", nullable=False)
    op.alter_column(table_name, "updated_at", nullable=False)


def _create_created_deleted_fks(table_name: str) -> None:
    op.create_foreign_key(
        f"fk_{table_name}_created_by_users_id",
        table_name,
        "users",
        ["created_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        f"fk_{table_name}_deleted_by_users_id",
        table_name,
        "users",
        ["deleted_by"],
        ["id"],
        ondelete="SET NULL",
    )


def upgrade() -> None:
    """Upgrade schema."""

    # Users retain data, so backfill the new id column before it becomes the PK.
    _ensure_id_column("users")
    op.create_unique_constraint("uq_users_id", "users", ["id"])
    _add_created_deleted_columns("users")

    # Legacy UUID-key tables can safely swap to the shared id PK because the DB
    # was intentionally cleared before this refactor.
    for table_name, legacy_column in LEGACY_PK_TABLES.items():
        _ensure_id_column(table_name)
        _add_created_deleted_columns(table_name)

    for table_name in TABLES_NEED_SOFT_DELETE:
        _add_soft_delete_columns(table_name)

    _add_created_updated_columns("event_registrations", source_column="registered_at")
    _add_created_updated_columns("skills_list")
    _add_created_updated_columns("survey_questions")
    _add_created_updated_columns("survey_responses", source_column="submitted_at")
    _add_created_updated_columns("transaction_logs", source_column="tl_date")
    op.add_column("user_activities", sa.Column("updated_at", sa.DateTime(), nullable=True))
    op.execute(
        sa.text(
            'UPDATE "user_activities" SET updated_at = created_at WHERE updated_at IS NULL'
        )
    )
    op.alter_column("user_activities", "updated_at", nullable=False)

    # Prediction/history tables already use an id column; they only need the rest
    # of the shared audit fields.
    for table_name in PREDICTION_TABLES:
        _add_created_deleted_columns(table_name)
        op.add_column(table_name, sa.Column("updated_at", sa.DateTime(), nullable=True))
        op.execute(
            sa.text(
                f'UPDATE "{table_name}" SET updated_at = created_at WHERE updated_at IS NULL'
            )
        )
        op.alter_column(table_name, "updated_at", nullable=False)
        _add_soft_delete_columns(table_name)

    # Preserve existing job listings by moving the old integer PK into job_id and
    # introducing the shared UUID id column.
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("job_applications"):
        op.drop_table("job_applications")

    op.drop_constraint("job_listings_pkey", "job_listings", type_="primary")
    op.alter_column(
        "job_listings",
        "id",
        new_column_name="job_id",
        existing_type=sa.INTEGER(),
        existing_nullable=False,
    )
    _ensure_id_column("job_listings")
    op.create_primary_key("job_listings_pkey", "job_listings", ["id"])
    op.create_unique_constraint("uq_job_listings_job_id", "job_listings", ["job_id"])
    _add_created_deleted_columns("job_listings")
    _add_soft_delete_columns("job_listings")

    op.create_table(
        "job_applications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_by", sa.Uuid(), nullable=True),
        sa.Column("application_id", sa.Integer(), nullable=True),
        sa.Column("job_listing_id", sa.Uuid(), nullable=False),
        sa.Column("alumni_code", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("applied_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["job_listing_id"], ["job_listings.id"]),
        sa.ForeignKeyConstraint(["alumni_code"], ["alumni.alumni_code"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_id", name="uq_job_applications_application_id"),
    )
    op.create_index("ix_job_applications_job_listing_id", "job_applications", ["job_listing_id"], unique=False)
    op.alter_column("job_applications", "is_deleted", server_default=None)

    # FKs for the shared created_by / deleted_by audit columns.
    tables_with_audit_fks = set(LEGACY_PK_TABLES) | PREDICTION_TABLES | {"users", "job_listings", "job_applications"}
    for table_name in sorted(tables_with_audit_fks):
        _create_created_deleted_fks(table_name)


def downgrade() -> None:
    """Downgrade schema."""
    raise NotImplementedError(
        "Downgrade is intentionally unsupported for this migration because it "
        "rekeys preserved users/job_listings data and assumes the database was "
        "cleared before applying the refactor."
    )
