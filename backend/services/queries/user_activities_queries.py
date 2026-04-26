import uuid
from sqlmodel import Session, select
from models.user_activities import UserActivity, ActivityType
from services.queries.audit import normalize_actor_ref, stamp_create


def generate_activity_id(session: Session) -> str:
    """Generate next activity_id in ACT-XXXXXX format."""
    last_id = session.exec(
        select(UserActivity.activity_id).order_by(UserActivity.activity_id.desc()).limit(1)
    ).first()
    if last_id:
        try:
            parts = last_id.split("-")
            next_num = int(parts[1]) + 1 if len(parts) >= 2 else 1
        except (ValueError, IndexError):
            next_num = 1
    else:
        next_num = 1
    return f"ACT-{next_num:06d}"


def create_user_activity(
    session: Session,
    user_ref_id: uuid.UUID | str,
    activity_type: ActivityType,
    description: str,
    activity_metadata: dict | None = None,
    actor_ref_id: uuid.UUID | str | None = None,
) -> UserActivity:
    """Create a new user activity log entry."""
    if isinstance(user_ref_id, str):
        user_ref_id = uuid.UUID(user_ref_id)

    activity = UserActivity(
        activity_id=generate_activity_id(session),
        user_ref_id=user_ref_id,
        activity_type=activity_type,
        description=description,
        activity_metadata=activity_metadata,
    )
    stamp_create(activity, actor_ref_id or normalize_actor_ref(user_ref_id))
    session.add(activity)
    # We don't commit here to allow it to be part of a larger transaction if needed,
    # but for most one-off activities like login, the caller will commit.
    return activity


def get_user_activities(
    session: Session,
    user_ref_id: uuid.UUID | str,
    limit: int = 10,
    offset: int = 0,
) -> list[UserActivity]:
    """Fetch recent activities for a specific user."""
    if isinstance(user_ref_id, str):
        user_ref_id = uuid.UUID(user_ref_id)

    statement = (
        select(UserActivity)
        .where((UserActivity.user_ref_id == user_ref_id) & (UserActivity.is_deleted == False))
        .order_by(UserActivity.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return session.exec(statement).all()
