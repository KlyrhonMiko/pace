"""
Jobs router for job search endpoints using Jooble API
"""
from fastapi import APIRouter, Query, Depends, BackgroundTasks
from sqlmodel import Session
from typing import Optional
from services.jooble import fetch_jobs, get_recommended_jobs
from core.database import get_session
from models.auth import CurrentUser
from utils.rbac import require_authenticated

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("/recommended")
def recommended_jobs(
    limit: int = Query(3, ge=1, le=10, description="Number of jobs to return"),
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Get recommended jobs from the database cache.
    """
    return get_recommended_jobs(session=db, limit=limit)



@router.get("/search")
async def search_jobs(
    background_tasks: BackgroundTasks,
    keywords: Optional[str] = Query(None, description="Search keywords for job title/description"),
    location: Optional[str] = Query("Philippines", description="Location to search in"),
    job_type: Optional[str] = Query(None, description="Job type filter (e.g. Full-time, Part-time)"),
    work_type: Optional[str] = Query(None, description="Work type filter (e.g. On-site, Remote)"),
    experience_level: Optional[str] = Query(None, description="Experience level filter (e.g. Senior, Junior)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Results per page"),
    salary: Optional[int] = Query(None, description="Minimum salary filter"),
    has_salary: bool = Query(False, description="Filter jobs that have numerical salary"),
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Search for job listings in the Philippines using Jooble API.
    
    Returns a list of jobs matching the search criteria along with total count.
    """
    result = await fetch_jobs(
        keywords=keywords,
        location=location,
        job_type=job_type,
        work_type=work_type,
        experience_level=experience_level,
        page=page,
        results_per_page=limit,
        salary=salary,
        session=db,
        background_tasks=background_tasks,
        has_salary=has_salary
    )
    
    return result
