from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import Session, select, func
from typing import Optional
import logging

from core.database import get_session
from models.events import Event, EventRegistration, EventRegistrationResponse, EventRegistrationRequest
from models.response_codes import StandardResponse, ErrorCode, SuccessCode
from models.pagination import PaginationMetadata
from utils.timezone import get_current_time_gmt8

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["event-registration"])


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


# ==================== Event Registration Endpoints ====================
# NOTE: These endpoints require authentication and role-based access control
# Currently disabled until auth system is implemented

@router.post(
    "/{event_id}/register",
    response_model=StandardResponse,
    summary="Register user for event",
    description="Register the current user for a specific event"
)
async def register_for_event(
    event_id: str,
    request: EventRegistrationRequest,
    session: Session = Depends(get_session)
):
    """
    Register a user for an event
    
    - **event_id**: Event ID to register for
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
        
        # Check if already registered
        existing = session.exec(
            select(EventRegistration)
            .where(EventRegistration.event_code == event.event_code)
            .where(EventRegistration.user_code == request.user_code)
            .where(EventRegistration.is_deleted == False)
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.ALREADY_REGISTERED,
                    message="User is already registered for this event"
                ).model_dump()
            )
        
        # Check capacity
        if event.attendees >= event.capacity:
            raise HTTPException(
                status_code=409,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.EVENT_CAPACITY_FULL,
                    message="Event is at full capacity"
                ).model_dump()
            )
        
        # Create registration
        registration = EventRegistration(
            event_code=event.event_code,
            user_code=request.user_code
        )
        event.attendees += 1
        
        session.add(registration)
        session.add(event)
        session.commit()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_REGISTERED,
            message="Successfully registered for event"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering for event: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to register: {str(e)}"
            ).model_dump()
        )


@router.delete(
    "/{event_id}/unregister",
    response_model=StandardResponse,
    summary="Unregister user from event",
    description="Unregister the current user from a specific event"
)
async def unregister_from_event(
    event_id: str,
    user_code: str = Query(..., description="User code (from auth context)"),
    session: Session = Depends(get_session)
):
    """
    Unregister a user from an event
    
    - **event_id**: Event ID to unregister from
    - **user_code**: User code (will come from auth context in production)
    """
    try:
        event = get_event_or_404(session, event_id)
        
        # Find registration
        registration = session.exec(
            select(EventRegistration)
            .where(EventRegistration.event_code == event.event_code)
            .where(EventRegistration.user_code == user_code)
            .where(EventRegistration.is_deleted == False)
        ).first()
        
        if not registration:
            raise HTTPException(
                status_code=404,
                detail=StandardResponse(
                    success=False,
                    code=ErrorCode.REGISTRATION_NOT_FOUND,
                    message="User is not registered for this event"
                ).model_dump()
            )
        
        # Soft delete registration and decrement attendees
        registration.is_deleted = True
        registration.deleted_at = get_current_time_gmt8()
        session.add(registration)
        
        event.attendees = max(0, event.attendees - 1)
        session.add(event)
        session.commit()
        
        return StandardResponse(
            success=True,
            code=SuccessCode.EVENT_UNREGISTERED,
            message="Successfully unregistered from event"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unregistering from event: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to unregister: {str(e)}"
            ).model_dump()
        )


@router.get(
    "/{event_id}/registrants",
    response_model=StandardResponse,
    summary="List event registrants",
    description="Get list of users registered for a specific event"
)
def get_event_registrants(
    event_id: str,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    """
    Get list of registrants for an event
    
    - **event_id**: Event ID
    - **limit**: Number of registrants to return (1-100, default 10)
    - **offset**: Number of registrants to skip (default 0)
    """
    try:
        event = get_event_or_404(session, event_id)
        
        # Get registrations
        registrations_query = (
            select(EventRegistration)
            .where(EventRegistration.event_code == event.event_code)
            .where(EventRegistration.is_deleted == False)
        )
        
        if limit > 0:
            registrations_query = registrations_query.offset(offset).limit(limit)
            
        registrations = session.exec(registrations_query).all()
        
        # Get total count
        total = session.exec(
            select(func.count(EventRegistration.registration_code))
            .where(EventRegistration.event_code == event.event_code)
            .where(EventRegistration.is_deleted == False)
        ).one()
        
        # Calculate pagination metadata
        returned = len(registrations)
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
            message=f"Retrieved {returned} registrants",
            data={
                "registrants": [
                    EventRegistrationResponse.model_validate(r).model_dump()
                    for r in registrations
                ],
                "pagination": pagination
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting registrants: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=StandardResponse(
                success=False,
                code=ErrorCode.INVALID_INPUT,
                message=f"Failed to get registrants: {str(e)}"
            ).model_dump()
        )
