"""Helpers for creating transaction log entries consistently across write operations."""

from __future__ import annotations

import uuid
from typing import Any

from sqlmodel import Session, select

from models.transaction_logs import TransactionLog


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
