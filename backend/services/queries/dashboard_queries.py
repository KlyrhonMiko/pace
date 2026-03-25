from models.events import EventRegistration
from sqlmodel import Session, select, func

from models.users import User
from models.alumni import Alumni
from models.job_listings import JobListing
from models.events import Event
from utils.timezone import get_current_time_gmt8

def get_admin_dashboard_stats(session: Session) -> dict:
    """
    Fetch high-level platform statistics for the administrator.
    Returns counts for users, alumni, jobs, and events.
    """
    now = get_current_time_gmt8()
    
    total_users = session.exec(
        select(func.count(User.user_code)).where(User.is_deleted == False)
    ).one()

    verified_alumni = session.exec(
        select(func.count(Alumni.alumni_code)).where(Alumni.is_deleted == False)
    ).one()

    active_jobs = session.exec(
        select(func.count(JobListing.id)).where(JobListing.is_active == True)
    ).one()

    upcoming_events = session.exec(
        select(func.count(Event.event_code)).where(
            (Event.date >= now) & (Event.is_deleted == False)
        )
    ).one()
    
    return {
        "total_users": total_users,
        "verified_alumni": verified_alumni,
        "active_jobs": active_jobs,
        "upcoming_events": upcoming_events
    }

def get_faculty_dashboard_stats(session: Session) -> dict:
    """
    Fetch statistics relevant to faculty and staff performance.
    Currently uses placeholders for advising and placement logic.
    """
    alumni_count = session.exec(
        select(func.count(Alumni.alumni_code)).where(Alumni.is_deleted == False)
    ).one()
    
    events_organized = session.exec(
        select(func.count(Event.event_code)).where(Event.is_deleted == False)
    ).one()
    
    return {
        "alumni_advised": alumni_count,
        "events_organized": events_organized,
        "placement_rate": 78,
        "referrals_sent": 23
    }

def get_alumni_dashboard_stats(session: Session, user_code: str) -> dict:
    """
    Fetch statistics specific to an alumni user.
    """
    from models.student_records import StudentRecord
    
    # 1. Fetch data
    registrations = session.exec(
        select(func.count(EventRegistration.registration_code))
        .where(EventRegistration.user_code == user_code)
        .where(EventRegistration.is_deleted == False)
    ).one()
    
    alumni = session.exec(select(Alumni).where(Alumni.user_code == user_code)).first()
    student = None
    if alumni:
        student = session.exec(select(StudentRecord).where(StudentRecord.alumni_code == alumni.alumni_code)).first()
        
    from services.queries.alumni_queries import calculate_profile_completeness
    completeness = calculate_profile_completeness(alumni, student) if alumni else 0

    return {
        "job_applications": 0,         # Placeholder (Model not found)
        "registered_events": registrations,
        "upcoming_interviews": 0,      # Placeholder (Model not found)
        "profile_completeness": completeness
    }

def get_alumni_recent_activity(session: Session, user_code: str, limit: int = 5) -> list[dict]:
    """Get the most recent activities for a specific alumni user."""
    from services.queries.user_activities_queries import get_user_activities
    
    # 1. Fetch activities
    activities = get_user_activities(session, user_code, limit=limit)
    
    return [
        {
            "id": act.activity_id,
            "name": act.description,
            "date": act.created_at.isoformat(),
            "type": act.activity_type.value.lower()
        }
        for act in activities
    ]
