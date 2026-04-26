"""drop legacy key columns use ref ids

Revision ID: 3bf46f8938ef
Revises: d1f61ce17edc
Create Date: 2026-04-26 19:35:00.000000

This revision finalizes the base-id refactor by switching the database to
`id` as the only internal primary key and `*_ref_id` as the only internal
foreign-key naming pattern.

The downgrade is intentionally not lossless because this migration removes
legacy key columns and rewires foreign-key relationships.
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3bf46f8938ef"
down_revision: Union[str, Sequence[str], None] = "d1f61ce17edc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


UUID = sa.Uuid()
DATETIME = sa.DateTime()
BOOLEAN = sa.Boolean()


LEGACY_PK_COLUMNS: dict[str, str] = {
    "users": "user_code",
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


FK_RENAMES: list[dict[str, object]] = [
    {
        "table": "alumni",
        "new": "user_ref_id",
        "old": "user_code",
        "parent": "users",
        "parent_legacy": "user_code",
        "nullable": True,
        "unique": True,
        "ondelete": "SET NULL",
    },
    {
        "table": "alumni",
        "new": "student_ref_id",
        "old": "student_code",
        "parent": "student_records",
        "parent_legacy": "student_code",
        "nullable": True,
        "unique": True,
        "ondelete": "SET NULL",
    },
    {
        "table": "student_records",
        "new": "course_ref_id",
        "old": "course_code",
        "parent": "courses",
        "parent_legacy": "course_code",
        "nullable": True,
        "ondelete": "SET NULL",
    },
    {
        "table": "student_records",
        "new": "alumni_ref_id",
        "old": "alumni_code",
        "parent": "alumni",
        "parent_legacy": "alumni_code",
        "nullable": True,
        "unique": True,
        "ondelete": "SET NULL",
    },
    {
        "table": "courses",
        "new": "college_dept_ref_id",
        "old": "college_dept_code",
        "parent": "college_depts",
        "parent_legacy": "college_dept_code",
        "nullable": True,
        "ondelete": "SET NULL",
    },
    {
        "table": "staff",
        "new": "user_ref_id",
        "old": "user_code",
        "parent": "users",
        "parent_legacy": "user_code",
        "nullable": True,
        "unique": True,
        "ondelete": "SET NULL",
    },
    {
        "table": "staff",
        "new": "college_dept_ref_id",
        "old": "college_dept_code",
        "parent": "college_depts",
        "parent_legacy": "college_dept_code",
        "nullable": True,
        "ondelete": "SET NULL",
    },
    {
        "table": "employers",
        "new": "user_ref_id",
        "old": "user_code",
        "parent": "users",
        "parent_legacy": "user_code",
        "nullable": False,
        "unique": True,
    },
    {
        "table": "events",
        "new": "event_type_ref_id",
        "old": "event_type_code",
        "parent": "event_types",
        "parent_legacy": "event_type_code",
        "nullable": False,
        "index": True,
    },
    {
        "table": "event_registrations",
        "new": "event_ref_id",
        "old": "event_code",
        "parent": "events",
        "parent_legacy": "event_code",
        "nullable": False,
        "index": True,
    },
    {
        "table": "event_registrations",
        "new": "user_ref_id",
        "old": "user_code",
        "parent": "users",
        "parent_legacy": "user_code",
        "nullable": False,
        "index": True,
    },
    {
        "table": "survey_questions",
        "new": "survey_ref_id",
        "old": "survey_code",
        "parent": "surveys",
        "parent_legacy": "survey_code",
        "nullable": False,
        "ondelete": "CASCADE",
    },
    {
        "table": "survey_questions",
        "new": "question_ref_id",
        "old": "question_code",
        "parent": "questions",
        "parent_legacy": "question_code",
        "nullable": False,
        "ondelete": "CASCADE",
    },
    {
        "table": "survey_responses",
        "new": "survey_ref_id",
        "old": "survey_code",
        "parent": "surveys",
        "parent_legacy": "survey_code",
        "nullable": False,
        "ondelete": "CASCADE",
    },
    {
        "table": "survey_responses",
        "new": "alumni_ref_id",
        "old": "alumni_code",
        "parent": "alumni",
        "parent_legacy": "alumni_code",
        "nullable": True,
        "ondelete": "CASCADE",
    },
    {
        "table": "alumni_resumes",
        "new": "alumni_ref_id",
        "old": "alumni_code",
        "parent": "alumni",
        "parent_legacy": "alumni_code",
        "nullable": False,
        "index": True,
        "ondelete": "CASCADE",
    },
    {
        "table": "alumni_skills",
        "new": "alumni_ref_id",
        "old": "alumni_code",
        "parent": "alumni",
        "parent_legacy": "alumni_code",
        "nullable": False,
        "ondelete": "CASCADE",
    },
    {
        "table": "skills",
        "new": "alumni_ref_id",
        "old": "alumni_code",
        "parent": "alumni",
        "parent_legacy": "alumni_code",
        "nullable": True,
        "ondelete": "SET NULL",
    },
    {
        "table": "skills_list",
        "new": "skill_ref_id",
        "old": "skill_code",
        "parent": "skills",
        "parent_legacy": "skill_code",
        "nullable": False,
        "ondelete": "CASCADE",
    },
    {
        "table": "job_listings",
        "new": "employer_ref_id",
        "old": "employer_id",
        "parent": "employers",
        "parent_legacy": "employer_id",
        "nullable": True,
        "index": True,
    },
    {
        "table": "job_applications",
        "new": "job_listing_ref_id",
        "old": "job_listing_id",
        "rename_only": True,
        "nullable": False,
        "index": True,
    },
    {
        "table": "job_applications",
        "new": "alumni_ref_id",
        "old": "alumni_code",
        "parent": "alumni",
        "parent_legacy": "alumni_code",
        "nullable": False,
        "index": True,
    },
    {
        "table": "mentoring_sessions",
        "new": "faculty_user_ref_id",
        "old": "faculty_user_code",
        "parent": "users",
        "parent_legacy": "user_code",
        "nullable": False,
    },
    {
        "table": "mentoring_sessions",
        "new": "alumni_user_ref_id",
        "old": "alumni_user_code",
        "parent": "users",
        "parent_legacy": "user_code",
        "nullable": False,
    },
    {
        "table": "transaction_logs",
        "new": "performed_by_ref_id",
        "old": "performed_by",
        "parent": "users",
        "parent_legacy": "user_code",
        "nullable": True,
    },
    {
        "table": "user_activities",
        "new": "user_ref_id",
        "old": "user_code",
        "parent": "users",
        "parent_legacy": "user_code",
        "nullable": False,
        "index": True,
    },
    {
        "table": "employability_predictions",
        "new": "alumni_ref_id",
        "old": "alumni_code",
        "parent": "alumni",
        "parent_legacy": "alumni_code",
        "nullable": True,
    },
    {
        "table": "alumni_regression_predictions",
        "new": "alumni_ref_id",
        "old": "alumni_code",
        "parent": "alumni",
        "parent_legacy": "alumni_code",
        "nullable": True,
    },
    {
        "table": "arima_forecast_results",
        "new": "requested_by_ref_id",
        "old": "requested_by",
        "parent": "users",
        "parent_legacy": "user_code",
        "nullable": True,
    },
]


def _inspector() -> sa.Inspector:
    return sa.inspect(op.get_bind())


def _has_table(table_name: str) -> bool:
    return _inspector().has_table(table_name)


def _column_names(table_name: str) -> set[str]:
    return {column["name"] for column in _inspector().get_columns(table_name)}


def _has_column(table_name: str, column_name: str) -> bool:
    return column_name in _column_names(table_name)


def _pk_name(table_name: str) -> str | None:
    return _inspector().get_pk_constraint(table_name).get("name")


def _unique_constraints(table_name: str) -> list[dict[str, object]]:
    return _inspector().get_unique_constraints(table_name)


def _indexes(table_name: str) -> list[dict[str, object]]:
    return _inspector().get_indexes(table_name)


def _foreign_keys(table_name: str) -> list[dict[str, object]]:
    return _inspector().get_foreign_keys(table_name)


def _has_unique_on_columns(table_name: str, columns: list[str]) -> bool:
    pk = _inspector().get_pk_constraint(table_name)
    if pk.get("constrained_columns") == columns:
        return True

    for unique in _unique_constraints(table_name):
        if unique.get("column_names") == columns:
            return True

    for index in _indexes(table_name):
        if index.get("column_names") == columns and index.get("unique"):
            return True

    return False


def _create_unique_constraint_if_missing(name: str, table_name: str, columns: list[str]) -> None:
    if not _has_unique_on_columns(table_name, columns):
        op.create_unique_constraint(name, table_name, columns)


def _create_index_if_missing(
    name: str, table_name: str, columns: list[str], *, unique: bool = False
) -> None:
    if any(index.get("name") == name for index in _indexes(table_name)):
        return
    op.create_index(name, table_name, columns, unique=unique)


def _drop_index_if_exists(table_name: str, name: str) -> None:
    if any(index.get("name") == name for index in _indexes(table_name)):
        op.drop_index(name, table_name=table_name)


def _drop_constraint_if_exists(table_name: str, name: str, type_: str) -> None:
    if type_ == "primary":
        if _pk_name(table_name) == name:
            op.drop_constraint(name, table_name, type_="primary")
        return

    if type_ == "unique":
        if any(unique.get("name") == name for unique in _unique_constraints(table_name)):
            op.drop_constraint(name, table_name, type_="unique")
        return

    if type_ == "foreignkey":
        if any(fk.get("name") == name for fk in _foreign_keys(table_name)):
            op.drop_constraint(name, table_name, type_="foreignkey")
        return


def _drop_foreign_keys_for_column(table_name: str, column_name: str) -> None:
    for fk in list(_foreign_keys(table_name)):
        constrained = fk.get("constrained_columns") or []
        if column_name in constrained and fk.get("name"):
            op.drop_constraint(fk["name"], table_name, type_="foreignkey")


def _add_uuid_column_if_missing(table_name: str, column_name: str) -> None:
    if not _has_column(table_name, column_name):
        op.add_column(table_name, sa.Column(column_name, UUID, nullable=True))


def _add_survey_question_soft_delete_if_missing() -> None:
    if not _has_table("survey_questions"):
        return
    if not _has_column("survey_questions", "is_deleted"):
        op.add_column(
            "survey_questions",
            sa.Column("is_deleted", BOOLEAN, nullable=False, server_default=sa.text("false")),
        )
        op.alter_column("survey_questions", "is_deleted", server_default=None)
    if not _has_column("survey_questions", "deleted_at"):
        op.add_column("survey_questions", sa.Column("deleted_at", DATETIME, nullable=True))


def _ensure_parent_ids_are_referenceable() -> None:
    for table_name in {
        "users",
        "alumni",
        "student_records",
        "courses",
        "college_depts",
        "employers",
        "event_types",
        "events",
        "surveys",
        "questions",
        "skills",
    }:
        if _has_table(table_name) and _has_column(table_name, "id"):
            _create_unique_constraint_if_missing(f"uq_{table_name}_id_tmp", table_name, ["id"])


def _backfill_from_parent(
    table_name: str,
    new_column: str,
    old_column: str,
    parent_table: str,
    parent_legacy_column: str,
) -> None:
    if not (_has_column(table_name, new_column) and _has_column(table_name, old_column)):
        return
    if not (_has_table(parent_table) and _has_column(parent_table, "id") and _has_column(parent_table, parent_legacy_column)):
        return

    op.execute(
        sa.text(
            f"""
            UPDATE "{table_name}" AS child
            SET "{new_column}" = parent.id
            FROM "{parent_table}" AS parent
            WHERE child."{new_column}" IS NULL
              AND child."{old_column}" IS NOT NULL
              AND child."{old_column}" = parent."{parent_legacy_column}"
            """
        )
    )


def _rename_column_if_needed(table_name: str, old_column: str, new_column: str) -> None:
    if _has_column(table_name, old_column) and not _has_column(table_name, new_column):
        op.alter_column(
            table_name,
            old_column,
            new_column_name=new_column,
            existing_type=UUID,
        )


def _add_and_backfill_ref_columns() -> None:
    for spec in FK_RENAMES:
        table_name = str(spec["table"])
        if not _has_table(table_name):
            continue

        new_column = str(spec["new"])
        old_column = str(spec["old"])

        if spec.get("rename_only"):
            _drop_foreign_keys_for_column(table_name, old_column)
            _drop_index_if_exists(table_name, f"ix_{table_name}_{old_column}")
            _rename_column_if_needed(table_name, old_column, new_column)
            continue

        _add_uuid_column_if_missing(table_name, new_column)
        _backfill_from_parent(
            table_name,
            new_column,
            old_column,
            str(spec["parent"]),
            str(spec["parent_legacy"]),
        )


def _create_new_fk_constraints() -> None:
    for spec in FK_RENAMES:
        table_name = str(spec["table"])
        new_column = str(spec["new"])
        if not (_has_table(table_name) and _has_column(table_name, new_column)):
            continue

        if spec.get("rename_only"):
            parent_table = "job_listings"
            parent_columns = ["id"]
            ondelete = None
        else:
            parent_table = str(spec["parent"])
            parent_columns = ["id"]
            ondelete = spec.get("ondelete")

        fk_name = f"fk_{table_name}_{new_column}_{parent_table}_id"
        if not any(fk.get("name") == fk_name for fk in _foreign_keys(table_name)):
            op.create_foreign_key(
                fk_name,
                table_name,
                parent_table,
                [new_column],
                parent_columns,
                ondelete=ondelete,
            )

        if spec.get("unique"):
            _create_unique_constraint_if_missing(
                f"uq_{table_name}_{new_column}",
                table_name,
                [new_column],
            )

        if spec.get("index"):
            _create_index_if_missing(
                f"ix_{table_name}_{new_column}",
                table_name,
                [new_column],
            )

    if _has_table("survey_questions"):
        _create_unique_constraint_if_missing(
            "uq_survey_questions_survey_ref_id_question_ref_id",
            "survey_questions",
            ["survey_ref_id", "question_ref_id"],
        )
        _create_unique_constraint_if_missing(
            "uq_survey_questions_survey_ref_id_order_index",
            "survey_questions",
            ["survey_ref_id", "order_index"],
        )


def _enforce_new_nullability() -> None:
    required_columns = {
        ("employers", "user_ref_id"),
        ("events", "event_type_ref_id"),
        ("event_registrations", "event_ref_id"),
        ("event_registrations", "user_ref_id"),
        ("survey_questions", "survey_ref_id"),
        ("survey_questions", "question_ref_id"),
        ("survey_responses", "survey_ref_id"),
        ("alumni_resumes", "alumni_ref_id"),
        ("alumni_skills", "alumni_ref_id"),
        ("skills_list", "skill_ref_id"),
        ("job_applications", "job_listing_ref_id"),
        ("job_applications", "alumni_ref_id"),
        ("mentoring_sessions", "faculty_user_ref_id"),
        ("mentoring_sessions", "alumni_user_ref_id"),
        ("user_activities", "user_ref_id"),
    }

    for table_name, column_name in required_columns:
        if _has_table(table_name) and _has_column(table_name, column_name):
            op.alter_column(
                table_name,
                column_name,
                existing_type=UUID,
                nullable=False,
            )


def _drop_legacy_fk_columns() -> None:
    legacy_child_columns = [
        ("alumni", "user_code"),
        ("alumni", "student_code"),
        ("student_records", "course_code"),
        ("student_records", "alumni_code"),
        ("courses", "college_dept_code"),
        ("staff", "user_code"),
        ("staff", "college_dept_code"),
        ("employers", "user_code"),
        ("events", "event_type_code"),
        ("event_registrations", "event_code"),
        ("event_registrations", "user_code"),
        ("survey_questions", "survey_code"),
        ("survey_questions", "question_code"),
        ("survey_responses", "survey_code"),
        ("survey_responses", "alumni_code"),
        ("alumni_resumes", "alumni_code"),
        ("alumni_skills", "alumni_code"),
        ("skills", "alumni_code"),
        ("skills_list", "skill_code"),
        ("job_listings", "employer_id"),
        ("job_applications", "alumni_code"),
        ("mentoring_sessions", "faculty_user_code"),
        ("mentoring_sessions", "alumni_user_code"),
        ("transaction_logs", "performed_by"),
        ("user_activities", "user_code"),
        ("employability_predictions", "alumni_code"),
        ("alumni_regression_predictions", "alumni_code"),
        ("arima_forecast_results", "requested_by"),
    ]

    for table_name, column_name in legacy_child_columns:
        if not (_has_table(table_name) and _has_column(table_name, column_name)):
            continue
        _drop_foreign_keys_for_column(table_name, column_name)
        op.drop_column(table_name, column_name)


def _drop_job_compatibility_columns() -> None:
    if _has_table("job_listings") and _has_column("job_listings", "job_id"):
        op.drop_column("job_listings", "job_id")

    if _has_table("job_applications") and _has_column("job_applications", "application_id"):
        op.drop_column("job_applications", "application_id")


def _switch_primary_keys_to_id() -> None:
    for table_name, legacy_column in LEGACY_PK_COLUMNS.items():
        if not (_has_table(table_name) and _has_column(table_name, "id")):
            continue

        pk_name = _pk_name(table_name)
        if pk_name and pk_name != f"{table_name}_pkey":
            op.drop_constraint(pk_name, table_name, type_="primary")
        elif pk_name == f"{table_name}_pkey":
            op.drop_constraint(f"{table_name}_pkey", table_name, type_="primary")

        if not _has_unique_on_columns(table_name, ["id"]):
            _create_unique_constraint_if_missing(f"uq_{table_name}_id_tmp", table_name, ["id"])

        op.create_primary_key(f"{table_name}_pkey", table_name, ["id"])

        if _has_column(table_name, legacy_column):
            op.drop_column(table_name, legacy_column)


def upgrade() -> None:
    """Upgrade schema."""

    _add_survey_question_soft_delete_if_missing()
    _ensure_parent_ids_are_referenceable()
    _add_and_backfill_ref_columns()
    _create_new_fk_constraints()
    _enforce_new_nullability()
    _drop_legacy_fk_columns()
    _drop_job_compatibility_columns()
    _switch_primary_keys_to_id()


def downgrade() -> None:
    """Downgrade schema."""

    raise NotImplementedError(
        "Downgrade is intentionally unsupported because this migration removes "
        "legacy key columns and cannot restore their original values losslessly."
    )
