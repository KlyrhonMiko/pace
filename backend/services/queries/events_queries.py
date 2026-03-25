"""
DB query functions for events + event_registration domain.
"""

import logging
from sqlmodel import Session, select, func
from models.events import Event, EventRegistration, EventRegistrantDetails
from models.alumni import Alumni
from models.student_records import StudentRecord
from schemas.events import EventCreate, EventUpdate
from utils.timezone import get_current_time_gmt8, convert_to_gmt8
from services.queries.event_types_queries import get_event_type_by_name
from services.queries.transaction_logs_queries import create_transaction_log
from services.queries.user_activities_queries import create_user_activity, ActivityType

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------


def generate_event_id(session: Session) -> str:
    """Generate next event_id in EVNT-XXXXXX format."""
    last_id = session.exec(
        select(Event.event_id).order_by(Event.event_id.desc()).limit(1)
    ).first()
    if last_id:
        try:
            parts = last_id.split("-")
            next_num = int(parts[1]) + 1 if len(parts) >= 2 else 1
        except (ValueError, IndexError):
            next_num = 1
    else:
        next_num = 1
    return f"EVNT-{next_num:06d}"


# ---------------------------------------------------------------------------
# Single-record lookups
# ---------------------------------------------------------------------------


def get_event_by_id(session: Session, event_id: str) -> Event | None:
    from utils.events import get_event_or_404

    return get_event_or_404(session, event_id)


def get_active_event_by_id(session: Session, event_id: str) -> Event | None:
    """Returns event only if not deleted."""
    from utils.events import get_event_or_404

    event = get_event_or_404(session, event_id)
    return None if event.is_deleted else event


# ---------------------------------------------------------------------------
# Single-record mutations
# ---------------------------------------------------------------------------


