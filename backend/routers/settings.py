"""Platform settings router — DB-persisted flags with Redis read cache.

Storage hierarchy:
  1. DB (platform_settings table, id=1)  ← source of truth, survives restarts
  2. Redis (key: platform_settings:*)    ← 30-second read cache, optional
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from core.database import get_session
from core.redis import redis_client
from models.auth import CurrentUser
from models.platform_settings import PlatformSettings
from models.response_codes import StandardResponse, SuccessCode, ErrorCode
from utils.rbac import require_admin
from utils.timezone import get_current_time_gmt8

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])

_CACHE_TTL = 30  # seconds — short enough to reflect changes quickly


# ── Cache helpers ─────────────────────────────────────────────────────────────

def _cache_get(key: str) -> Optional[str]:
    try:
        if redis_client:
            return redis_client.get(key)
    except Exception as exc:
        logger.debug("Redis read miss for '%s': %s", key, exc)
    return None


def _cache_set(key: str, value: str) -> None:
    try:
        if redis_client:
            redis_client.setex(key, _CACHE_TTL, value)
    except Exception as exc:
        logger.debug("Redis write failed for '%s': %s", key, exc)


def _cache_delete(*keys: str) -> None:
    try:
        if redis_client and keys:
            redis_client.delete(*keys)
    except Exception as exc:
        logger.debug("Redis delete failed: %s", exc)


# ── DB helpers ────────────────────────────────────────────────────────────────

_CACHE_KEY = "platform_settings:row"


def _get_or_create_settings(session: Session) -> PlatformSettings:
    """Return the singleton settings row, creating it if missing."""
    row = session.get(PlatformSettings, 1)
    if row is None:
        row = PlatformSettings(id=1, maintenance_mode=False, public_registrations=True)
        session.add(row)
        session.commit()
        session.refresh(row)
    return row


def _read_flags_cached(session: Session) -> dict:
    """Read flags from Redis if available, otherwise hit the DB."""
    cached_maintenance = _cache_get("platform_settings:maintenance_mode")
    cached_reg = _cache_get("platform_settings:public_registrations")

    if cached_maintenance is not None and cached_reg is not None:
        return {
            "maintenance_mode": cached_maintenance == "1",
            "public_registrations": cached_reg == "1",
        }

    row = _get_or_create_settings(session)
    # Populate cache
    _cache_set("platform_settings:maintenance_mode", "1" if row.maintenance_mode else "0")
    _cache_set("platform_settings:public_registrations", "1" if row.public_registrations else "0")
    return {
        "maintenance_mode": row.maintenance_mode,
        "public_registrations": row.public_registrations,
    }


# ── Request / Response models ─────────────────────────────────────────────────

class PlatformSettingsPatch(BaseModel):
    maintenance_mode: Optional[bool] = None
    public_registrations: Optional[bool] = None


# ── Public endpoint (no auth) ─────────────────────────────────────────────────

@router.get("/platform/public", response_model=StandardResponse)
def get_platform_settings_public(session: Session = Depends(get_session)):
    """No-auth endpoint used by the frontend Navbar to check maintenance/registration flags."""
    return StandardResponse(
        success=True,
        code=SuccessCode.USER_RETRIEVED.value,
        message="Platform settings retrieved",
        data=_read_flags_cached(session),
    )


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/platform", response_model=StandardResponse)
def get_platform_settings(
    session: Session = Depends(get_session),
    _current_user: CurrentUser = Depends(require_admin),
):
    """Admin: return current platform configuration flags."""
    return StandardResponse(
        success=True,
        code=SuccessCode.USER_RETRIEVED.value,
        message="Platform settings retrieved",
        data=_read_flags_cached(session),
    )


@router.patch("/platform", response_model=StandardResponse)
def update_platform_settings(
    payload: PlatformSettingsPatch,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Admin: update one or both platform configuration flags. Persisted to DB."""
    if payload.maintenance_mode is None and payload.public_registrations is None:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message="At least one field must be provided.",
            ).model_dump(mode="json"),
        )

    row = _get_or_create_settings(session)

    if payload.maintenance_mode is not None:
        row.maintenance_mode = payload.maintenance_mode
        logger.info("Admin %s set maintenance_mode=%s", current_user.user_id, payload.maintenance_mode)

    if payload.public_registrations is not None:
        row.public_registrations = payload.public_registrations
        logger.info("Admin %s set public_registrations=%s", current_user.user_id, payload.public_registrations)

    row.updated_at = get_current_time_gmt8()
    row.updated_by = current_user.user_id
    session.add(row)
    session.commit()
    session.refresh(row)

    # Bust the cache immediately so the next read reflects the new value
    _cache_delete("platform_settings:maintenance_mode", "platform_settings:public_registrations")

    return StandardResponse(
        success=True,
        code=SuccessCode.USER_UPDATED.value,
        message="Platform settings updated",
        data={
            "maintenance_mode": row.maintenance_mode,
            "public_registrations": row.public_registrations,
        },
    )
