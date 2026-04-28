from typing import Optional
from pydantic import BaseModel

class AdminDashboardStats(BaseModel):
    """Schema for high-level platform statistics"""
    total_users: int
    verified_alumni: int
    active_jobs: int
    upcoming_events: int

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
