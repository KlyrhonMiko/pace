from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

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
    uptime: str = "unknown"
    latency: str = "unknown"
    db_load: int = 0
    cache_status: str = "unknown"

class AdminDashboardStats(BaseModel):
    """Schema for comprehensive platform statistics for administrators"""
    total_users: int
    verified_alumni: int
    active_jobs: int
    registration_trend: List[RegistrationTrend] = Field(default_factory=list)
    recent_registrations: List[RecentRegistration] = Field(default_factory=list)
    user_distribution: List[UserDistributionItem] = Field(default_factory=list)
    system_health: SystemHealthStats = Field(default_factory=SystemHealthStats)
    activity_log: List[Dict[str, Any]] = Field(default_factory=list)

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
    active_jobs: int = 0
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
