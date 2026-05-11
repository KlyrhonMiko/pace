"""Helpers for creating transaction log entries consistently across write operations."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import or_, text, func
from sqlmodel import Session, select

from models.transaction_logs import TransactionLog
from models.users import User
from services.queries.audit import normalize_actor_ref, stamp_create


def _generate_tl_id(session: Session) -> str:
    """Generate a collision-resistant human-readable transaction log id."""
    for _ in range(10):
        candidate = f"TL-{uuid.uuid4().hex[:8].upper()}"
        exists = session.exec(
            select(TransactionLog.id).where(TransactionLog.tl_id == candidate)
        ).first()
        if not exists:
            return candidate
    raise RuntimeError("Unable to generate a unique transaction log id")


def _normalize_payload(payload: Any) -> Any:
    if payload is None:
        return None
    if hasattr(payload, "model_dump"):
        # Exclude fields whose *values* are raw bytes (e.g. vector_embedding)
        # because they cannot be JSON-serialised.
        exclude_fields: set[str] = set()
        for field_name in getattr(payload, "model_fields", {}):
            try:
                val = getattr(payload, field_name, None)
            except Exception:
                continue
            if isinstance(val, bytes):
                exclude_fields.add(field_name)
        return payload.model_dump(mode="json", exclude=exclude_fields or None)
    return payload


def create_transaction_log(
    session: Session,
    tl_name: str,
    before: Any = None,
    after: Any = None,
    performed_by: str | uuid.UUID | None = None,
) -> None:
    """Create and stage a transaction log record in the current DB transaction."""
    performed_by_ref_id = normalize_actor_ref(performed_by)
    log = TransactionLog(
        tl_id=_generate_tl_id(session),
        tl_name=tl_name,
        before=_normalize_payload(before),
        after=_normalize_payload(after),
        performed_by_ref_id=performed_by_ref_id,
    )
    stamp_create(log, performed_by_ref_id)
    session.add(log)


def get_transaction_logs(
    session: Session,
    skip: int = 0,
    limit: int = 10,
    search: str | None = None,
    action_type: str | None = None,
) -> tuple[list[TransactionLog], int]:
    """Retrieve filtered and paginated transaction logs."""
    logs_stmt = select(TransactionLog).where(TransactionLog.is_deleted == False)
    count_stmt = (
        select(func.count()).select_from(TransactionLog).where(TransactionLog.is_deleted == False)
    )

    if search:
        normalized_search = search.strip().lower()
        search_condition = or_(
            func.lower(TransactionLog.tl_id).contains(normalized_search),
            func.lower(TransactionLog.tl_name).contains(normalized_search),
        )
        logs_stmt = logs_stmt.where(search_condition)
        count_stmt = count_stmt.where(search_condition)

    if action_type:
        normalized_action_type = action_type.strip().lower()
        action_condition = func.lower(TransactionLog.tl_name).contains(normalized_action_type)
        logs_stmt = logs_stmt.where(action_condition)
        count_stmt = count_stmt.where(action_condition)

    logs_stmt = logs_stmt.order_by(text("tl_date DESC")).offset(skip)
    if limit > 0:
        logs_stmt = logs_stmt.limit(limit)

    logs = session.exec(logs_stmt).all()
    total = int(session.exec(count_stmt).one() or 0)
    return logs, total


def lookup_transaction_log_by_id(session: Session, tl_id: str) -> TransactionLog | None:
    """Find a specific transaction log by its human-readable tl_id."""
    return session.exec(
        select(TransactionLog).where(
            (TransactionLog.tl_id == tl_id) & (TransactionLog.is_deleted == False)
        )
    ).first()


def get_user_by_id_ref(session: Session, user_id: uuid.UUID) -> User | None:
    """Helper to resolve a user by internal UUID id."""
    return session.exec(select(User).where(User.id == user_id)).first()


def get_user_by_uuid(session: Session, user_id: uuid.UUID) -> User | None:
    """Backward-compatible alias for callers not yet migrated."""
    return get_user_by_id_ref(session, user_id)
