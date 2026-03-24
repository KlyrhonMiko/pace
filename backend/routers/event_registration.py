import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import Session
from core.database import get_session
from core.redis import cache_delete, generate_cache_key, invalidate_cache_namespaces
from schemas.events import EventRegistrationResponse
from models.auth import CurrentUser
from models.response_codes import StandardResponse, ErrorCode, SuccessCode
from models.pagination import PaginationMetadata
from utils.rbac import require_authenticated, require_staff_or_admin
from services.queries.events_queries import (
    get_event_by_id, get_active_event_by_id,
    register_user_for_event, unregister_user_from_event, get_event_registrants,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["event-registration"])
ALUMNI_STATS_CACHE_NAMESPACE = "alumni_stats"
ALUMNI_ACTIVITY_CACHE_NAMESPACE = "alumni_activity"
EVENTS_CACHE_NAMESPACE = "events"


def _require_user_code(current_user: CurrentUser) -> str:
    if not current_user.user_code:
        raise HTTPException(
            status_code=401,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.UNAUTHORIZED,
                message="Authenticated user is missing a user_code",
            ).model_dump(),
        )
    return current_user.user_code


@router.post("/{event_id}/register", response_model=StandardResponse)
async def register_for_event(
    event_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Register a user for an event"""
    try:
        event = get_active_event_by_id(session, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=StandardResponse(
                success=False, code=ErrorCode.EVENT_NOT_FOUND, message="Event not found"
            ).model_dump())

        user_code = _require_user_code(current_user)
        register_user_for_event(
            session,
            event,
            user_code,
            performed_by=current_user.user_code,
        )
        # Invalidate stats, activity, and event cache
        cache_key_stats = generate_cache_key(ALUMNI_STATS_CACHE_NAMESPACE, user_code=str(user_code))
        cache_key_activity = generate_cache_key(ALUMNI_ACTIVITY_CACHE_NAMESPACE, user_code=str(user_code))
        cache_delete(cache_key_stats)
        cache_delete(cache_key_activity)
        invalidate_cache_namespaces(EVENTS_CACHE_NAMESPACE)

        return StandardResponse(
            success=True, code=SuccessCode.EVENT_REGISTERED,
            message="Successfully registered for event"
        )
    except ValueError as e:
        msg = str(e)
        if msg == "ALREADY_REGISTERED":
            raise HTTPException(status_code=409, detail=StandardResponse(
                success=False, code=ErrorCode.ALREADY_REGISTERED,
                message="User is already registered for this event"
            ).model_dump())
        if msg == "CAPACITY_FULL":
            raise HTTPException(status_code=409, detail=StandardResponse(
                success=False, code=ErrorCode.EVENT_CAPACITY_FULL,
                message="Event is at full capacity"
            ).model_dump())
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT, message=msg
        ).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering for event: {e}")
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT, message=f"Failed to register: {e}"
        ).model_dump())


@router.delete("/{event_id}/unregister", response_model=StandardResponse)
async def unregister_from_event(
    event_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Unregister a user from an event"""
    try:
        event = get_event_by_id(session, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=StandardResponse(
                success=False, code=ErrorCode.EVENT_NOT_FOUND, message="Event not found"
            ).model_dump())

        user_code = _require_user_code(current_user)
        unregister_user_from_event(
            session,
            event,
            user_code,
            performed_by=current_user.user_code,
        )
        # Invalidate stats, activity, and event cache
        cache_key_stats = generate_cache_key(ALUMNI_STATS_CACHE_NAMESPACE, user_code=str(user_code))
        cache_key_activity = generate_cache_key(ALUMNI_ACTIVITY_CACHE_NAMESPACE, user_code=str(user_code))
        cache_delete(cache_key_stats)
        cache_delete(cache_key_activity)
        invalidate_cache_namespaces(EVENTS_CACHE_NAMESPACE)

        return StandardResponse(
            success=True, code=SuccessCode.EVENT_UNREGISTERED,
            message="Successfully unregistered from event"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=StandardResponse(
            success=False, code=ErrorCode.REGISTRATION_NOT_FOUND,
            message="User is not registered for this event"
        ).model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unregistering from event: {e}")
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT, message=f"Failed to unregister: {e}"
        ).model_dump())


@router.get("/{event_id}/registrants", response_model=StandardResponse)
def get_registrants(
    event_id: str,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Get list of registrants for an event"""
    try:
        event = get_event_by_id(session, event_id)
        if not event:
            raise HTTPException(status_code=404, detail=StandardResponse(
                success=False, code=ErrorCode.EVENT_NOT_FOUND, message="Event not found"
            ).model_dump())

        registrations, total = get_event_registrants(session, event, limit, offset)
        returned = len(registrations)
        pagination = PaginationMetadata(
            total=total, limit=limit, offset=offset, returned=returned,
            has_next=(offset + returned) < total if limit > 0 else False
        )
        return StandardResponse(
            success=True, code=SuccessCode.EVENTS_RETRIEVED,
            message=f"Retrieved {returned} registrants",
            data={
                "registrants": [
                    EventRegistrationResponse.model_validate(registration).model_dump()
                    for registration in registrations
                ],
                "pagination": pagination
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting registrants: {e}")
        raise HTTPException(status_code=400, detail=StandardResponse(
            success=False, code=ErrorCode.INVALID_INPUT, message=f"Failed to get registrants: {e}"
        ).model_dump())
