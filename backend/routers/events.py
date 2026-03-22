import logging
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from sqlmodel import Session
from typing import Optional
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.events import EventCreate, EventUpdate, EventPublic
from models.auth import CurrentUser
from models.response_codes import StandardResponse, ErrorCode, SuccessCode
from models.pagination import PaginationMetadata
from utils.rbac import require_authenticated, require_staff_or_admin
from services.queries.events_queries import (
    generate_event_id,
    get_event_by_id,
    get_active_event_by_id,
    create_event,
    update_event,
    soft_delete_event,
    restore_event,
    update_event_image,
    clear_event_image,
    get_all_events,
)
from services.supabase.supabase_storage import SupabaseStorageService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])
storage_service = SupabaseStorageService()
EVENTS_CACHE_NAMESPACE = "events"
EVENTS_LIST_TTL = 600
EVENTS_DETAIL_TTL = 600


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


@router.post(
    "/",
    response_model=StandardResponse,
    status_code=201,
    dependencies=[Depends(require_staff_or_admin)],
)
def create_event_route(
    event_create: EventCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Create a new event"""
    try:
        event = create_event(
            session,
            event_create,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(EVENTS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_CREATED.value,
            message="Event created successfully",
            data=EventPublic.model_validate(event),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=f"Failed to create event: {e}",
            ).model_dump(mode="json"),
        )


@router.get(
    "/", response_model=StandardResponse, dependencies=[Depends(require_authenticated)]
)
def list_events(
    limit: int = Query(10, ge=0),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    event_type: Optional[str] = Query(
        None, description="Event type ID (e.g., 'ET-000001')"
    ),
    status: str = Query("active", pattern="^(active|upcoming|past)$"),
    include_deleted: bool = Query(False),
    sort_by: str = Query("date", pattern="^(date|attendees|name)$"),
    sort_order: str = Query("asc"),
    session: Session = Depends(get_session),
):
    """List events with pagination, sorting, search, and filtering"""
    try:
        cache_key = generate_cache_key(
            f"{EVENTS_CACHE_NAMESPACE}:list",
            limit=limit,
            offset=offset,
            search=search,
            event_type=event_type,
            status=status,
            include_deleted=include_deleted,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return cache_get_or_set(
            cache_key,
            lambda: _build_events_list_response(
                session,
                limit,
                offset,
                search,
                event_type,
                status,
                include_deleted,
                sort_by,
                sort_order,
            ),
            ttl=EVENTS_LIST_TTL,
        )
    except Exception as e:
        logger.error(f"Error listing events: {e}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=f"Failed to list events: {e}",
            ).model_dump(mode="json"),
        )


@router.get(
    "/{event_id}",
    response_model=StandardResponse,
    dependencies=[Depends(require_authenticated)],
)
def get_event(event_id: str, session: Session = Depends(get_session)):
    """Get a specific event by event_id"""
    try:
        cache_key = generate_cache_key(
            f"{EVENTS_CACHE_NAMESPACE}:detail", event_id=event_id
        )
        return cache_get_or_set(
            cache_key,
            lambda: _build_event_detail_response(session, event_id),
            ttl=EVENTS_DETAIL_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving event: {e}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=f"Failed to retrieve event: {e}",
            ).model_dump(mode="json"),
        )


@router.patch(
    "/{event_id}",
    response_model=StandardResponse,
    dependencies=[Depends(require_staff_or_admin)],
)
def update_event_route(
    event_id: str,
    event_update: EventUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Update an event (partial updates allowed)"""
    try:
        event = get_event_by_id(session, event_id)
        if event.is_deleted:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.EVENT_ALREADY_DELETED.value,
                    message="Cannot update a deleted event",
                ).model_dump(mode="json"),
            )
        updated = update_event(
            session,
            event,
            event_update,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(EVENTS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_UPDATED.value,
            message="Event updated successfully",
            data=EventPublic.model_validate(updated),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=f"Failed to update event: {e}",
            ).model_dump(mode="json"),
        )


@router.delete(
    "/{event_id}",
    response_model=StandardResponse,
    dependencies=[Depends(require_staff_or_admin)],
)
def delete_event(
    event_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Soft delete an event"""
    try:
        event = get_event_by_id(session, event_id)
        if event.is_deleted:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALREADY_DELETED.value,
                    message="Event is already deleted",
                ).model_dump(mode="json"),
            )
        soft_delete_event(session, event, performed_by=current_user.user_code)
        invalidate_cache_namespaces(EVENTS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_DELETED.value,
            message="Event deleted successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event: {e}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=f"Failed to delete event: {e}",
            ).model_dump(mode="json"),
        )


@router.post(
    "/{event_id}/restore",
    response_model=StandardResponse,
    dependencies=[Depends(require_staff_or_admin)],
)
def restore_event_route(
    event_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Restore a soft-deleted event"""
    try:
        event = get_event_by_id(session, event_id)
        if not event.is_deleted:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.EVENT_NOT_DELETED.value,
                    message="Event is not deleted",
                ).model_dump(mode="json"),
            )
        restored = restore_event(
            session,
            event,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(EVENTS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_RESTORED.value,
            message="Event restored successfully",
            data=EventPublic.model_validate(restored),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring event: {e}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=f"Failed to restore event: {e}",
            ).model_dump(mode="json"),
        )