def create_event(
    session: Session,
    data: EventCreate,
    performed_by: str | None = None,
) -> Event:
    event_id = generate_event_id(session)

    # Resolve event_type_code from the provided event_type_name (case-insensitive)
    event_type = get_event_type_by_name(session, data.event_type_name)
    if not event_type:
        raise ValueError(f"EVENT_TYPE_NOT_FOUND: {data.event_type_name}")

    event_data = data.model_dump(exclude={"event_type_name"})
    event_data["event_id"] = event_id
    event_data["event_type_code"] = event_type.event_type_code

    if event_data.get("date"):
        event_data["date"] = convert_to_gmt8(event_data["date"])
    event = Event(**event_data)
    session.add(event)
    create_transaction_log(
        session,
        tl_name=f"CREATED event {event.event_id}",
        after=event,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(event)
    return event


def update_event(
    session: Session,
    event: Event,
    data: EventUpdate,
    performed_by: str | None = None,
) -> Event:
    before_state = event.model_dump(mode="json")
    update_data = data.model_dump(exclude_unset=True)

    # Handle event_type_name resolution if provided (case-insensitive)
    if "event_type_name" in update_data and update_data["event_type_name"]:
        event_type = get_event_type_by_name(session, update_data.pop("event_type_name"))
        if not event_type:
            raise ValueError("EVENT_TYPE_NOT_FOUND")
        update_data["event_type_code"] = event_type.event_type_code
    else:
        update_data.pop("event_type_name", None)

    for field, value in update_data.items():
        if field == "date" and value:
            value = convert_to_gmt8(value)
        setattr(event, field, value)
    event.updated_at = get_current_time_gmt8()
    session.add(event)
    create_transaction_log(
        session,
        tl_name=f"UPDATED event {event.event_id}",
        before=before_state,
        after=event,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(event)
    return event


def soft_delete_event(
    session: Session,
    event: Event,
    performed_by: str | None = None,
) -> None:
    event.is_deleted = True
    event.deleted_at = get_current_time_gmt8()
    session.add(event)
    create_transaction_log(
        session,
        tl_name=f"DELETED event {event.event_id}",
        after=event,
        performed_by=performed_by,
    )
    session.commit()


def restore_event(
    session: Session,
    event: Event,
    performed_by: str | None = None,
) -> Event:
    event.is_deleted = False
    event.deleted_at = None
    session.add(event)
    create_transaction_log(
        session,
        tl_name=f"RESTORED event {event.event_id}",
        after=event,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(event)
    return event


def update_event_image(
    session: Session,
    event: Event,
    image_path: str,
    performed_by: str | None = None,
) -> Event:
    before_state = {"image_path": event.image_path}
    event.image_path = image_path
    session.add(event)
    create_transaction_log(
        session,
        tl_name=f"UPDATED event image {event.event_id}",
        before=before_state,
        after={"image_path": event.image_path},
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(event)
    return event


def clear_event_image(
    session: Session,
    event: Event,
    performed_by: str | None = None,
) -> None:
    before_state = {"image_path": event.image_path}
    event.image_path = None
    session.add(event)
    create_transaction_log(
        session,
        tl_name=f"REMOVED event image {event.event_id}",
        before=before_state,
        after={"image_path": None},
        performed_by=performed_by,
    )
    session.commit()


# ---------------------------------------------------------------------------
# List / pagination
# ---------------------------------------------------------------------------


def get_all_events(
    session: Session,
    limit: int,
    offset: int,
    search: str | None,
    event_type: str | None,
    status: str,
    include_deleted: bool,
    sort_by: str,
    sort_order: str,
) -> tuple[list[Event], int]:
    now = get_current_time_gmt8()
    base_filter = None if include_deleted else (Event.is_deleted == False)

    query = select(Event)
    count_q = select(func.count(Event.event_code))
    if base_filter is not None:
        query = query.where(base_filter)
        count_q = count_q.where(base_filter)

    if search:
        like = f"%{search}%"
        query = query.where(
            (Event.event_name.ilike(like))
            | (Event.location.ilike(like))
            | (Event.description.ilike(like))
        )
        count_q = count_q.where(
            (Event.event_name.ilike(like))
            | (Event.location.ilike(like))
            | (Event.description.ilike(like))
        )

    if status == "upcoming":
        query = query.where(Event.date > now)
        count_q = count_q.where(Event.date > now)
    elif status == "past":
        query = query.where(Event.date < now)
        count_q = count_q.where(Event.date < now)

    if event_type:
        # event_type filter is now a name string (case-insensitive)
        et = get_event_type_by_name(session, event_type)
        if et:
            query = query.where(Event.event_type_code == et.event_type_code)
            count_q = count_q.where(Event.event_type_code == et.event_type_code)

    total = session.exec(count_q).one()

    desc = sort_order.lower() == "desc"
    if sort_by == "attendees":
        query = query.order_by(
            Event.attendees.desc() if desc else Event.attendees.asc()
        )
    elif sort_by == "name":
        query = query.order_by(
            Event.event_name.desc() if desc else Event.event_name.asc()
        )
    else:
        query = query.order_by(Event.date.desc() if desc else Event.date.asc())

    if limit > 0:
        query = query.offset(offset).limit(limit)

    return session.exec(query).all(), total


# ---------------------------------------------------------------------------
# Event registration queries
# ---------------------------------------------------------------------------


def register_user_for_event(
    session: Session,
    event: Event,
    user_code: str,
    performed_by: str | None = None,
) -> None:
    """Register a user. Raises ValueError on duplicate or full capacity."""
    existing = session.exec(
        select(EventRegistration)
        .where(EventRegistration.event_code == event.event_code)
        .where(EventRegistration.user_code == user_code)
        .where(EventRegistration.is_deleted == False)
    ).first()
    if existing:
        raise ValueError("ALREADY_REGISTERED")

    if event.attendees >= event.capacity:
        raise ValueError("CAPACITY_FULL")

    registration = EventRegistration(event_code=event.event_code, user_code=user_code)
    event.attendees += 1
    session.add(registration)
    session.add(event)
    create_transaction_log(
        session,
        tl_name=f"REGISTERED user for event {event.event_id}",
        after={"event_id": event.event_id, "user_code": user_code},
        performed_by=performed_by,
    )
    create_user_activity(
        session,
        user_code=user_code,
        activity_type=ActivityType.REGISTER_FOR_EVENT,
        description=f"Registered for event: {event.event_name}",
        activity_metadata={"event_id": event.event_id}
    )
    session.commit()


def unregister_user_from_event(
    session: Session,
    event: Event,
    user_code: str,
    performed_by: str | None = None,
) -> None:
    """Soft-delete a registration. Raises ValueError if not found."""
    registration = session.exec(
        select(EventRegistration)
        .where(EventRegistration.event_code == event.event_code)
        .where(EventRegistration.user_code == user_code)
        .where(EventRegistration.is_deleted == False)
    ).first()
    if not registration:
        raise ValueError("REGISTRATION_NOT_FOUND")

    registration.is_deleted = True
    registration.deleted_at = get_current_time_gmt8()
    event.attendees = max(0, event.attendees - 1)
    session.add(registration)
    session.add(event)
    create_transaction_log(
        session,
        tl_name=f"UNREGISTERED user from event {event.event_id}",
        after={"event_id": event.event_id, "user_code": user_code},
        performed_by=performed_by,
    )
    create_user_activity(
        session,
        user_code=user_code,
        activity_type=ActivityType.UNREGISTER_FROM_EVENT,
        description=f"Unregistered from event: {event.event_name}",
        activity_metadata={"event_id": event.event_id}
    )
    session.commit()


def get_event_registrants(
    session: Session, event: Event, limit: int, offset: int
) -> tuple[list[EventRegistrantDetails], int]:
    query = (
        select(EventRegistration, Alumni, StudentRecord)
        .join(Alumni, Alumni.user_code == EventRegistration.user_code, isouter=True)
        .join(
            StudentRecord, StudentRecord.alumni_code == Alumni.alumni_code, isouter=True
        )
        .where(EventRegistration.event_code == event.event_code)
        .where(EventRegistration.is_deleted == False)
        .order_by(EventRegistration.registered_at.desc())
    )
    total = session.exec(
        select(func.count(EventRegistration.registration_code))
        .where(EventRegistration.event_code == event.event_code)
        .where(EventRegistration.is_deleted == False)
    ).one()

    if limit > 0:
        query = query.offset(offset).limit(limit)

    rows = session.exec(query).all()
    registrants: list[EventRegistrantDetails] = []
    for registration, alumni, student_record in rows:
        registrants.append(
            EventRegistrantDetails(
                event_id=event.event_id,
                alumni_id=alumni.alumni_id if alumni else None,
                last_name=alumni.last_name if alumni else None,
                first_name=alumni.first_name if alumni else None,
                middle_name=alumni.middle_name if alumni else None,
                student_id=student_record.student_id if student_record else None,
                year_graduated=student_record.year_graduated
                if student_record
                else None,
                registered_at=registration.registered_at,
            )
        )

    return registrants, total



def get_user_registration_status(
    session: Session, user_code: str, event_codes: list[int]
) -> set[int]:
    """Returns a set of event_codes the user is registered for."""
    if not event_codes:
        return set()

    registrations = session.exec(
        select(EventRegistration.event_code)
        .where(EventRegistration.user_code == user_code)
        .where(EventRegistration.event_code.in_(event_codes))
        .where(EventRegistration.is_deleted == False)
    ).all()
    return set(registrations)


def get_event_facets(session: Session) -> dict[str, int]:
    """Calculate facets (counts per event type) across all active events."""
    from models.event_types import EventType

    facet_results = session.exec(
        select(EventType.event_name, func.count(Event.event_code))
        .join(EventType, Event.event_type_code == EventType.event_type_code)
        .where(Event.is_deleted == False)
        .group_by(EventType.event_name)
    ).all()
    return {row[0]: row[1] for row in facet_results}
