import uuid
from datetime import datetime
from fastapi import APIRouter, Query, Depends, BackgroundTasks, HTTPException, status, File, UploadFile
import cloudinary.uploader
from sqlmodel import Session, select
from typing import Optional, List
from services.jooble import fetch_jobs, get_recommended_jobs
from services.queries.jobs_queries import (
    create_job_listing,
    update_job_listing,
    delete_job_listing,
    get_job_listing,
    toggle_job_listing_visibility,
    get_jobs_with_embeddings,
)
from services.machines.job_matching import job_matching_service
from models.job_listings import JobListing, JobListingCreate, JobListingUpdate, JobListingRead, JobApplication
from core.database import get_session
from core.redis import cache_invalidate_job_searches
from models.auth import CurrentUser
from utils.rbac import require_authenticated, require_role
from models.employers import Employer
from models.users import User
from models import Alumni
from models.response_codes import StandardResponse, SuccessCode

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _require_current_user_id(current_user: CurrentUser) -> uuid.UUID:
    if not current_user.id:
        raise HTTPException(status_code=401, detail="Authenticated user is missing an internal id")
    return current_user.id


@router.get("/recommended", response_model=StandardResponse)
async def recommended_jobs(
    limit: int = Query(3, ge=1, le=10, description="Number of jobs to return"),
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Get recommended jobs from the database cache.
    """
    result = await get_recommended_jobs(session=db, limit=limit)
    return StandardResponse(
        success=True,
        code=SuccessCode.JOB_LIST_RETRIEVED.value,
        message="Recommended jobs retrieved successfully",
        data=result
    )



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
    employer_ref_id: Optional[uuid.UUID] = Query(None, description="Filter by employer UUID"),
    local_only: bool = Query(False, description="Filter for local platform jobs only"),
):
    """
    Search for job listings in the Philippines using Jooble API merged with local jobs.
    
    Returns a list of jobs matching the search criteria along with total count.
    """
    if current_user.user_type.upper() == "EMPLOYER" and not employer_ref_id:
        employer = db.exec(
            select(Employer).where(Employer.user_ref_id == _require_current_user_id(current_user))
        ).first()
        employer_ref_id = employer.id if employer else uuid.UUID(int=0)

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
        employer_ref_id=employer_ref_id,
        local_only=local_only
    )
    
    return StandardResponse(
        success=True,
        code=SuccessCode.JOB_LIST_RETRIEVED.value,
        message="Job listings retrieved successfully",
        data=result
    )


@router.get("/match/{alumni_id}", response_model=StandardResponse)
def match_jobs_for_alumni(
    alumni_id: str,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Match jobs for an alumni based on their skills using semantic similarity.
    Enriches the alumni profile text with career track prediction and role
    context so the sentence-transformer embedding is semantically comparable
    to full job-description embeddings.
    """
    from services.queries.alumni_queries import get_alumni_by_id_any
    from services.queries.predict_queries import get_career_predictions_by_alumni_ref_id
    
    # 1. Fetch Alumni
    alumni = get_alumni_by_id_any(db, alumni_id)
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni profile not found")
        
    # 2. Extract and format skills
    if not alumni.skills:
        return StandardResponse(
            success=True,
            code=SuccessCode.SUCCESS.value,
            message="No skills found for this alumni. Update profile to get matches.",
            data=[]
        )
        
    skills_string = ", ".join(alumni.skills)
    
    # 2b. Build a rich profile description for embedding.
    #     A bare comma-separated skill list produces poor cosine similarity
    #     against full job descriptions. Wrapping it in natural language with
    #     the predicted career track yields a semantically comparable vector.
    profile_parts = []
    
    # Include career track prediction if available
    career_track = None
    try:
        career_predictions = get_career_predictions_by_alumni_ref_id(db, alumni.id, limit=1)
        if career_predictions:
            latest = career_predictions[0]
            career_track = latest.predicted_track
            if career_track:
                profile_parts.append(f"{career_track} professional")
    except Exception:
        pass  # Gracefully degrade if no predictions exist
    
    # Include current employment context from alumni profile
    if alumni.employment_sector:
        profile_parts.append(f"working in {alumni.employment_sector}")
    
    # Core: natural-language skills sentence
    profile_parts.append(f"skilled in {skills_string}")
    
    # Build the final profile text for embedding
    profile_text = ". ".join(profile_parts) + "."
    # e.g. "Full Stack Developer professional. skilled in JavaScript, React, Node.js, Python, SQL."
    
    # 3. Fetch jobs with embeddings
    jobs = get_jobs_with_embeddings(db)
    if not jobs:
        return StandardResponse(
            success=True,
            code=SuccessCode.SUCCESS.value,
            message="No pre-computed jobs available for matching yet.",
            data=[]
        )
        
    # Prepare embeddings for the matching service
    job_embeddings = []
    for job in jobs:
        if job.vector_embedding:
            job_embeddings.append(
                (job.id, job.vector_embedding, job.title, job.company or "Unknown Company")
            )
            
    # 4. Run matching logic with the enriched profile text
    matches = job_matching_service.calculate_similarity(profile_text, job_embeddings)
    
    # 5. Enrich matches with full job listing details
    job_map = {str(job.id): job for job in jobs}
    enriched_matches = []
    for match in matches[:5]:
        job_id = match["job_id"]
        job_obj = job_map.get(job_id)
        if job_obj:
            # Check for employer logo
            logo = None
            if job_obj.employer_ref_id:
                from models.employers import Employer
                employer = db.exec(select(Employer).where(Employer.id == job_obj.employer_ref_id)).first()
                if employer:
                    logo = employer.company_logo_url
            
            job_dict = job_obj.model_dump(mode="json", exclude={"vector_embedding"})
            job_dict["logo"] = logo
            job_dict["similarity_score"] = match["similarity_score"]
            job_dict["match_percentage"] = match["match_percentage"]
            enriched_matches.append(job_dict)
    
    return StandardResponse(
        success=True,
        code=SuccessCode.SUCCESS.value,
        message="Top job matches retrieved successfully",
        data=enriched_matches
    )



@router.post("/", response_model=JobListingRead, status_code=status.HTTP_201_CREATED)
def create_job(
    job: JobListingCreate,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "STAFF", "EMPLOYER"])),
):
    """
    Create a new job listing. Accessible by admin, staff, faculty, and employers.
    """
    employer_ref_id = None
    if current_user.user_type == "EMPLOYER":
        employer = db.exec(
            select(Employer).where(Employer.user_ref_id == _require_current_user_id(current_user))
        ).first()
        if employer:
            employer_ref_id = employer.id
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

    result = create_job_listing(
        db=db,
        job=job,
        employer_ref_id=employer_ref_id,
        performed_by=current_user.id,
    )
    cache_invalidate_job_searches()
    return result


