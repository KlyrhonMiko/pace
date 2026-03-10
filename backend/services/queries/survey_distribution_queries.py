"""
DB query functions for survey distribution management.
"""

import uuid
from sqlmodel import Session, select, func, and_
from models.surveys import (
    Survey,
    SurveyInvitation,
    SurveyDistributionConfig,
)
from schemas.surveys import (
    SurveyDistributionConfigCreateRequest,
    SurveyInvitationStatus,
    DistributionTargetGroup,
    DistributionStatus,
)
from utils.timezone import get_current_time_gmt8
from services.queries.transaction_logs_queries import create_transaction_log


# ---------------------------------------------------------------------------
# ID generators
# ---------------------------------------------------------------------------


def generate_invitation_id(session: Session) -> str:
    last_id = session.exec(
        select(SurveyInvitation.invitation_id)
        .order_by(SurveyInvitation.invitation_id.desc())
        .limit(1)
    ).first()
    next_num = int(last_id.split("-")[1]) + 1 if last_id else 1
    return f"SINV-{next_num:06d}"


def generate_distribution_id(session: Session) -> str:
    last_id = session.exec(
        select(SurveyDistributionConfig.distribution_id)
        .order_by(SurveyDistributionConfig.distribution_id.desc())
        .limit(1)
    ).first()
    next_num = int(last_id.split("-")[1]) + 1 if last_id else 1
    return f"SDST-{next_num:06d}"


# ---------------------------------------------------------------------------
# Distribution config CRUD
# ---------------------------------------------------------------------------


def get_distribution_config(
    session: Session, survey_code: uuid.UUID
) -> SurveyDistributionConfig | None:
    return session.exec(
        select(SurveyDistributionConfig).where(
            SurveyDistributionConfig.survey_code == survey_code
        )
    ).first()


def configure_distribution(
    session: Session,
    survey: Survey,
    data: SurveyDistributionConfigCreateRequest,
    performed_by: str | None = None,
) -> SurveyDistributionConfig:
    existing = get_distribution_config(session, survey.survey_code)
    if existing:
        existing.target_group = data.target_group
        existing.filters = data.filters
        existing.scheduled_send_at = data.scheduled_send_at
        existing.updated_at = get_current_time_gmt8()
        session.add(existing)
        create_transaction_log(
            session,
            tl_name=f"UPDATED distribution config {survey.survey_id}",
            after=existing,
            performed_by=performed_by,
        )
        session.commit()
        session.refresh(existing)
        return existing
    else:
        config = SurveyDistributionConfig(
            survey_code=survey.survey_code,
            target_group=data.target_group,
            filters=data.filters,
            scheduled_send_at=data.scheduled_send_at,
            distribution_code=uuid.uuid4(),
            distribution_id=generate_distribution_id(session),
            created_at=get_current_time_gmt8(),
            updated_at=get_current_time_gmt8(),
        )
        session.add(config)
        create_transaction_log(
            session,
            tl_name=f"CREATED distribution config {survey.survey_id}",
            after=config,
            performed_by=performed_by,
        )
        session.commit()
        session.refresh(config)
        return config


def update_distribution_config(
    session: Session,
    config: SurveyDistributionConfig,
    data: SurveyDistributionConfigCreateRequest,
    performed_by: str | None = None,
) -> SurveyDistributionConfig:
    before_state = config.model_dump(mode="json")
    config.target_group = data.target_group
    config.filters = data.filters
    config.scheduled_send_at = data.scheduled_send_at
    config.updated_at = get_current_time_gmt8()
    session.add(config)
    create_transaction_log(
        session,
        tl_name=f"UPDATED distribution config {config.distribution_id}",
        before=before_state,
        after=config,
        performed_by=performed_by,
    )
    session.commit()
    session.refresh(config)
    return config


# ---------------------------------------------------------------------------
# Distribution sending (Phase 1.4B)
# ---------------------------------------------------------------------------


