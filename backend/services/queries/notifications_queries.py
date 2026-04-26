import uuid
from typing import List, Optional

from sqlmodel import Session, select
from models.notifications import Notification
from schemas.notifications import NotificationCreate, NotificationUpdate
from services.queries.audit import stamp_create, stamp_update
from services.queries.transaction_logs_queries import create_transaction_log

def create_notification(
    db: Session,
    notification_in: NotificationCreate,
    performed_by: str | uuid.UUID | None = None,
) -> Notification:
    db_obj = Notification.model_validate(notification_in, from_attributes=True)
    stamp_create(db_obj, performed_by)
    db.add(db_obj)
    
    create_transaction_log(
        db,
        tl_name=f"CREATED notification for user {db_obj.user_ref_id}",
        after=db_obj,
        performed_by=performed_by,
    )
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_notification(db: Session, notification_id: uuid.UUID | str) -> Optional[Notification]:
    try:
        ref_id = uuid.UUID(str(notification_id))
    except (TypeError, ValueError):
        return None
    return db.exec(select(Notification).where(Notification.id == ref_id)).first()

def get_user_notifications(
    db: Session, 
    user_ref_id: uuid.UUID, 
    limit: int = 50, 
    skip: int = 0,
    unread_only: bool = False
) -> List[Notification]:
    query = select(Notification).where(Notification.user_ref_id == user_ref_id).where(Notification.is_deleted == False)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    return db.exec(query).all()

def update_notification(
    db: Session,
    notification_id: uuid.UUID | str,
    update_data: NotificationUpdate,
    performed_by: str | uuid.UUID | None = None,
) -> Optional[Notification]:
    db_obj = get_notification(db, notification_id)
    if not db_obj:
        return None

    before_state = db_obj.model_dump(mode="json")
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for key, value in update_dict.items():
        setattr(db_obj, key, value)
        
    stamp_update(db_obj)
    db.add(db_obj)
    
    create_transaction_log(
        db,
        tl_name=f"UPDATED notification {db_obj.id}",
        before=before_state,
        after=db_obj,
        performed_by=performed_by,
    )
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_unread_count(db: Session, user_ref_id: uuid.UUID) -> int:
    from sqlmodel import func
    count_query = select(func.count(Notification.id)).where(
        Notification.user_ref_id == user_ref_id,
        Notification.is_read == False,
        Notification.is_deleted == False
    )
    return db.exec(count_query).one()
