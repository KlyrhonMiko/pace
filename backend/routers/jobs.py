import uuid
from datetime import datetime
from fastapi import APIRouter, Query, Depends, BackgroundTasks, HTTPException, status
from sqlmodel import Session, select
from typing import Optional, List
from services.jooble import fetch_jobs, get_recommended_jobs
from services.queries.jobs_queries import (
    create_job_listing,
    update_job_listing,
    delete_job_listing,
    get_job_listing
)
from models.job_listings import JobListing, JobListingCreate, JobListingUpdate, JobListingRead, JobApplication
from core.database import get_session
from core.redis import cache_invalidate_job_searches
from models.auth import CurrentUser
from utils.rbac import require_authenticated, require_role
from models.employers import Employer
from models import Alumni
from models.response_codes import StandardResponse, SuccessCode

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
    employer_id: Optional[uuid.UUID] = Query(None, description="Filter by employer ID"),
):
    """
    Search for job listings in the Philippines using Jooble API merged with local jobs.
    
    Returns a list of jobs matching the search criteria along with total count.
    """
    if current_user.user_type.upper() == "EMPLOYER" and not employer_id:
        try:
            target_user_code = uuid.UUID(current_user.user_code) if isinstance(current_user.user_code, str) else current_user.user_code
            employer = db.exec(select(Employer).where(Employer.user_code == target_user_code)).first()
            if employer:
                employer_id = employer.employer_id
            else:
                employer_id = uuid.UUID(int=0)
        except (ValueError, TypeError):
            employer_id = uuid.UUID(int=0)

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
        include_inactive=include_inactive,
        employer_id=employer_id
    )
    
    return StandardResponse(
        success=True,
        code=SuccessCode.JOB_LIST_RETRIEVED.value,
        message="Job listings retrieved successfully",
        data=result
    )


@router.post("/", response_model=JobListingRead, status_code=status.HTTP_201_CREATED)
def create_job(
    job: JobListingCreate,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "STAFF", "FACULTY", "EMPLOYER"])),
):
    """
    Create a new job listing. Accessible by admin, staff, faculty, and employers.
    """
    employer_id = None
    if current_user.user_type == "EMPLOYER":
        target_user_code = uuid.UUID(current_user.user_code) if isinstance(current_user.user_code, str) else current_user.user_code
        employer = db.exec(select(Employer).where(Employer.user_code == target_user_code)).first()
        if employer:
            employer_id = employer.employer_id
            # Auto-populate company name from employer profile
            if not job.company:
                job.company = employer.company_name

    # Populate raw_salary from min/max if not provided
    if not job.raw_salary:
        if job.salary_min and job.salary_max:
            job.raw_salary = f"₱{job.salary_min:,.0f} - ₱{job.salary_max:,.0f}"
        elif job.salary_min:
            job.raw_salary = f"₱{job.salary_min:,.0f}"
        elif job.salary_max:
            job.raw_salary = f"₱{job.salary_max:,.0f}"

    result = create_job_listing(db=db, job=job, employer_id=employer_id)
    cache_invalidate_job_searches()
    return result


