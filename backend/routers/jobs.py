from fastapi import APIRouter, Query, Depends, BackgroundTasks, HTTPException, status
from sqlmodel import Session
from typing import Optional, List
from services.jooble import fetch_jobs, get_recommended_jobs
from services.queries.jobs_queries import (
    create_job_listing,
    update_job_listing,
    delete_job_listing,
    get_job_listing
)
from models.job_listings import JobListing, JobListingCreate, JobListingUpdate, JobListingRead
from core.database import get_session
from models.auth import CurrentUser
from utils.rbac import require_authenticated, require_role

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
    include_inactive: bool = Query(False, description="Include inactive/hidden jobs"),
):
    """
    Search for job listings in the Philippines using Jooble API merged with local jobs.
    
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
        has_salary=has_salary,
        include_inactive=include_inactive
    )
    
    return result


@router.post("/", response_model=JobListingRead, status_code=status.HTTP_201_CREATED)
def create_job(
    job: JobListingCreate,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["admin", "staff", "faculty"])),
):
    """
    Create a new job listing. Accessible by admin, staff, and faculty.
    """
    return create_job_listing(db=db, job=job)


@router.patch("/{job_id}", response_model=JobListingRead)
def update_job(
    job_id: int,
    job_update: JobListingUpdate,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["admin", "staff", "faculty"])),
):
    """
    Update an existing job listing.
    """
    updated_job = update_job_listing(db=db, job_id=job_id, job_update=job_update)
    if not updated_job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    return updated_job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["admin", "staff", "faculty"])),
):
    """
    Deactivate a job listing (soft delete).
    """
    success = delete_job_listing(db=db, job_id=job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job listing not found")
    return None


@router.patch("/{job_id}/hide", response_model=JobListingRead)
def toggle_hide_job(
    job_id: int,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["admin", "staff", "faculty"])),
):
    """
    Toggle the visibility (is_active) of a job listing for alumni.
    """
    db_job = db.get(JobListing, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    db_job.is_active = not db_job.is_active
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job
