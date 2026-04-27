import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from core.database import get_session
from models.auth import CurrentUser
from models.response_codes import StandardResponse
from utils.auth import get_current_user
from schemas.notifications import NotificationResponse, NotificationUpdate
from services.queries.notifications_queries import (
    get_user_notifications,
    update_notification,
    get_unread_count,
    mark_all_user_notifications_read
)
from services.notifications import subscribe_notifications

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def get_notifications_endpoint(
    limit: int = 50,
    skip: int = 0,
    unread_only: bool = False,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    notifications = get_user_notifications(db, current_user.id, limit, skip, unread_only)
    return StandardResponse(
        success=True,
        code="SUCCESS",
        message="Fetched notifications",
        data=[NotificationResponse.model_validate(n) for n in notifications],
    )

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    updated = update_notification(
        db,
        notification_id=notification_id,
        update_data=NotificationUpdate(is_read=True),
        performed_by=current_user.id
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return StandardResponse(
        success=True,
        code="SUCCESS",
        message="Notification marked as read",
        data=NotificationResponse.model_validate(updated)
    )

@router.post("/read-all")
def mark_all_read_endpoint(
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user)
):
    count = mark_all_user_notifications_read(db, current_user.id, performed_by=current_user.id)
    return StandardResponse(
        success=True,
        code="SUCCESS",
        message=f"Marked {count} notifications as read",
        data={"count": count}
    )

@router.get("/stream")
async def stream_notifications(
    token: Optional[str] = Query(default=None),
    db: Session = Depends(get_session)
):
    """SSE endpoint for real-time notifications via Redis pub/sub.
    Token is accepted as a query param since EventSource cannot send custom headers.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    
    try:
        from utils.auth import build_current_user, decode_access_token
        from sqlmodel import select
        from models.users import User
        
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        db_user = db.exec(select(User).where(User.user_id == user_id)).first()
        if not db_user or db_user.is_deleted:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        current_user = build_current_user(db, db_user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return StreamingResponse(
        subscribe_notifications(current_user.id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