@router.patch("/{job_listing_id}", response_model=JobListingRead)
def update_job(
    job_listing_id: str,
    job_update: JobListingUpdate,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "STAFF", "EMPLOYER"])),
):
    """
    Update an existing job listing.
    """
    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    if db_job.is_deleted:
        raise HTTPException(status_code=400, detail="Job listing has been deleted")

    # Ownership check for employers
    if current_user.user_type == "EMPLOYER":
        employer = db.exec(
            select(Employer).where(Employer.user_ref_id == _require_current_user_id(current_user))
        ).first()
        if not employer or db_job.employer_ref_id != employer.id:
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

    updated_job = update_job_listing(
        db=db,
        job_listing_id=job_listing_id,
        job_update=job_update,
        performed_by=current_user.id,
    )
    cache_invalidate_job_searches()
    return updated_job


@router.delete("/{job_listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_listing_id: str,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "STAFF", "EMPLOYER"])),
):
    """
    Deactivate a job listing (soft delete).
    """
    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    if db_job.is_deleted:
        raise HTTPException(status_code=400, detail="Job listing has already been deleted")

    # Ownership check for employers
    if current_user.user_type == "EMPLOYER":
        employer = db.exec(
            select(Employer).where(Employer.user_ref_id == _require_current_user_id(current_user))
        ).first()
        if not employer or db_job.employer_ref_id != employer.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this job listing")

    delete_job_listing(
        db=db,
        job_listing_id=job_listing_id,
        performed_by=current_user.id,
    )
    cache_invalidate_job_searches()
    return None



@router.patch("/{job_listing_id}/hide", response_model=JobListingRead)
def toggle_hide_job(
    job_listing_id: str,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "STAFF", "EMPLOYER"])),
):
    """
    Toggle the visibility (is_active) of a job listing for alumni.
    """
    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    if db_job.is_deleted:
        raise HTTPException(status_code=400, detail="Job listing has been deleted")

    # Ownership check for employers
    if current_user.user_type == "EMPLOYER":
        employer = db.exec(
            select(Employer).where(Employer.user_ref_id == _require_current_user_id(current_user))
        ).first()
        if not employer or db_job.employer_ref_id != employer.id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this job listing")

    db_job = toggle_job_listing_visibility(
        db,
        job_listing_id,
        performed_by=current_user.id,
    )
    cache_invalidate_job_searches()
    return db_job


