from models.events import EventRegistration
import uuid
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

def get_faculty_dashboard_stats(session: Session, faculty_user_code: uuid.UUID) -> dict:
    """
    Fetch global alumni statistics for the faculty dashboard.
    """
    # 1. Total Alumni on platform
    all_alumni = session.exec(
        select(Alumni).where(Alumni.is_deleted == False)
    ).all()
    alumni_total_count = len(all_alumni)
    
    # 2. Events organized (global count)
    events_organized = session.exec(
        select(func.count(Event.event_code)).where(Event.is_deleted == False)
    ).one()

    # 3. Placement Metrics for all alumni
    total_offers = 0
    total_salary = 0
    employed_count = 0
    interviewing_count = 0
    searching_count = 0
    sectors = {}
    
    for alumni in all_alumni:
        # Count statuses
        status = alumni.employment_status or "Searching"
        if status == "Employed":
            employed_count += 1
            if alumni.employment_sector:
                sectors[alumni.employment_sector] = sectors.get(alumni.employment_sector, 0) + 1
        elif status == "Interviewing":
            interviewing_count += 1
        else:
            searching_count += 1
            
        # Aggregate metrics
        total_offers += (alumni.offers_received or 0)
        total_salary += (alumni.salary_package or 0)
    
    placement_rate = int((employed_count / alumni_total_count * 100)) if alumni_total_count > 0 else 0

    # 4. Final aggregation
    avg_offers = round(total_offers / alumni_total_count, 1) if alumni_total_count > 0 else 0.0
    avg_package = round(total_salary / employed_count, 1) if employed_count > 0 else 0.0
    top_sector = max(sectors, key=sectors.get) if sectors else "N/A"

    distribution = {
        "employed": employed_count,
        "interviewing": interviewing_count,
        "searching": searching_count
    }

    return {
        "alumni_advised": alumni_total_count, # Renamed internally but still maps to the same UI field
        "events_organized": events_organized,
        "placement_rate": placement_rate,
        "referrals_sent": 0, # Placeholder
        "avg_offers": avg_offers,
        "avg_package": avg_package,
        "top_sector": top_sector,
        "placement_distribution": distribution
    }

def get_faculty_alumni_progress(session: Session, limit: int = 6) -> list[dict]:
    """
    Get recent alumni and their actual employment status/sector.
    """
    from models.student_records import StudentRecord
    from models.courses import Course
    
    # Get recent alumni with their student records and course info
    records = session.exec(
        select(Alumni, StudentRecord, Course)
        .outerjoin(StudentRecord, Alumni.alumni_code == StudentRecord.alumni_code)
        .outerjoin(Course, StudentRecord.course_code == Course.course_code)
        .where(Alumni.is_deleted == False)
        .order_by(Alumni.created_at.desc())
        .limit(limit)
    ).all()
    
    result = []
    for a, s, c in records:
        result.append({
            "name": f"{a.first_name} {a.last_name}",
            "course": c.course_abbv if c else "N/A",
            "status": a.employment_status or "Searching",
            "company": a.employment_sector or "N/A", 
            "initials": f"{a.first_name[0]}{a.last_name[0]}"
        })
    return result

def get_faculty_upcoming_sessions(session: Session, user_code: uuid.UUID, limit: int = 5) -> list[dict]:
    """
    Retrieves upcoming mentoring sessions for the specific faculty.
    """
    from models.mentoring import MentoringSession
    from models.users import User
    
    now = get_current_time_gmt8()
    
    # Join with User to get student name
    sessions = session.exec(
        select(MentoringSession, User)
        .join(User, MentoringSession.alumni_user_code == User.user_code)
        .where(MentoringSession.faculty_user_code == user_code)
        .where(MentoringSession.scheduled_at >= now)
        .where(MentoringSession.is_deleted == False)
        .order_by(MentoringSession.scheduled_at.asc())
        .limit(limit)
    ).all()
    
    result = []
    for s, u in sessions:
            result.append({
            "id": str(s.session_code),
            "title": s.title,
            "student": u.username, # Or full name if available
            "time": s.scheduled_at.isoformat(),
            "location": s.location,
            "status": s.status
        })
    return result

def get_faculty_activity_feed(session: Session, limit: int = 5) -> list[dict]:
    """Get recent activity on the platform relevant to faculty."""
    from models.user_activities import UserActivity
    from models.users import User

    activities = session.exec(
        select(UserActivity, User.username)
        .join(User, UserActivity.user_code == User.user_code)
        .order_by(UserActivity.created_at.desc())
        .limit(limit)
    ).all()

    return [
        {
            "id": act.activity_id,
            "description": f"@{username} {act.description}",
            "type": act.activity_type.value.lower(),
            "created_at": act.created_at.isoformat()
        }
        for act, username in activities
    ]

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
