from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RegistrationTrend(BaseModel):
    month: str
    count: int

class RecentRegistration(BaseModel):
    name: str
    email: str
    role: str
    status: str
    joined_at: str
    initials: str
    color: str

class UserDistributionItem(BaseModel):
    label: str
    value: int
    percentage: int
    color: str

class SystemHealthStats(BaseModel):
    uptime: str
    latency: str
    db_load: int
    cache_status: str

class AdminDashboardStats(BaseModel):
    """Schema for comprehensive platform statistics for administrators"""
    total_users: int
    verified_alumni: int
    active_jobs: int
    registration_trend: List[RegistrationTrend]
    recent_registrations: List[RecentRegistration]
    user_distribution: List[UserDistributionItem]
    system_health: SystemHealthStats
    activity_log: List[Dict[str, Any]]

class PlacementDistribution(BaseModel):
    """Breakdown of alumni employment status"""
    employed: int
    interviewing: int
    searching: int

class FacultyDashboardStats(BaseModel):
    """Schema for faculty-specific performance metrics"""
    alumni_advised: int
    events_organized: int
    placement_rate: int
    active_jobs: int
    avg_offers: float
    avg_package: float
    top_sector: str
    placement_distribution: PlacementDistribution

class AlumniProgressItem(BaseModel):
    """Individual alumni progress record for dashboard"""
    name: str
    course: str
    status: str
    company: Optional[str] = None
    initials: str

class AlumniDashboardStats(BaseModel):
    """Schema for alumni-specific personal metrics"""
    job_applications: int
    registered_events: int
    upcoming_interviews: int
    profile_completeness: int
