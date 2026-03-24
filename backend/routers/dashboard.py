from fastapi import APIRouter, Depends
from sqlmodel import Session
from core.database import get_session
from models.auth import CurrentUser
from models.response_codes import SuccessCode, StandardResponse
from schemas.dashboard import AdminDashboardStats, FacultyDashboardStats, AlumniDashboardStats
from services.queries.dashboard_queries import (
    get_admin_dashboard_stats,
    get_faculty_dashboard_stats,
    get_alumni_dashboard_stats,
    get_alumni_recent_activity
)
from core.redis import cache_get_or_set, generate_cache_key
from utils.rbac import require_admin, require_staff_or_admin, require_authenticated

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
ALUMNI_STATS_CACHE_NAMESPACE = "alumni_stats"
ALUMNI_STATS_TTL = 300 # 5 minutes

@router.get("/admin/stats", response_model=StandardResponse)
def get_admin_stats(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_admin)
):
    """Get statistics for the admin dashboard"""
    stats = get_admin_dashboard_stats(session)
    return StandardResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message="Admin statistics retrieved successfully",
        data=AdminDashboardStats(**stats)
    )

@router.get("/faculty/stats", response_model=StandardResponse)
def get_faculty_stats(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_staff_or_admin)
):
    """Get statistics for the faculty dashboard"""
    stats = get_faculty_dashboard_stats(session)
    return StandardResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message="Faculty statistics retrieved successfully",
        data=FacultyDashboardStats(**stats)
    )

@router.get("/alumni/stats", response_model=StandardResponse)
def get_alumni_stats(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated)
):
    """Get statistics for the alumni dashboard"""
    cache_key = generate_cache_key(
        ALUMNI_STATS_CACHE_NAMESPACE,
        user_code=str(current_user.user_code)
    )
    
    return cache_get_or_set(
        cache_key,
        lambda: StandardResponse(
            success=True,
            code=SuccessCode.USERS_RETRIEVED.value,
            message="Alumni statistics retrieved successfully",
            data=AlumniDashboardStats(**get_alumni_dashboard_stats(session, str(current_user.user_code)))
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
    activity = get_alumni_recent_activity(session, current_user.user_code, limit)
    return StandardResponse(
        success=True,
        code=SuccessCode.USERS_RETRIEVED.value,
        message="Alumni activity retrieved successfully",
        data=activity
    )