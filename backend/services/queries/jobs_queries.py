from sqlmodel import Session, select
from typing import Optional, List
from models.job_listings import JobListing, JobListingCreate, JobListingUpdate
from utils.timezone import get_current_time_gmt8

def create_job_listing(db: Session, job: JobListingCreate) -> JobListing:
    db_job = JobListing.from_orm(job)
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
    
    job_data = job_update.dict(exclude_unset=True)
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
