"""Helpers for creating transaction log entries consistently across write operations."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import or_, text, func
from sqlmodel import Session, select

from models.transaction_logs import TransactionLog
from models.users import User


def _generate_tl_id(session: Session) -> str:
    """Generate next transaction log ID in TL-XXXXXX format."""
    existing_ids = session.exec(select(TransactionLog.tl_id)).all()
    last_id = max(existing_ids) if existing_ids else None
    if last_id:
        try:
            parts = last_id.split("-")
            next_num = int(parts[1]) + 1 if len(parts) >= 2 else 1
        except (ValueError, IndexError):
            next_num = 1
    else:
        next_num = 1
    return f"TL-{next_num:06d}"


def _normalize_payload(payload: Any) -> Any:
    if payload is None:
        return None
    if hasattr(payload, "model_dump"):
        return payload.model_dump(mode="json")
    return payload


def _normalize_performed_by(performed_by: str | uuid.UUID | None) -> uuid.UUID | None:
    if performed_by is None:
        return None
    if isinstance(performed_by, uuid.UUID):
        return performed_by
    try:
        return uuid.UUID(str(performed_by))
    except (ValueError, TypeError):
        return None


def create_transaction_log(
    session: Session,
    tl_name: str,
    before: Any = None,
    after: Any = None,
    performed_by: str | uuid.UUID | None = None,
) -> None:
    """Create and stage a transaction log record in the current DB transaction."""
    log = TransactionLog(
        tl_id=_generate_tl_id(session),
        tl_name=tl_name,
        before=_normalize_payload(before),
        after=_normalize_payload(after),
        performed_by=_normalize_performed_by(performed_by),
    )
    session.add(log)


def get_transaction_logs(
    session: Session,
    skip: int = 0,
    limit: int = 10,
    search: str | None = None,
    action_type: str | None = None,
) -> tuple[list[TransactionLog], int]:
    """Retrieve filtered and paginated transaction logs."""
    logs_stmt = select(TransactionLog)
    count_stmt = select(func.count()).select_from(TransactionLog)

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
        select(TransactionLog).where(TransactionLog.tl_id == tl_id)
    ).first()


def get_user_by_uuid(session: Session, user_uuid: uuid.UUID) -> User | None:
    """Helper to resolve a user by their UUID code."""
    return session.get(User, user_uuid)
