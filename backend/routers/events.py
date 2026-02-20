from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from sqlmodel import Session, select, func
from datetime import datetime, timezone
from typing import Optional, List
import logging

from core.database import get_session
from models.events import Event, EventCreate, EventUpdate, EventPublic, EventType
from models.response_codes import StandardResponse, ErrorCode, SuccessCode
from models.pagination import PaginationMetadata
from utils.timezone import get_current_time_gmt8, GMT8
from services.supabase.supabase_storage import SupabaseStorageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["events"])
storage_service = SupabaseStorageService()


def convert_to_gmt8(dt: datetime) -> datetime:
    """Convert any datetime to GMT+8 timezone"""
    if dt is None:
        return None
    
    # If naive datetime, assume it's UTC and localize it
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    # Convert to GMT+8
    return dt.astimezone(GMT8)


def get_event_or_404(session: Session, event_id: str) -> Event:
    """Get event by event_id or raise 404"""
    event = session.exec(select(Event).where(Event.event_id == event_id)).first()
    if not event:
        raise HTTPException(
            status_code=404,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.EVENT_NOT_FOUND,
                message=f"Event with ID '{event_id}' not found"
            ).model_dump()
        )
    return event


# ==================== Single CRUD Endpoints ====================

@router.post(
    "/",
    response_model=StandardResponse,
    status_code=201,
    summary="Create a new event",
    description="Create a single event with all required information"
)
def create_event(
    event_create: EventCreate,
    session: Session = Depends(get_session)
):
    """
    Create a new event
    
    - **event_id**: Unique event identifier (required)
    - **name**: Event name (required)
    - **description**: Event description (required)
    - **event_type**: Type of event (CAREER_FAIR, WORKSHOP, SEMINAR, NETWORKING, OTHER)
    - **date**: Event date/time (required)
    - **time_start**: Event start time (required)
    - **time_end**: Event end time (required)
    - **location**: Event location (required)
    - **capacity**: Event capacity in attendees (required, > 0)
    """
    try:
        # Check for duplicate event_id
        existing = session.exec(select(Event).where(Event.event_id == event_create.event_id)).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.DUPLICATE_EVENT_ID,
                    message=f"Event with ID '{event_create.event_id}' already exists"
                ).model_dump()
            )
        
        # Create event with timezone conversion
        event_data = event_create.model_dump()
        # Convert event date to GMT+8
        if event_data.get('date'):
            event_data['date'] = convert_to_gmt8(event_data['date'])
        
        event = Event(**event_data)
        session.add(event)
        session.commit()
        session.refresh(event)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_CREATED,
            message="Event created successfully",
            data=EventPublic.model_validate(event)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating event: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to create event: {str(e)}"
            ).model_dump()
        )


