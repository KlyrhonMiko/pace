from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from sqlalchemy.exc import IntegrityError
from core.database import get_session
from core.redis import cache_get_or_set, generate_cache_key, invalidate_cache_namespaces
from schemas.event_types import EventTypeCreate, EventTypeUpdate, EventTypePublic
from models.response_codes import ErrorCode, SuccessCode, StandardResponse
from models.auth import CurrentUser
from utils.rbac import require_admin, require_authenticated
from utils.logging import log_integrity_error
from services.queries.event_types_queries import (
    get_event_type_by_id,
    get_event_type_by_id_any,
    create_event_type,
    update_event_type,
    soft_delete_event_type,
    restore_event_type,
    get_all_event_types,
)

router = APIRouter(prefix="/event-types", tags=["event-types"])
EVENT_TYPES_CACHE_NAMESPACE = "event_types"
EVENT_TYPES_LIST_TTL = 3600
EVENT_TYPES_DETAIL_TTL = 3600


@router.post("/")
def create_event_type_route(
    data: EventTypeCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Create a new event type"""
    try:
        event_type = create_event_type(
            session,
            data,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(EVENT_TYPES_CACHE_NAMESPACE, "events")
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_TYPE_CREATED.value,
            message="Event type created successfully",
            data=EventTypePublic.model_validate(event_type),
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "event_name" in error_str:
            code = ErrorCode.DUPLICATE_EVENT_TYPE_NAME.value
            msg = "An event type with this name already exists"
        else:
            code = ErrorCode.INVALID_INPUT.value
            msg = "Failed to create event type due to a constraint violation"
        log_integrity_error("event_types", "create_event_type", code, msg, str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(success=False, code=code, message=msg).model_dump(
                mode="json"
            ),
        )


@router.get("/")
def list_event_types_route(
    search: str | None = Query(None, description="Search by event name"),
    include_deleted: bool = Query(False, description="Include soft-deleted types"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("asc", description="Sort order (asc/desc)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Items to skip"),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """List all event types with pagination and optional filtering"""
    cache_key = generate_cache_key(
        f"{EVENT_TYPES_CACHE_NAMESPACE}:list",
        search=search,
        include_deleted=include_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset,
    )

    return cache_get_or_set(
        cache_key,
        lambda: _build_event_types_list_response(
            session=session,
            search=search,
            include_deleted=include_deleted,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
        ),
        ttl=EVENT_TYPES_LIST_TTL,
    )


@router.get("/{event_type_id}")
def get_event_type_route(
    event_type_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """Retrieve a single event type by ID"""
    cache_key = generate_cache_key(f"{EVENT_TYPES_CACHE_NAMESPACE}:detail", event_type_id=event_type_id)
    return cache_get_or_set(
        cache_key,
        lambda: _build_event_type_detail_response(session, event_type_id),
        ttl=EVENT_TYPES_DETAIL_TTL,
    )


@router.patch("/{event_type_id}")
def update_event_type_route(
    event_type_id: str,
    data: EventTypeUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Update an event type"""
    event_type = get_event_type_by_id(session, event_type_id)
    if not event_type:
        return StandardResponse(
            success=False,
            code=ErrorCode.EVENT_TYPE_NOT_FOUND.value,
            message="Event type not found",
            data=None,
        )

    try:
        updated_event_type = update_event_type(
            session,
            event_type,
            data,
            performed_by=current_user.user_code,
        )
        invalidate_cache_namespaces(EVENT_TYPES_CACHE_NAMESPACE, "events")
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_TYPE_UPDATED.value,
            message="Event type updated successfully",
            data=EventTypePublic.model_validate(updated_event_type),
        )
    except IntegrityError as e:
        session.rollback()
        error_str = str(e).lower()
        if "event_name" in error_str:
            code = ErrorCode.DUPLICATE_EVENT_TYPE_NAME.value
            msg = "An event type with this name already exists"
        else:
            code = ErrorCode.INVALID_INPUT.value
            msg = "Failed to update event type due to a constraint violation"
        log_integrity_error("event_types", "update_event_type", code, msg, str(e))
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(success=False, code=code, message=msg).model_dump(
                mode="json"
            ),
        )


@router.delete("/{event_type_id}")
def delete_event_type_route(
    event_type_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Soft-delete an event type"""
    event_type = get_event_type_by_id(session, event_type_id)
    if not event_type:
        return StandardResponse(
            success=False,
            code=ErrorCode.EVENT_TYPE_NOT_FOUND.value,
            message="Event type not found",
            data=None,
        )

    soft_delete_event_type(session, event_type, performed_by=current_user.user_code)
    invalidate_cache_namespaces(EVENT_TYPES_CACHE_NAMESPACE, "events")
    return StandardResponse(
        success=True,
        code=SuccessCode.EVENT_TYPE_DELETED.value,
        message="Event type deleted successfully",
        data=None,
    )


@router.post("/{event_type_id}/restore")
def restore_event_type_route(
    event_type_id: str,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin),
):
    """Restore a soft-deleted event type"""
    event_type = get_event_type_by_id_any(session, event_type_id)
    if not event_type:
        return StandardResponse(
            success=False,
            code=ErrorCode.EVENT_TYPE_NOT_FOUND.value,
            message="Event type not found",
            data=None,
        )

    if not event_type.is_deleted:
        return StandardResponse(
            success=False,
            code=ErrorCode.EVENT_TYPE_NOT_DELETED.value,
            message="Event type is not deleted",
            data=None,
        )

    restored_event_type = restore_event_type(
        session,
        event_type,
        performed_by=current_user.user_code,
    )
    invalidate_cache_namespaces(EVENT_TYPES_CACHE_NAMESPACE, "events")
    return StandardResponse(
        success=True,
        code=SuccessCode.EVENT_TYPE_RESTORED.value,
        message="Event type restored successfully",
        data=EventTypePublic.model_validate(restored_event_type),
    )


def _build_event_types_list_response(
    session: Session,
    search: str | None,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
    limit: int,
    offset: int,
) -> StandardResponse:
    items, metadata = get_all_event_types(
        session,
        search=search,
        include_deleted=include_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset,
    )
    data = [EventTypePublic.model_validate(item) for item in items]
    returned = len(data)
    return StandardResponse(
        success=True,
        code=SuccessCode.EVENT_TYPES_RETRIEVED.value,
        message=f"Retrieved {returned} event types",
        data={"event_types": data, "pagination": metadata},
    )


def _build_event_type_detail_response(
    session: Session,
    event_type_id: str,
) -> StandardResponse:
    event_type = get_event_type_by_id(session, event_type_id)
    if not event_type:
        return StandardResponse(
            success=False,
            code=ErrorCode.EVENT_TYPE_NOT_FOUND.value,
            message="Event type not found",
            data=None,
        )

    return StandardResponse(
        success=True,
        code=SuccessCode.EVENT_TYPE_RETRIEVED.value,
        message="Event type retrieved successfully",
        data=EventTypePublic.model_validate(event_type),
    )
