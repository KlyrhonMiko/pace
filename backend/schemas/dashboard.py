from pydantic import BaseModel

class AdminDashboardStats(BaseModel):
    """Schema for high-level platform statistics"""
    total_users: int
    verified_alumni: int
    active_jobs: int
    upcoming_events: int

class FacultyDashboardStats(BaseModel):
    """Schema for faculty-specific performance metrics"""
    alumni_advised: int
    events_organized: int
    placement_rate: int
    referrals_sent: int

class AlumniDashboardStats(BaseModel):
    """Schema for alumni-specific personal metrics"""
    job_applications: int
    registered_events: int
    upcoming_interviews: int
    profile_completeness: int