@router.get(
    "/",
    response_model=StandardResponse,
    summary="List all events",
    description="Get events with pagination, sorting, search, and filtering"
)
def list_events(
    limit: int = Query(10, ge=0, description="Records per page (0 = all records)"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    search: str = Query(None, description="Search by event name or location"),
    event_type: Optional[EventType] = Query(None, description="Filter by event type"),
    status: str = Query("active", pattern="^(active|upcoming|past)$", description="Filter by status (default active)"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    sort_by: str = Query("date", pattern="^(date|attendees|name)$", description="Sort by field"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session)
):
    """
    List events with pagination, sorting, search, and filtering
    """
    try:
        now = get_current_time_gmt8()
        
        # Build query
        query = select(Event) if include_deleted else select(Event).where(Event.is_deleted == False)
        
        # Apply search filter
        if search:
            search_like = f"%{search}%"
            query = query.where(
                (Event.name.ilike(search_like)) | 
                (Event.location.ilike(search_like)) |
                (Event.description.ilike(search_like))
            )
        
        # Apply status filter
        if status == "upcoming":
            query = query.where(Event.date > now)
        elif status == "past":
            query = query.where(Event.date < now)
        # "active" doesn't filter by date, just relies on is_deleted == False (handled above)
        
        # Apply type filter
        if event_type:
            query = query.where(Event.event_type == event_type)
            
        # Get total count after filters
        count_query = select(func.count(Event.event_code)) if include_deleted else select(func.count(Event.event_code)).where(Event.is_deleted == False)
        
        # Apply the same filters to the count query to get the correct total
        if search:
            count_query = count_query.where(
                (Event.name.ilike(search_like)) | 
                (Event.location.ilike(search_like)) |
                (Event.description.ilike(search_like))
            )
        if status == "upcoming":
            count_query = count_query.where(Event.date > now)
        elif status == "past":
            count_query = count_query.where(Event.date < now)
        if event_type:
            count_query = count_query.where(Event.event_type == event_type)
            
        total = session.exec(count_query).one()
        
        # Apply sorting
        sort_order_desc = sort_order.lower() == "desc"
        if sort_by == "attendees":
            query = query.order_by(Event.attendees.desc() if sort_order_desc else Event.attendees.asc())
        elif sort_by == "name":
            query = query.order_by(Event.name.desc() if sort_order_desc else Event.name.asc())
        else: # date
            query = query.order_by(Event.date.desc() if sort_order_desc else Event.date.asc())
        
        # Apply pagination
        if limit > 0:
            query = query.offset(offset).limit(limit)
            
        events = session.exec(query).all()
        
        # Calculate pagination metadata
        returned = len(events)
        has_next = (offset + returned) < total if limit > 0 else False
        
        pagination = PaginationMetadata(
            total=total,
            limit=limit,
            offset=offset,
            returned=returned,
            has_next=has_next
        )
        
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENTS_RETRIEVED,
            message=f"Retrieved {returned} events",
            data={
                "events": [EventPublic.model_validate(e) for e in events],
                "pagination": pagination
            }
        )
    except Exception as e:
        logger.error(f"Error listing events: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to list events: {str(e)}"
            ).model_dump()
        )


@router.get(
    "/{event_id}",
    response_model=StandardResponse,
    summary="Get event details",
    description="Retrieve details of a specific event"
)
def get_event(event_id: str, session: Session = Depends(get_session)):
    """Get a specific event by event_id"""
    try:
        event = get_event_or_404(session, event_id)
        
        # Don't return deleted events
        if event.is_deleted:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.EVENT_NOT_FOUND,
                    message=f"Event with ID '{event_id}' not found"
                ).model_dump()
            )
        
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_RETRIEVED,
            message="Event retrieved successfully",
            data=EventPublic.model_validate(event)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving event: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to retrieve event: {str(e)}"
            ).model_dump()
        )


@router.patch(
    "/{event_id}",
    response_model=StandardResponse,
    summary="Update event",
    description="Update details of a specific event (partial updates allowed)"
)
def update_event(
    event_id: str,
    event_update: EventUpdate,
    session: Session = Depends(get_session)
):
    """
    Update an event
    
    All fields are optional for partial updates
    """
    try:
        event = get_event_or_404(session, event_id)
        
        if event.is_deleted:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.EVENT_ALREADY_DELETED,
                    message="Cannot update a deleted event"
                ).model_dump()
            )
        
        # Update only provided fields
        update_data = event_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            # Convert date field to GMT+8 if being updated
            if field == 'date' and value:
                value = convert_to_gmt8(value)
            setattr(event, field, value)
        
        # Update timestamp
        event.updated_at = get_current_time_gmt8()
        
        session.add(event)
        session.commit()
        session.refresh(event)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_UPDATED,
            message="Event updated successfully",
            data=EventPublic.model_validate(event)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to update event: {str(e)}"
            ).model_dump()
        )


@router.delete(
    "/{event_id}",
    response_model=StandardResponse,
    summary="Soft delete event",
    description="Soft delete an event (marks as deleted but preserves data)"
)
def delete_event(event_id: str, session: Session = Depends(get_session)):
    """Soft delete an event"""
    try:
        event = get_event_or_404(session, event_id)
        
        if event.is_deleted:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALREADY_DELETED,
                    message="Event is already deleted"
                ).model_dump()
            )
        
        # Soft delete: set flags
        event.is_deleted = True
        event.deleted_at = get_current_time_gmt8()
        
        session.add(event)
        session.commit()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_DELETED,
            message="Event deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to delete event: {str(e)}"
            ).model_dump()
        )