def _resolve_recipients(session: Session, config: SurveyDistributionConfig):
    """Return Alumni queryset based on target_group + filters. Returns list of Alumni."""
    from models.alumni import Alumni
    from models.student_records import StudentRecord
    from models.courses import Course
    import json

    stmt = select(Alumni).where(Alumni.is_deleted == False)

    if config.target_group == DistributionTargetGroup.ALL_ALUMNI:
        pass  # no additional filter

    elif config.target_group == DistributionTargetGroup.SPECIFIC_COURSE:
        filters = json.loads(config.filters) if config.filters else {}
        courses = filters.get("courses", [])
        if courses:
            # Join: Alumni.student_code → StudentRecord.student_code → Course.course_code
            stmt = (
                stmt.join(
                    StudentRecord, StudentRecord.student_code == Alumni.student_code
                )
                .join(Course, Course.course_code == StudentRecord.course_code)
                .where(Course.course_abbv.in_(courses))
            )

    elif config.target_group == DistributionTargetGroup.GRADUATION_YEAR_RANGE:
        filters = json.loads(config.filters) if config.filters else {}
        year_min = filters.get("year_min")
        year_max = filters.get("year_max")
        if year_min is not None and year_max is not None:
            stmt = stmt.join(
                StudentRecord, StudentRecord.student_code == Alumni.student_code
            ).where(
                and_(
                    StudentRecord.year_graduated >= year_min,
                    StudentRecord.year_graduated <= year_max,
                )
            )

    elif config.target_group == DistributionTargetGroup.CUSTOM_LIST:
        filters = json.loads(config.filters) if config.filters else {}
        alumni_ids = filters.get("alumni_ids", [])
        if alumni_ids:
            stmt = stmt.where(Alumni.alumni_id.in_(alumni_ids))

    return session.exec(stmt).all()


def send_survey_invitations(
    session: Session,
    survey: Survey,
    config: SurveyDistributionConfig,
    performed_by: str | None = None,
) -> tuple[int, list]:
    """
    Create SurveyInvitation records for all resolved recipients.
    Skips alumni who already have an invitation for this survey.
    Returns (sent_count, new_invitations_list).
    Note: actual email delivery is a future integration; this creates the invitation records.
    """
    from models.alumni import Alumni
    from models.users import User

    recipients = _resolve_recipients(session, config)
    if not recipients:
        return 0, []

    created = []
    for alumni in recipients:
        # Skip if already invited
        existing_inv = session.exec(
            select(SurveyInvitation).where(
                and_(
                    SurveyInvitation.survey_code == survey.survey_code,
                    SurveyInvitation.alumni_code == alumni.alumni_code,
                )
            )
        ).first()
        if existing_inv:
            continue

        # Resolve email from linked User record
        email = ""
        if alumni.user_code:
            user = session.exec(
                select(User).where(User.user_code == alumni.user_code)
            ).first()
            if user:
                email = user.email or ""

        inv = SurveyInvitation(
            invitation_code=uuid.uuid4(),
            invitation_id=generate_invitation_id(session),
            survey_code=survey.survey_code,
            alumni_code=alumni.alumni_code,
            recipient_email=email,
            status=SurveyInvitationStatus.SENT,
            sent_at=get_current_time_gmt8(),
            created_at=get_current_time_gmt8(),
        )
        session.add(inv)
        session.flush()
        created.append(inv)

    # Mark config as SENT
    config.status = DistributionStatus.SENT
    config.sent_at = get_current_time_gmt8()
    config.total_recipients = session.exec(
        select(func.count(SurveyInvitation.invitation_code)).where(
            SurveyInvitation.survey_code == survey.survey_code
        )
    ).one()
    config.updated_at = get_current_time_gmt8()
    session.add(config)
    create_transaction_log(
        session,
        tl_name=f"SENT survey invitations {survey.survey_id}",
        after={"survey_id": survey.survey_id, "sent_count": len(created)},
        performed_by=performed_by,
    )
    session.commit()

    return len(created), created


