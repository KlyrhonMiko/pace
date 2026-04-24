import uuid
from sqlmodel import Session, select
from typing import Optional, List
from models.job_listings import JobListing, JobListingCreate, JobListingUpdate, JobApplication
from utils.timezone import get_current_time_gmt8

def create_job_listing(db: Session, job: JobListingCreate, employer_id: Optional[uuid.UUID] = None) -> JobListing:
    db_job = JobListing.model_validate(job, from_attributes=True)
    if employer_id:
        db_job.employer_id = employer_id
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def get_job_listing(db: Session, job_id: int) -> Optional[JobListing]:
    return db.get(JobListing, job_id)

def update_job_listing(db: Session, job_id: int, job_update: JobListingUpdate) -> Optional[JobListing]:
    db_job = db.get(JobListing, job_id)
    if not db_job:
        return None
    
    job_data = job_update.model_dump(exclude_unset=True)
    for key, value in job_data.items():
        setattr(db_job, key, value)
    
    db_job.updated_at = get_current_time_gmt8()
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def delete_job_listing(db: Session, job_id: int) -> bool:
    db_job = db.get(JobListing, job_id)
    if not db_job:
        return False
    
    db_job.is_active = False
    db_job.updated_at = get_current_time_gmt8()
    db.add(db_job)
    db.commit()
    return True

def get_local_active_jobs(db: Session, keywords: Optional[str] = None) -> List[JobListing]:
    query = select(JobListing).where(JobListing.is_active == True)
    if keywords:
        query = query.where(JobListing.title.contains(keywords) | JobListing.description.contains(keywords))
    
    return db.exec(query).all()

def create_job_application(db: Session, job_id: int, alumni_code: uuid.UUID) -> JobApplication:
    """Create a new job application."""
    application = JobApplication(job_id=job_id, alumni_code=alumni_code)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

def get_job_application(db: Session, job_id: int, alumni_code: uuid.UUID) -> Optional[JobApplication]:
    """Check if an alumni has already applied to a job."""
    return db.exec(
        select(JobApplication)
        .where(JobApplication.job_id == job_id)
        .where(JobApplication.alumni_code == alumni_code)
    ).first()

def get_alumni_applications(db: Session, alumni_code: uuid.UUID) -> List[JobApplication]:
    """Get all applications for a specific alumni."""
    return db.exec(
        select(JobApplication)
        .where(JobApplication.alumni_code == alumni_code)
        .order_by(JobApplication.applied_at.desc())
    ).all()

def get_job_applicants(db: Session, job_id: int) -> List[JobApplication]:
    """Get all applicants for a specific job."""
    return db.exec(
        select(JobApplication)
        .where(JobApplication.job_id == job_id)
        .order_by(JobApplication.applied_at.desc())
    ).all()

def get_employer_applications(db: Session, employer_id: uuid.UUID) -> List[JobApplication]:
    """Get all applications for all jobs owned by a specific employer."""
    return db.exec(
        select(JobApplication)
        .join(JobListing)
        .where(JobListing.employer_id == employer_id)
        .order_by(JobApplication.applied_at.desc())
    ).all()
