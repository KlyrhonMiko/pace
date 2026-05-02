from models.events import EventRegistration
import uuid
from sqlmodel import Session, select, func

from models.users import User
from models.alumni import Alumni
from models.job_listings import JobListing
from models.events import Event
from utils.timezone import get_current_time_gmt8, format_datetime_gmt8

import time as _time_mod
_PROCESS_START_TIME = _time_mod.time()

def get_admin_dashboard_stats(session: Session) -> dict:
    """Fetch comprehensive platform statistics for the administrator.

    Optimized to minimize database round-trips:
    - Base stats: 3 simple COUNT queries
    - Registration trend: 1 query with DATE_TRUNC + GROUP BY
    - User distribution: 1 query with GROUP BY user_type
    - Recent registrations: 1 multi-join query
    - Activity log: 1 multi-join query
    - System health: latency ping + Redis ping (no Supabase-blocked system functions)
    """
    import logging
    import time
    from datetime import timedelta
    from models.staff import Staff
    from models.employers import Employer

    logger = logging.getLogger(__name__)

    try:
        now = get_current_time_gmt8()

        # ── 1. Base Stats (3 simple queries) ──────────────────────────
        total_users = session.exec(
            select(func.count(User.id)).where(User.is_deleted == False)
        ).one()

        verified_alumni = session.exec(
            select(func.count(Alumni.id)).where(Alumni.is_deleted == False)
        ).one()

        active_jobs = session.exec(
            select(func.count(JobListing.id))
            .where(JobListing.is_active == True)
            .where(JobListing.is_deleted == False)
            .where((JobListing.source_api == "Internal") | (JobListing.source_api == None))
        ).one()

        # ── 2. Registration Trend — single GROUP BY query ─────────────
        seven_months_ago = (now.replace(day=1) - timedelta(days=6 * 30)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )

        trend_rows = session.exec(
            select(
                func.date_trunc("month", User.created_at).label("month"),
                func.count(User.id),
            )
            .where(User.created_at >= seven_months_ago)
            .where(User.is_deleted == False)
            .group_by(func.date_trunc("month", User.created_at))
            .order_by(func.date_trunc("month", User.created_at))
        ).all()

        trend_map = {row[0].strftime("%b %Y"): row[1] for row in trend_rows}

        # Build the full 7-month list (fill in 0 for months with no registrations)
        trend = []
        for i in range(6, -1, -1):
            month_date = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            key = month_date.strftime("%b %Y")
            trend.append({"month": month_date.strftime("%b"), "count": trend_map.get(key, 0)})

        # ── 3. User Distribution — single GROUP BY query ──────────────
        role_rows = session.exec(
            select(User.user_type, func.count(User.id))
            .where(User.is_deleted == False)
            .group_by(User.user_type)
        ).all()
        role_counts = {row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1] for row in role_rows}

        role_meta = [
            {"label": "Verified Alumni", "type": "USER", "color": "emerald"},
            {"label": "Active Employers", "type": "EMPLOYER", "color": "blue"},
            {"label": "Faculty / Staff", "type": "STAFF", "color": "violet"},
            {"label": "System Admins", "type": "ADMIN", "color": "amber"},
        ]
        distribution = []
        for r in role_meta:
            count = role_counts.get(r["type"], 0)
            pct = int((count / total_users * 100)) if total_users > 0 else 0
            distribution.append({
                "label": r["label"], "value": count, "percentage": pct, "color": r["color"]
            })

        # ── 4. Recent Registrations (single multi-join query) ─────────
        recent_rows = []
        try:
            recent_q = (
                select(User, Alumni, Staff, Employer)
                .outerjoin(Alumni, User.id == Alumni.user_ref_id)
                .outerjoin(Staff, User.id == Staff.user_ref_id)
                .outerjoin(Employer, User.id == Employer.user_ref_id)
                .where(User.is_deleted == False)
                .order_by(User.created_at.desc())
                .limit(5)
            )
            recent_rows = session.exec(recent_q).all()
        except Exception as exc:
            logger.warning("Recent registrations query failed: %s", exc)
            session.rollback()

        recent_registrations = []
        for u, a, s, e in recent_rows:
            name, initials, color = "Unknown", "??", "from-gray-500 to-gray-600"
            if a:
                name = f"{a.first_name} {a.last_name}"
                initials = f"{a.first_name[0]}{a.last_name[0]}"
                color = "from-emerald-700 to-emerald-800"
            elif s:
                name = f"{s.first_name} {s.last_name}"
                initials = f"{s.first_name[0]}{s.last_name[0]}"
                color = "from-violet-500 to-violet-600"
            elif e:
                name = e.company_name
                initials = e.company_name[:2].upper()
                color = "from-blue-500 to-blue-600"

            recent_registrations.append({
                "name": name,
                "email": u.email,
                "role": str(u.user_type).capitalize(),
                "status": "verified" if not u.force_password_reset else "pending",
                "joined_at": format_datetime_gmt8(u.created_at, fmt="iso"),
                "initials": initials,
                "color": color,
            })

        # ── 5. System Health (safe for Supabase) ─────────────────────
        # Latency ping only — avoid pg_postmaster_start_time / pg_stat_activity
        try:
            t0 = time.time()
            session.exec(select(1)).one()
            latency = f"{int((time.time() - t0) * 1000)}ms"
        except Exception:
            session.rollback()
            latency = "N/A"

        # Application-level uptime from module load time
        try:
            uptime_secs = time.time() - _PROCESS_START_TIME
            days = int(uptime_secs // 86400)
            hours = int((uptime_secs % 86400) // 3600)
            uptime_str = f"{days}d {hours}h" if days > 0 else f"{hours}h"
        except Exception:
            uptime_str = "N/A"

        from core.redis import redis_client
        try:
            cache_status = "Healthy" if redis_client and redis_client.ping() else "Offline"
        except Exception:
            cache_status = "Offline"

        system_health = {
            "uptime": uptime_str,
            "latency": latency,
            "db_load": 0,  # Not available on Supabase managed instances
            "cache_status": cache_status,
        }

        # ── 6. Activity Log ───────────────────────────────────────────
        activity_log = get_platform_activity_feed(session, limit=10)

        return {
            "total_users": total_users,
            "verified_alumni": verified_alumni,
            "active_jobs": active_jobs,
            "registration_trend": trend,
            "recent_registrations": recent_registrations,
            "user_distribution": distribution,
            "system_health": system_health,
            "activity_log": activity_log,
        }
    except Exception as e:
        logger.error("CRITICAL ERROR in get_admin_dashboard_stats: %s", e)
        session.rollback()
        return {
            "total_users": 0, "verified_alumni": 0, "active_jobs": 0,
            "registration_trend": [], "recent_registrations": [], "user_distribution": [],
            "system_health": {"uptime": "N/A", "latency": "N/A", "db_load": 0, "cache_status": "Error"},
            "activity_log": [],
        }


def get_faculty_dashboard_stats(session: Session, faculty_user_ref_id: uuid.UUID) -> dict:
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
        select(func.count(Event.id)).where(Event.is_deleted == False)
    ).one()

    # 3. Active jobs
    active_jobs = session.exec(
        select(func.count(JobListing.id))
        .where(JobListing.is_active == True)
        .where(JobListing.is_deleted == False)
        .where((JobListing.source_api == "Internal") | (JobListing.source_api == None))
    ).one()

    # 4. Placement Metrics for all alumni
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

    # 5. Final aggregation
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
        "active_jobs": active_jobs,
        "placement_rate": placement_rate,
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
        .outerjoin(StudentRecord, Alumni.id == StudentRecord.alumni_ref_id)
        .outerjoin(Course, StudentRecord.course_ref_id == Course.id)
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

def get_faculty_upcoming_sessions(session: Session, user_ref_id: uuid.UUID, limit: int = 5) -> list[dict]:
    """
    Retrieves upcoming mentoring sessions for the specific faculty.
    """
    from models.mentoring import MentoringSession
    from models.users import User
    
    now = get_current_time_gmt8()
    
    # Join with User to get student name
    sessions = session.exec(
        select(MentoringSession, User)
        .join(User, MentoringSession.alumni_user_ref_id == User.id)
        .where(MentoringSession.faculty_user_ref_id == user_ref_id)
        .where(MentoringSession.scheduled_at >= now)
        .where(MentoringSession.is_deleted == False)
        .order_by(MentoringSession.scheduled_at.asc())
        .limit(limit)
    ).all()
    
    result = []
    for s, u in sessions:
        result.append({
            "id": str(s.id),
            "title": s.title,
            "student": u.username, # Or full name if available
            "time": s.scheduled_at.isoformat(),
            "location": s.location,
            "status": s.status
        })
    return result

def get_platform_activity_feed(session: Session, limit: int = 20) -> list[dict]:
    """Get recent activity on the platform enriched with real names/company names."""
    from models.user_activities import UserActivity
    from models.users import User, UserType
    from models.alumni import Alumni
    from models.employers import Employer
    from models.staff import Staff

    # Join with User and enrichment tables
    query = (
        select(UserActivity, User, Alumni, Employer, Staff)
        .join(User, UserActivity.user_ref_id == User.id)
        .outerjoin(Alumni, User.id == Alumni.user_ref_id)
        .outerjoin(Employer, User.id == Employer.user_ref_id)
        .outerjoin(Staff, User.id == Staff.user_ref_id)
        .order_by(UserActivity.created_at.desc())
        .limit(limit)
    )
    
    results = session.exec(query).all()

    enriched_activities = []
    for act, user, alumni, employer, staff in results:
        display_name = user.username
        is_real_name = False
        
        if user.user_type == "EMPLOYER" and employer:
            display_name = employer.company_name
            is_real_name = True
        elif user.user_type in ["STAFF", "ADMIN"] and staff:
            display_name = f"{staff.first_name} {staff.last_name}"
            is_real_name = True
        elif alumni: # Alumni often have user_type USER
            display_name = f"{alumni.first_name} {alumni.last_name}"
            is_real_name = True
        
        # Format the description: use @username if no real name, otherwise use the real name/company
        actor_label = display_name if is_real_name else f"@{display_name}"
        
        enriched_activities.append({
            "id": act.activity_id,
            "description": f"{actor_label} {act.description}",
            "type": act.activity_type.value.lower(),
            "created_at": format_datetime_gmt8(act.created_at, fmt="iso")
        })

    return enriched_activities

def get_alumni_dashboard_stats(session: Session, user_ref_id: uuid.UUID) -> dict:
    """
    Fetch statistics specific to an alumni user.
    """
    from models.student_records import StudentRecord
    
    # 1. Fetch data
    registrations = session.exec(
        select(func.count(EventRegistration.id))
        .where(EventRegistration.user_ref_id == user_ref_id)
        .where(EventRegistration.is_deleted == False)
    ).one()
    
    alumni = session.exec(select(Alumni).where(Alumni.user_ref_id == user_ref_id)).first()
    student = None
    if alumni:
        student = session.exec(select(StudentRecord).where(StudentRecord.alumni_ref_id == alumni.id)).first()
        
    from services.queries.alumni_queries import calculate_profile_completeness
    completeness = calculate_profile_completeness(alumni, student) if alumni else 0

    return {
        "job_applications": 0,         # Placeholder (Model not found)
        "registered_events": registrations,
        "upcoming_interviews": 0,      # Placeholder (Model not found)
        "profile_completeness": completeness
    }

def get_alumni_recent_activity(session: Session, user_ref_id: uuid.UUID, limit: int = 5) -> list[dict]:
    """Get the most recent activities for a specific alumni user."""
    from services.queries.user_activities_queries import get_user_activities
    
    # 1. Fetch activities
    activities = get_user_activities(session, user_ref_id, limit=limit)
    
    return [
        {
            "id": act.activity_id,
            "name": act.description,
            "date": format_datetime_gmt8(act.created_at, fmt="iso"),
            "type": act.activity_type.value.lower()
        }
        for act in activities
    ]
