from __future__ import annotations

import uuid
from typing import Any

from utils.timezone import get_current_time_gmt8


def normalize_actor_ref(actor_ref: str | uuid.UUID | None) -> uuid.UUID | None:
    if actor_ref is None:
        return None
    if isinstance(actor_ref, uuid.UUID):
        return actor_ref
    try:
        return uuid.UUID(str(actor_ref))
    except (TypeError, ValueError):
        return None


def stamp_create(instance: Any, actor_ref: str | uuid.UUID | None = None) -> uuid.UUID | None:
    now = get_current_time_gmt8()
    normalized_actor = normalize_actor_ref(actor_ref)

    if hasattr(instance, "created_at") and getattr(instance, "created_at", None) is None:
        setattr(instance, "created_at", now)
    if hasattr(instance, "updated_at") and getattr(instance, "updated_at", None) is None:
        setattr(instance, "updated_at", now)
    if (
        normalized_actor is not None
        and hasattr(instance, "created_by")
        and getattr(instance, "created_by", None) is None
    ):
        setattr(instance, "created_by", normalized_actor)
    if hasattr(instance, "is_deleted") and getattr(instance, "is_deleted", None) is None:
        setattr(instance, "is_deleted", False)
    return normalized_actor


def stamp_update(instance: Any) -> None:
    if hasattr(instance, "updated_at"):
        setattr(instance, "updated_at", get_current_time_gmt8())


def stamp_soft_delete(
    instance: Any, actor_ref: str | uuid.UUID | None = None
) -> uuid.UUID | None:
    now = get_current_time_gmt8()
    normalized_actor = normalize_actor_ref(actor_ref)

    if hasattr(instance, "is_deleted"):
        setattr(instance, "is_deleted", True)
    if hasattr(instance, "deleted_at"):
        setattr(instance, "deleted_at", now)
    if hasattr(instance, "deleted_by"):
        setattr(instance, "deleted_by", normalized_actor)
    if hasattr(instance, "updated_at"):
        setattr(instance, "updated_at", now)
    return normalized_actor


def stamp_restore(instance: Any) -> None:
    now = get_current_time_gmt8()

    if hasattr(instance, "is_deleted"):
        setattr(instance, "is_deleted", False)
    if hasattr(instance, "deleted_at"):
        setattr(instance, "deleted_at", None)
    if hasattr(instance, "deleted_by"):
        setattr(instance, "deleted_by", None)
    if hasattr(instance, "updated_at"):
        setattr(instance, "updated_at", now)
