"""
DB query functions for event_types domain.
All session.exec / session.add / session.commit / session.rollback calls live here.
Routers call these functions; they do NOT contain any select/exec logic themselves.
"""

from sqlmodel import Session, select, func

from models.event_types import EventType
from schemas.event_types import EventTypeCreate, EventTypeUpdate
from models.pagination import PaginationMetadata
from utils.timezone import get_current_time_gmt8


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------


def generate_event_type_id(session: Session) -> str:
    """Generate event_type_id with auto-increment (format: ET-000001)"""
    last = session.exec(
        select(EventType).order_by(EventType.event_type_id.desc())
    ).first()

    if last and last.event_type_id.startswith("ET-"):
        new_num = int(last.event_type_id.split("-")[1]) + 1
    else:
        new_num = 1

    return f"ET-{new_num:06d}"


# ---------------------------------------------------------------------------
# Single-record operations
# ---------------------------------------------------------------------------


def get_event_type_by_id(session: Session, event_type_id: str) -> EventType | None:
    """Fetch a single active event type by its human-readable ID."""
    return session.exec(
        select(EventType).where(
            (EventType.event_type_id == event_type_id.upper())
            & (EventType.is_deleted == False)
        )
    ).first()


def get_event_type_by_id_any(session: Session, event_type_id: str) -> EventType | None:
    """Fetch an event type by ID regardless of deletion status."""
    return session.exec(
        select(EventType).where(EventType.event_type_id == event_type_id.upper())
    ).first()


def get_event_type_by_name(session: Session, event_name: str) -> EventType | None:
    """Fetch an active event type by name (case-insensitive)."""
    return session.exec(
        select(EventType).where(
            EventType.event_name.ilike(event_name) & (EventType.is_deleted == False)
        )
    ).first()


def create_event_type(session: Session, data: EventTypeCreate) -> EventType:
    """Create a new event type and return the persisted record."""
    event_type_id = generate_event_type_id(session)
    event_type_dict = data.model_dump()
    event_type_dict["event_type_id"] = event_type_id
    new_event_type = EventType.model_validate(event_type_dict)
    session.add(new_event_type)
    session.commit()
    session.refresh(new_event_type)
    return new_event_type


def update_event_type(
    session: Session, event_type: EventType, data: EventTypeUpdate
) -> EventType:
    """Apply partial update to an event type and commit."""
    if data.event_name is not None:
        event_type.event_name = data.event_name
    if data.is_active is not None:
        event_type.is_active = data.is_active

    event_type.updated_at = get_current_time_gmt8()
    session.add(event_type)
    session.commit()
    session.refresh(event_type)
    return event_type


def soft_delete_event_type(session: Session, event_type: EventType) -> None:
    """Soft-delete an event type (sets is_deleted=True)."""
    event_type.is_deleted = True
    event_type.deleted_at = get_current_time_gmt8()
    session.add(event_type)
    session.commit()


def restore_event_type(session: Session, event_type: EventType) -> EventType:
    """Restore a soft-deleted event type."""
    event_type.is_deleted = False
    event_type.deleted_at = None
    event_type.updated_at = get_current_time_gmt8()
    session.add(event_type)
    session.commit()
    session.refresh(event_type)
    return event_type


# ---------------------------------------------------------------------------
# List operations with pagination
# ---------------------------------------------------------------------------


def get_all_event_types(
    session: Session,
    search: str | None = None,
    include_deleted: bool = False,
    sort_by: str = "created_at",
    sort_order: str = "asc",
    limit: int = 10,
    offset: int = 0,
) -> tuple[list[EventType], PaginationMetadata]:
    """
    Fetch a paginated list of event types with optional search and sorting.
    """
    base_filter = None if include_deleted else (EventType.is_deleted == False)

    query = select(EventType)
    count_q = select(func.count(EventType.event_type_id))

    if base_filter is not None:
        query = query.where(base_filter)
        count_q = count_q.where(base_filter)

    if search:
        like = f"%{search}%"
        query = query.where(EventType.event_name.ilike(like))
        count_q = count_q.where(EventType.event_name.ilike(like))

    total = session.exec(count_q).one()

    sort_column = getattr(EventType, sort_by, EventType.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    if limit > 0:
        query = query.offset(offset).limit(limit)

    items = session.exec(query).all()
    returned = len(items)

    metadata = PaginationMetadata(
        total=total,
        limit=limit,
        offset=offset,
        returned=returned,
        has_next=(offset + returned) < total if limit > 0 else False,
    )

    return items, metadata