def send_survey_reminders(
    session: Session,
    survey: Survey,
    performed_by: str | None = None,
) -> tuple[int, list]:
    """
    Identify alumni who received invitations but have not responded, and mark them for reminder.
    Returns (reminder_count, invitation_list_to_remind).
    Note: actual email delivery is a future integration.
    """
    # Get all SENT invitations (those without a responded_at)
    pending_invs = session.exec(
        select(SurveyInvitation).where(
            and_(
                SurveyInvitation.survey_code == survey.survey_code,
                SurveyInvitation.status == SurveyInvitationStatus.SENT,
                SurveyInvitation.responded_at == None,
            )
        )
    ).all()

    # In a real system we'd re-send emails here; for now we just return the count
    # and re-timestamp sent_at to indicate a reminder was sent
    now = get_current_time_gmt8()
    for inv in pending_invs:
        inv.sent_at = now
        session.add(inv)

    if pending_invs:
        create_transaction_log(
            session,
            tl_name=f"SENT survey reminders {survey.survey_id}",
            after={"survey_id": survey.survey_id, "reminder_count": len(pending_invs)},
            performed_by=performed_by,
        )
        session.commit()

    return len(pending_invs), pending_invs


def get_distribution_stats(
    session: Session, survey_code: uuid.UUID, config: SurveyDistributionConfig
) -> dict:
    """Compute distribution statistics: sent, responded, response_rate, etc."""
    total = session.exec(
        select(func.count(SurveyInvitation.invitation_code)).where(
            SurveyInvitation.survey_code == survey_code
        )
    ).one()

    responded = session.exec(
        select(func.count(SurveyInvitation.invitation_code)).where(
            and_(
                SurveyInvitation.survey_code == survey_code,
                SurveyInvitation.responded_at != None,
            )
        )
    ).one()

    opened = session.exec(
        select(func.count(SurveyInvitation.invitation_code)).where(
            and_(
                SurveyInvitation.survey_code == survey_code,
                SurveyInvitation.opened_at != None,
            )
        )
    ).one()

    pending = total - responded
    response_rate = round(responded / total, 4) if total > 0 else 0.0

    return {
        "distribution_id": config.distribution_id,
        "survey_code": str(survey_code),
        "total_recipients": total,
        "sent_count": total,
        "opened_count": opened,
        "responded_count": responded,
        "pending_count": pending,
        "response_rate": response_rate,
        "status": config.status.value,
        "sent_at": config.sent_at,
        "scheduled_send_at": config.scheduled_send_at,
    }


def get_non_respondents(
    session: Session, survey_code: uuid.UUID, skip: int, limit: int
) -> tuple[list, int]:
    """
    Return paginated list of alumni who received invitations but haven't responded.
    Each item: {alumni_id, first_name, last_name, invitation_id, sent_at}
    """
    from models.alumni import Alumni

    stmt = (
        select(SurveyInvitation, Alumni)
        .join(Alumni, Alumni.alumni_code == SurveyInvitation.alumni_code)
        .where(
            and_(
                SurveyInvitation.survey_code == survey_code,
                SurveyInvitation.responded_at == None,
                SurveyInvitation.status == SurveyInvitationStatus.SENT,
            )
        )
    )

    total = session.exec(
        select(func.count(SurveyInvitation.invitation_code))
        .join(Alumni, Alumni.alumni_code == SurveyInvitation.alumni_code)
        .where(
            and_(
                SurveyInvitation.survey_code == survey_code,
                SurveyInvitation.responded_at == None,
                SurveyInvitation.status == SurveyInvitationStatus.SENT,
            )
        )
    ).one()

    rows = session.exec(stmt.offset(skip).limit(limit)).all()

    result = []
    for inv, alumni in rows:
        result.append(
            {
                "alumni_id": alumni.alumni_id,
                "first_name": alumni.first_name,
                "last_name": alumni.last_name,
                "invitation_id": inv.invitation_id,
                "sent_at": inv.sent_at,
            }
        )

    return result, total
