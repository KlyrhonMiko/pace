from sqlmodel import Session, select
from fastapi import HTTPException
from models.events import Event
from models.response_codes import StandardResponse, ErrorCode


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