# ---------------------------------------------------------------------------
# Image endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/{event_id}/upload-image",
    response_model=StandardResponse,
    dependencies=[Depends(require_staff_or_admin)],
)
async def upload_event_image(
    event_id: str,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Upload an image for an event (JPEG, PNG, WebP — max 5MB)"""
    try:
        event = get_active_event_by_id(session, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.EVENT_NOT_FOUND.value,
                    message="Event not found",
                ).model_dump(mode="json"),
            )

        success, image_path, error = await storage_service.upload_image(file, event_id)
        if not success:
            if "Invalid file type" in str(error):
                raise HTTPException(
                    status_code=400,
                    detail=StandardResponse(
                        success=False,
                        code=ErrorCode.IMAGE_INVALID_TYPE.value,
                        message=error,
                    ).model_dump(mode="json"),
                )
            elif "too large" in str(error).lower():
                raise HTTPException(
                    status_code=413,
                    detail=StandardResponse(
                        success=False,
                        code=ErrorCode.IMAGE_TOO_LARGE.value,
                        message=error,
                    ).model_dump(mode="json"),
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=StandardResponse(
                        success=False,
                        code=ErrorCode.IMAGE_UPLOAD_FAILED.value,
                        message=error,
                    ).model_dump(mode="json"),
                )

        update_event_image(
            session,
            event,
            image_path,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(EVENTS_CACHE_NAMESPACE)
        image_url = storage_service.get_public_url(image_path)
        return StandardResponse(
            success=True,
            code=SuccessCode.IMAGE_UPLOADED.value,
            message="Image uploaded successfully",
            data={"image_path": image_path, "image_url": image_url},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=f"Failed to upload image: {e}",
            ).model_dump(mode="json"),
        )


@router.delete(
    "/{event_id}/delete-image",
    response_model=StandardResponse,
    dependencies=[Depends(require_staff_or_admin)],
)
async def delete_event_image(
    event_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
):
    """Remove the image from an event"""
    try:
        event = get_event_by_id(session, event_id)
        if not event.image_path:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.IMAGE_NOT_FOUND.value,
                    message="Event has no image",
                ).model_dump(mode="json"),
            )

        success, error = await storage_service.delete_image(event.image_path)
        if not success:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.IMAGE_DELETE_FAILED.value,
                    message=error,
                ).model_dump(mode="json"),
            )

        clear_event_image(session, event, performed_by=current_user.user_code)
        invalidate_cache_namespaces(EVENTS_CACHE_NAMESPACE)
        return StandardResponse(
            success=True,
            code=SuccessCode.IMAGE_DELETED.value,
            message="Image deleted successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting image: {e}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=f"Failed to delete image: {e}",
            ).model_dump(mode="json"),
        )


@router.get(
    "/{event_id}/image-url",
    response_model=StandardResponse,
    dependencies=[Depends(require_authenticated)],
)
def get_event_image_url(event_id: str, session: Session = Depends(get_session)):
    """Get the public URL for an event's image"""
    try:
        cache_key = generate_cache_key(
            f"{EVENTS_CACHE_NAMESPACE}:image_url", event_id=event_id
        )
        return cache_get_or_set(
            cache_key,
            lambda: _build_event_image_url_response(session, event_id),
            ttl=EVENTS_DETAIL_TTL,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting image URL: {e}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT.value,
                message=f"Failed to get image URL: {e}",
            ).model_dump(mode="json"),
        )


def _build_events_list_response(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    event_type: Optional[str],
    status: str,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
) -> StandardResponse:
    events, total = get_all_events(
        session,
        limit,
        offset,
        search,
        event_type,
        status,
        include_deleted,
        sort_by,
        sort_order,
    )
    returned = len(events)
    pagination = PaginationMetadata(
        total=total,
        limit=limit,
        offset=offset,
        returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False,
    )
    return StandardResponse(
        success=True,
        code=SuccessCode.EVENTS_RETRIEVED.value,
        message=f"Retrieved {returned} events",
        data={
            "events": [EventPublic.model_validate(e) for e in events],
            "pagination": pagination,
        },
    )


def _build_event_detail_response(session: Session, event_id: str) -> StandardResponse:
    event = get_active_event_by_id(session, event_id)
    if not event:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.EVENT_NOT_FOUND.value,
                message=f"Event with ID '{event_id}' not found",
            ).model_dump(mode="json"),
        )
    return StandardResponse(
        success=True,
        code=SuccessCode.EVENT_RETRIEVED.value,
        message="Event retrieved successfully",
        data=EventPublic.model_validate(event),
    )


def _build_event_image_url_response(
    session: Session, event_id: str
) -> StandardResponse:
    event = get_event_by_id(session, event_id)
    if not event.image_path:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.IMAGE_NOT_FOUND.value,
                message="Event has no image",
            ).model_dump(mode="json"),
        )
    image_url = storage_service.get_public_url(event.image_path)
    if not image_url:
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.IMAGE_URL_FAILED.value,
                message="Failed to generate image URL",
            ).model_dump(mode="json"),
        )
    return StandardResponse(
        success=True,
        code=SuccessCode.IMAGE_URL_RETRIEVED.value,
        message="Image URL retrieved successfully",
        data={"image_url": image_url},
    )