@router.post(
    "/{event_id}/restore",
    response_model=StandardResponse,
    summary="Restore deleted event",
    description="Restore a soft-deleted event"
)
def restore_event(event_id: str, session: Session = Depends(get_session)):
    """Restore a soft-deleted event"""
    try:
        event = get_event_or_404(session, event_id)
        
        if not event.is_deleted:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.EVENT_NOT_DELETED,
                    message="Event is not deleted"
                ).model_dump()
            )
        
        # Restore
        event.is_deleted = False
        event.deleted_at = None
        
        session.add(event)
        session.commit()
        session.refresh(event)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_RESTORED,
            message="Event restored successfully",
            data=EventPublic.model_validate(event)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring event: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to restore event: {str(e)}"
            ).model_dump()
        )



# ==================== Image Upload Endpoints ====================

@router.post(
    "/{event_id}/upload-image",
    response_model=StandardResponse,
    summary="Upload event image",
    description="Upload an image for the event to Supabase Storage"
)
async def upload_event_image(
    event_id: str,
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """
    Upload an image for an event
    
    Allowed file types: JPEG, PNG, WebP
    Maximum file size: 5MB
    """
    try:
        event = get_event_or_404(session, event_id)
        
        if event.is_deleted:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.EVENT_NOT_FOUND,
                    message="Event not found"
                ).model_dump()
            )
        
        # Upload to Supabase
        success, image_path, error = await storage_service.upload_image(file, event_id)
        
        if not success:
            if "Invalid file type" in str(error):
                raise HTTPException(
                    status_code=400,
                    detail=StandardResponse(
                        success=False,
                        code=ErrorCode.IMAGE_INVALID_TYPE,
                        message=error
                    ).model_dump()
                )
            elif "too large" in str(error).lower():
                raise HTTPException(
                    status_code=413,
                    detail=StandardResponse(
                        success=False,
                        code=ErrorCode.IMAGE_TOO_LARGE,
                        message=error
                    ).model_dump()
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=StandardResponse(
                        success=False,
                        code=ErrorCode.IMAGE_UPLOAD_FAILED,
                        message=error
                    ).model_dump()
                )
        
        # Update event
        event.image_path = image_path
        session.add(event)
        session.commit()
        session.refresh(event)
        
        # Get public URL
        image_url = storage_service.get_public_url(image_path)
        
        return StandardResponse(
            success=True,
            code=SuccessCode.IMAGE_UPLOADED,
            message="Image uploaded successfully",
            data={
                "image_path": image_path,
                "image_url": image_url
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to upload image: {str(e)}"
            ).model_dump()
        )


@router.delete(
    "/{event_id}/delete-image",
    response_model=StandardResponse,
    summary="Delete event image",
    description="Remove the image from an event"
)
async def delete_event_image(
    event_id: str,
    session: Session = Depends(get_session)
):
    """Delete the image associated with an event"""
    try:
        event = get_event_or_404(session, event_id)
        
        if not event.image_path:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.IMAGE_NOT_FOUND,
                    message="Event has no image"
                ).model_dump()
            )
        
        # Delete from Supabase
        success, error = await storage_service.delete_image(event.image_path)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.IMAGE_UPLOAD_FAILED,
                    message=error
                ).model_dump()
            )
        
        # Update event
        event.image_path = None
        session.add(event)
        session.commit()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.IMAGE_DELETED,
            message="Image deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to delete image: {str(e)}"
            ).model_dump()
        )


@router.get(
    "/{event_id}/image-url",
    response_model=StandardResponse,
    summary="Get event image URL",
    description="Get the public URL for an event's image"
)
def get_event_image_url(event_id: str, session: Session = Depends(get_session)):
    """Get the image URL for an event"""
    try:
        event = get_event_or_404(session, event_id)
        
        if not event.image_path:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.IMAGE_NOT_FOUND,
                    message="Event has no image"
                ).model_dump()
            )
        
        image_url = storage_service.get_public_url(event.image_path)
        
        if not image_url:
            raise HTTPException(
                status_code=400,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.IMAGE_UPLOAD_FAILED,
                    message="Failed to generate image URL"
                ).model_dump()
            )
        
        return StandardResponse(
            success=True,
            code=SuccessCode.IMAGE_URL_RETRIEVED,
            message="Image URL retrieved successfully",
            data={"image_url": image_url}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting image URL: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to get image URL: {str(e)}"
            ).model_dump()
        )
