from fastapi import APIRouter, Depends
from sqlmodel import Session
from core.database import get_session
from models.auth import CurrentUser
from models.response_codes import SuccessCode, StandardResponse
from schemas.dashboard import (
    AdminDashboardStats, 
    FacultyDashboardStats, 
    AlumniDashboardStats
)
from services.queries.dashboard_queries import (
    get_admin_dashboard_stats,
    get_faculty_dashboard_stats,
    get_alumni_dashboard_stats,
    get_alumni_recent_activity,
    get_faculty_alumni_progress,
    get_platform_activity_feed,
    get_faculty_upcoming_sessions
)
from core.redis import cache_get_or_set, generate_cache_key
from utils.rbac import require_admin, require_staff_or_admin, require_authenticated

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Cache namespaces and TTLs
ADMIN_STATS_CACHE_NAMESPACE = "admin_stats"
ADMIN_STATS_TTL = 60  # 1 minute — admin needs near-real-time data
ALUMNI_STATS_CACHE_NAMESPACE = "alumni_stats"
ALUMNI_STATS_TTL = 300  # 5 minutes
FACULTY_DASHBOARD_CACHE_NAMESPACE = "faculty_dashboard"
FACULTY_DASHBOARD_TTL = 300  # 5 minutes

@router.get("/admin/stats", response_model=StandardResponse)
def get_admin_stats(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin)
):
    """Get statistics for the admin dashboard (cached 60s)"""
    cache_key = generate_cache_key(ADMIN_STATS_CACHE_NAMESPACE, type="stats")
    return cache_get_or_set(
        cache_key,
        lambda: StandardResponse(
            success=True,
            code=SuccessCode.USERS_RETRIEVED.value,
            message="Admin statistics retrieved successfully",
            data=AdminDashboardStats(**get_admin_dashboard_stats(session))
        ),
        ttl=ADMIN_STATS_TTL
    )

@router.get("/faculty/stats", response_model=StandardResponse)
def get_faculty_stats(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin)
):
    """Get statistics for the faculty dashboard (cached 5m)"""
    if not current_user.id:
        raise ValueError("Authenticated user is missing an internal id")
    cache_key = generate_cache_key(FACULTY_DASHBOARD_CACHE_NAMESPACE, type="stats", user_id=str(current_user.user_id))
    
    return cache_get_or_set(
        cache_key,
        lambda: StandardResponse(
            success=True,
            code=SuccessCode.USERS_RETRIEVED.value,
            message="Faculty statistics retrieved successfully",
            data=FacultyDashboardStats(**get_faculty_dashboard_stats(session, current_user.id))
        ),
        ttl=FACULTY_DASHBOARD_TTL
    )

@router.get("/faculty/progress", response_model=StandardResponse)
def get_faculty_progress(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin)
):
    """Get recent alumni progress for faculty (cached 5m)."""
    cache_key = generate_cache_key(FACULTY_DASHBOARD_CACHE_NAMESPACE, type="progress")
    return cache_get_or_set(
        cache_key,
        lambda: StandardResponse(
            success=True, 
            code=SuccessCode.ALUMNI_LIST_RETRIEVED.value,
            message="Faculty alumni progress retrieved successfully",
            data=get_faculty_alumni_progress(session)
        ),
        ttl=FACULTY_DASHBOARD_TTL
    )

@router.get("/faculty/sessions", response_model=StandardResponse)
def get_faculty_sessions(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin)
):
    """Get upcoming mentoring sessions for faculty (cached 5m)."""
    if not current_user.id:
        raise ValueError("Authenticated user is missing an internal id")
    cache_key = generate_cache_key(FACULTY_DASHBOARD_CACHE_NAMESPACE, type="sessions", user_id=str(current_user.user_id))
    return cache_get_or_set(
        cache_key,
        lambda: StandardResponse(
            success=True,
            code=SuccessCode.USER_RETRIEVED.value,
            message="Faculty mentoring sessions retrieved successfully",
            data=get_faculty_upcoming_sessions(session, current_user.id)
        ),
        ttl=FACULTY_DASHBOARD_TTL
    )

@router.get("/faculty/activity", response_model=StandardResponse)
def get_faculty_activity(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin),
    limit: int = 5
):
    """Get general alumni activity for the faculty dashboard (cached 2m)"""
    cache_key = generate_cache_key(FACULTY_DASHBOARD_CACHE_NAMESPACE, type="activity", limit=str(limit))
    return cache_get_or_set(
        cache_key,
        lambda: StandardResponse(
            success=True,
            code=SuccessCode.USERS_RETRIEVED.value,
            message="Faculty activity feed retrieved successfully",
            data=get_platform_activity_feed(session, limit)
        ),
        ttl=120  # 2 minutes for activity
    )

@router.get("/alumni/stats", response_model=StandardResponse)
def get_alumni_stats(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated)
):
    """Get statistics for the alumni dashboard (cached 5m)"""
    cache_key = generate_cache_key(
        ALUMNI_STATS_CACHE_NAMESPACE,
        user_id=str(current_user.user_id)
    )
    
    return cache_get_or_set(
        cache_key,
        lambda: StandardResponse(
            success=True,
            code=SuccessCode.USERS_RETRIEVED.value,
            message="Alumni statistics retrieved successfully",
            data=AlumniDashboardStats(**get_alumni_dashboard_stats(session, current_user.id))
        ),
        ttl=ALUMNI_STATS_TTL
    )

@router.get("/alumni/activity", response_model=StandardResponse)
def get_alumni_activity(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
    limit: int = 5
):
    """Get recent activity for the current alumni"""
    activity = get_alumni_recent_activity(session, current_user.id, limit)
    return StandardResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message="Alumni activity retrieved successfully",
        data=activity
    )