@router.post("/{job_listing_id}/apply", response_model=StandardResponse)
def apply_for_job(
    job_listing_id: str,
    resume: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Apply for an internal job listing.
    """
    from services.queries.alumni_queries import get_alumni_by_user_ref_id
    from services.queries.jobs_queries import create_job_application

    alumni = get_alumni_by_user_ref_id(db, _require_current_user_id(current_user))
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni profile not found")

    # Check if job exists
    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    if db_job.is_deleted or not db_job.is_active:
        raise HTTPException(status_code=400, detail="Job listing is not available")

    if db_job.source_api and db_job.source_api != "Internal":
         raise HTTPException(status_code=400, detail="Cannot apply to external jobs through this platform")

    # Check if already applied (active application)
    from services.queries.jobs_queries import get_active_job_application
    existing = get_active_job_application(db, db_job.id, alumni.id)
    if existing:
        return StandardResponse(
            success=True,
            code=SuccessCode.SUCCESS.value,
            message="You have already applied for this job",
            data={"application_ref_id": existing.id}
        )
        
    resume_file_url = None
    if resume and resume.filename:
        try:
            result = cloudinary.uploader.upload(
                resume.file,
                folder=f"pace/resumes/{alumni.id}",
                resource_type="auto"
            )
            resume_file_url = result.get("secure_url")
        except Exception as e:
            print(f"Failed to upload resume to Cloudinary: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload resume file")

    application = create_job_application(
        db,
        db_job,
        alumni.id,
        resume_file_url=resume_file_url,
        performed_by=current_user.id,
    )

    from core.redis import cache_delete_pattern
    
    # Invalidate activity cache for all permutations (limit, offset)
    cache_delete_pattern(f"alumni_activity:*user_id={str(current_user.user_id)}*")

    return StandardResponse(
        success=True,
        code=SuccessCode.SUCCESS.value,
        message="Application submitted successfully",
        data={"application_ref_id": application.id}
    )


@router.get("/my-applications", response_model=StandardResponse)
def get_my_applications(
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Get all job applications submitted by the current alumni.
    """
    from services.queries.alumni_queries import get_alumni_by_user_ref_id
    from services.queries.jobs_queries import get_alumni_applications

    alumni = get_alumni_by_user_ref_id(db, _require_current_user_id(current_user))
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni profile not found")

    applications = get_alumni_applications(db, alumni.id)
    
    # Enrich with job details
    result = []
    for app in applications:
        job = get_job_listing(db, app.job_listing_ref_id)
        if job:
            logo = ""
            # Fetch logo from Employer if it's an internal job
            if job.employer_ref_id:
                employer = db.exec(select(Employer).where(Employer.id == job.employer_ref_id)).first()
                if employer:
                    logo = employer.company_logo_url
            
            result.append({
                "application_ref_id": app.id,
                "job_listing_id": str(job.id),
                "job_title": job.title,
                "company": job.company,
                "logo": logo,
                "status": app.status,
                "applied_at": app.applied_at,
                "interview_date": app.interview_date.isoformat() if app.interview_date else None,
                "interview_link": app.interview_link,
            })

    return StandardResponse(
        success=True,
        code=SuccessCode.SUCCESS.value,
        message="Applications retrieved successfully",
        data=result
    )


@router.get("/{job_listing_id}", response_model=JobListingRead)
def get_job(
    job_listing_id: str,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Get a specific job listing by ID.
    """
    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    if db_job.is_deleted:
        raise HTTPException(status_code=404, detail="Job listing not found")
    
    # Enrich with logo if internal
    if db_job.employer_ref_id:
        employer = db.exec(select(Employer).where(Employer.id == db_job.employer_ref_id)).first()
        if employer:
            # We use model_validate and then add the logo because logo is not in the DB model
            # but is in the response model (JobListingRead)
            result = JobListingRead.model_validate(db_job)
            result.logo = employer.company_logo_url
            return result
            
    return db_job


@router.get("/{job_listing_id}/applicants", response_model=StandardResponse)
def get_job_applicants_route(
    job_listing_id: str,
    db: Session = Depends(get_session),
    current_user: CurrentUser = Depends(require_authenticated),
):
    """
    Get all applicants for a specific job listing. Only accessible by the employer who posted the job or staff/admin.
    """
    from services.queries.jobs_queries import get_job_applicants, get_job_listing
    from services.queries.alumni_queries import get_alumni_by_id_any

    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    if db_job.is_deleted:
        raise HTTPException(status_code=404, detail="Job listing not found")

    # Authorization Check
    is_staff_admin = current_user.user_type in ["ADMIN", "STAFF"]
    
    is_owner = False
    if current_user.user_type == "EMPLOYER":
        from services.queries.employers_queries import get_employer_by_user_ref_id
        employer = get_employer_by_user_ref_id(db, _require_current_user_id(current_user))
        if employer and db_job.employer_ref_id == employer.id:
            is_owner = True

    if not (is_staff_admin or is_owner):
        raise HTTPException(status_code=403, detail="Not authorized to view applicants for this job")

    applications = get_job_applicants(db, job_listing_id)
    
    # Enrich with alumni details
    result = []
    for app in applications:
        alumni = db.exec(select(Alumni).where(Alumni.id == app.alumni_ref_id)).first()
        if alumni:
            user = db.exec(select(User).where(User.id == alumni.user_ref_id)).first()
            result.append({
                "application_ref_id": app.id,
                "job_listing_id": str(db_job.id),
                "alumni_id": alumni.alumni_id,
                "first_name": alumni.first_name,
                "last_name": alumni.last_name,
                "email": user.email if user else None,
                "status": app.status,
                "applied_at": app.applied_at
            })

    return StandardResponse(
        success=True,
        code=SuccessCode.SUCCESS.value,
        message="Applicants retrieved successfully",
        data=result
    )