@router.patch("/{job_id}", response_model=JobListingRead)
def update_job(
    job_id: int,
    job_update: JobListingUpdate,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "STAFF", "FACULTY", "EMPLOYER"])),
):
    """
    Update an existing job listing.
    """
    db_job = get_job_listing(db, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    # Ownership check for employers
    if current_user.user_type == "EMPLOYER":
        target_user_code = uuid.UUID(current_user.user_code) if isinstance(current_user.user_code, str) else current_user.user_code
        employer = db.exec(select(Employer).where(Employer.user_code == target_user_code)).first()
        if not employer or db_job.employer_id != employer.employer_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this job listing")

    # Update raw_salary if min/max are updated and raw_salary isn't explicitly changed
    if job_update.salary_min is not None or job_update.salary_max is not None:
        if not job_update.raw_salary:
            s_min = job_update.salary_min if job_update.salary_min is not None else db_job.salary_min
            s_max = job_update.salary_max if job_update.salary_max is not None else db_job.salary_max
            if s_min and s_max:
                job_update.raw_salary = f"₱{s_min:,.0f} - ₱{s_max:,.0f}"
            elif s_min:
                job_update.raw_salary = f"₱{s_min:,.0f}"
            elif s_max:
                job_update.raw_salary = f"₱{s_max:,.0f}"

    updated_job = update_job_listing(db=db, job_id=job_id, job_update=job_update)
    cache_invalidate_job_searches()
    return updated_job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "STAFF", "FACULTY", "EMPLOYER"])),
):
    """
    Deactivate a job listing (soft delete).
    """
    db_job = get_job_listing(db, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    # Ownership check for employers
    if current_user.user_type == "EMPLOYER":
        target_user_code = uuid.UUID(current_user.user_code) if isinstance(current_user.user_code, str) else current_user.user_code
        employer = db.exec(select(Employer).where(Employer.user_code == target_user_code)).first()
        if not employer or db_job.employer_id != employer.employer_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this job listing")

    success = delete_job_listing(db=db, job_id=job_id)
    cache_invalidate_job_searches()
    return None


@router.patch("/{job_id}/hide", response_model=JobListingRead)
def toggle_hide_job(
    job_id: int,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "STAFF", "FACULTY", "EMPLOYER"])),
):
    """
    Toggle the visibility (is_active) of a job listing for alumni.
    """
    db_job = get_job_listing(db, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    # Ownership check for employers
    if current_user.user_type == "EMPLOYER":
        target_user_code = uuid.UUID(current_user.user_code) if isinstance(current_user.user_code, str) else current_user.user_code
        employer = db.exec(select(Employer).where(Employer.user_code == target_user_code)).first()
        if not employer or db_job.employer_id != employer.employer_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this job listing")

    db_job.is_active = not db_job.is_active
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    cache_invalidate_job_searches()
    return db_job


@router.post("/{job_id}/apply", response_model=StandardResponse)
def apply_for_job(
    job_id: int,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Apply for an internal job listing.
    """
    from services.queries.alumni_queries import get_alumni_by_user_code
    from services.queries.jobs_queries import create_job_application, get_job_application

    alumni = get_alumni_by_user_code(db, str(current_user.user_code))
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni profile not found")

    # Check if job exists
    db_job = get_job_listing(db, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    if db_job.source_api and db_job.source_api != "Internal":
         raise HTTPException(status_code=400, detail="Cannot apply to external jobs through this platform")

    # Check if already applied (active application)
    from services.queries.jobs_queries import get_active_job_application
    existing = get_active_job_application(db, job_id, alumni.alumni_code)
    if existing:
        return StandardResponse(
            success=True,
            code=SuccessCode.SUCCESS.value,
            message="You have already applied for this job",
            data={"application_id": existing.id}
        )

    application = create_job_application(db, job_id, alumni.alumni_code)
    
    # Log activity
    from services.queries.user_activities_queries import create_user_activity
    from core.redis import cache_delete, generate_cache_key
    
    create_user_activity(
        session=db,
        user_code=current_user.user_code,
        activity_type="JOB_APPLICATION",
        description=f"Applied for job: {db_job.title} at {db_job.company}",
        activity_metadata={"job_id": job_id, "application_id": application.id}
    )
    db.commit()
    
    # Invalidate activity cache
    cache_key_activity = generate_cache_key("alumni_activity", user_code=str(current_user.user_code))
    cache_delete(cache_key_activity)

    return StandardResponse(
        success=True,
        code=SuccessCode.SUCCESS.value,
        message="Application submitted successfully",
        data={"application_id": application.id}
    )


@router.get("/my-applications", response_model=StandardResponse)
def get_my_applications(
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Get all job applications submitted by the current alumni.
    """
    from services.queries.alumni_queries import get_alumni_by_user_code
    from services.queries.jobs_queries import get_alumni_applications

    alumni = get_alumni_by_user_code(db, str(current_user.user_code))
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni profile not found")

    applications = get_alumni_applications(db, alumni.alumni_code)
    
    # Enrich with job details
    result = []
    for app in applications:
        job = get_job_listing(db, app.job_id)
        if job:
            result.append({
                "application_id": app.id,
                "job_id": app.job_id,
                "job_title": job.title,
                "company": job.company,
                "status": app.status,
                "applied_at": app.applied_at
            })

    return StandardResponse(
        success=True,
        code=SuccessCode.SUCCESS.value,
        message="Applications retrieved successfully",
        data=result
    )


@router.get("/{job_id}/applicants", response_model=StandardResponse)
def get_job_applicants_route(
    job_id: int,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Get all applicants for a specific job listing. Only accessible by the employer who posted the job or staff/admin.
    """
    from services.queries.jobs_queries import get_job_applicants, get_job_listing
    from services.queries.alumni_queries import get_alumni_by_id_any

    db_job = get_job_listing(db, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    # Authorization Check
    is_staff_admin = current_user.user_type in ["ADMIN", "STAFF"]
    
    is_owner = False
    if current_user.user_type == "EMPLOYER":
        from services.queries.employers_queries import get_employer_by_user_code
        target_user_code = uuid.UUID(current_user.user_code) if isinstance(current_user.user_code, str) else current_user.user_code
        employer = get_employer_by_user_code(db, target_user_code)
        if employer and db_job.employer_id == employer.employer_id:
            is_owner = True

    if not (is_staff_admin or is_owner):
        raise HTTPException(status_code=403, detail="Not authorized to view applicants for this job")

    applications = get_job_applicants(db, job_id)
    
    # Enrich with alumni details
    result = []
    for app in applications:
        alumni = db.exec(select(Alumni).where(Alumni.alumni_code == app.alumni_code)).first()
        if alumni:
            result.append({
                "application_id": app.id,
                "alumni_id": alumni.alumni_id,
                "first_name": alumni.first_name,
                "last_name": alumni.last_name,
                "email": alumni.user_code, # Should ideally join with User table for email
                "status": app.status,
                "applied_at": app.applied_at
            })

    return StandardResponse(
        success=True,
        code=SuccessCode.SUCCESS.value,
        message="Applicants retrieved successfully",
        data=result
    )
