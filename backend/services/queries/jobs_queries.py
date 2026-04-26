import uuid
from typing import Optional, List

from sqlmodel import Session, select

from models.job_listings import JobListing, JobListingCreate, JobListingUpdate, JobApplication
from models.response_codes import ErrorCode
from models.user_activities import ActivityType
from services.queries.audit import stamp_create, stamp_restore, stamp_soft_delete, stamp_update
from services.queries.transaction_logs_queries import create_transaction_log
from services.queries.user_activities_queries import create_user_activity


def create_job_listing(
    db: Session,
    job: JobListingCreate,
    employer_ref_id: Optional[uuid.UUID] = None,
    performed_by: str | uuid.UUID | None = None,
) -> JobListing:
    db_job = JobListing.model_validate(job, from_attributes=True)
    if employer_ref_id:
        db_job.employer_ref_id = employer_ref_id
    stamp_create(db_job, performed_by)
    db.add(db_job)
    create_transaction_log(
        db,
        tl_name=f"CREATED job {db_job.title}",
        after=db_job,
        performed_by=performed_by,
    )
    db.commit()
    db.refresh(db_job)
    return db_job

def get_job_listing(db: Session, job_listing_id: uuid.UUID | str) -> Optional[JobListing]:
    try:
        ref_id = uuid.UUID(str(job_listing_id))
    except (TypeError, ValueError):
        return None
    return db.exec(select(JobListing).where(JobListing.id == ref_id)).first()

def update_job_listing(
    db: Session,
    job_listing_id: uuid.UUID | str,
    job_update: JobListingUpdate,
    performed_by: str | uuid.UUID | None = None,
) -> Optional[JobListing]:
    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        return None

    before_state = db_job.model_dump(mode="json")
    job_data = job_update.model_dump(exclude_unset=True)
    for key, value in job_data.items():
        setattr(db_job, key, value)

    stamp_update(db_job)
    db.add(db_job)
    create_transaction_log(
        db,
        tl_name=f"UPDATED job {db_job.title}",
        before=before_state,
        after=db_job,
        performed_by=performed_by,
    )
    db.commit()
    db.refresh(db_job)
    return db_job

def delete_job_listing(
    db: Session,
    job_listing_id: uuid.UUID | str,
    performed_by: str | uuid.UUID | None = None,
) -> bool:
    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        return False

    db_job.is_active = False
    stamp_soft_delete(db_job, performed_by)
    db.add(db_job)
    create_transaction_log(
        db,
        tl_name=f"DELETED job {db_job.title}",
        after=db_job,
        performed_by=performed_by,
    )
    db.commit()
    return True

def toggle_job_listing_visibility(
    db: Session,
    job_listing_id: uuid.UUID | str,
    performed_by: str | uuid.UUID | None = None,
) -> Optional[JobListing]:
    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        return None

    before_state = {"is_active": db_job.is_active}
    db_job.is_active = not db_job.is_active
    stamp_update(db_job)
    db.add(db_job)
    create_transaction_log(
        db,
        tl_name=f"UPDATED job visibility {db_job.title}",
        before=before_state,
        after={"is_active": db_job.is_active},
        performed_by=performed_by,
    )
    db.commit()
    db.refresh(db_job)
    return db_job

def get_local_active_jobs(db: Session, keywords: Optional[str] = None) -> List[JobListing]:
    query = select(JobListing).where(
        (JobListing.is_active == True) & (JobListing.is_deleted == False)
    )
    if keywords:
        query = query.where(JobListing.title.contains(keywords) | JobListing.description.contains(keywords))

    return db.exec(query).all()

def create_job_application(
    db: Session,
    job_listing: JobListing,
    alumni_ref_id: uuid.UUID,
    performed_by: str | uuid.UUID | None = None,
) -> JobApplication:
    """Create a new job application."""
    application = JobApplication(job_listing_ref_id=job_listing.id, alumni_ref_id=alumni_ref_id)
    stamp_create(application, performed_by)
    db.add(application)
    create_transaction_log(
        db,
        tl_name=f"SUBMITTED job application for {job_listing.title}",
        after=application,
        performed_by=performed_by,
    )
    if performed_by is not None:
        create_user_activity(
            session=db,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.JOB_APPLICATION,
            description=f"Applied for job: {job_listing.title} at {job_listing.company}",
            activity_metadata={
                "job_listing_ref_id": str(job_listing.id),
            },
        )
    db.commit()
    db.refresh(application)
    return application

def get_job_application(db: Session, job_listing_ref_id: uuid.UUID, alumni_ref_id: uuid.UUID) -> Optional[JobApplication]:
    """Check if an alumni has already applied to a job (any status)."""
    return db.exec(
        select(JobApplication)
        .where(JobApplication.job_listing_ref_id == job_listing_ref_id)
        .where(JobApplication.alumni_ref_id == alumni_ref_id)
        .where(JobApplication.is_deleted == False)
    ).first()

def get_active_job_application(db: Session, job_listing_ref_id: uuid.UUID, alumni_ref_id: uuid.UUID) -> Optional[JobApplication]:
    """Check if an alumni has an active (non-rejected) application to a job."""
    return db.exec(
        select(JobApplication)
        .where(JobApplication.job_listing_ref_id == job_listing_ref_id)
        .where(JobApplication.alumni_ref_id == alumni_ref_id)
        .where(JobApplication.is_deleted == False)
        .where(JobApplication.status != "Rejected")
    ).first()

def get_job_application_by_ref_id(
    db: Session, application_ref_id: str | uuid.UUID
) -> Optional[JobApplication]:
    try:
        ref_id = uuid.UUID(str(application_ref_id))
    except (TypeError, ValueError):
        return None

    return db.exec(
        select(JobApplication).where(
            (JobApplication.id == ref_id) & (JobApplication.is_deleted == False)
        )
    ).first()

def get_alumni_applications(db: Session, alumni_ref_id: uuid.UUID) -> List[JobApplication]:
    """Get all applications for a specific alumni."""
    return db.exec(
        select(JobApplication)
        .where(JobApplication.alumni_ref_id == alumni_ref_id)
        .where(JobApplication.is_deleted == False)
        .order_by(JobApplication.applied_at.desc())
    ).all()

def get_job_applicants(db: Session, job_listing_id: uuid.UUID | str) -> List[JobApplication]:
    """Get all applicants for a specific job."""
    db_job = get_job_listing(db, job_listing_id)
    if not db_job:
        return []

    return db.exec(
        select(JobApplication)
        .where(JobApplication.job_listing_ref_id == db_job.id)
        .where(JobApplication.is_deleted == False)
        .order_by(JobApplication.applied_at.desc())
    ).all()

def get_employer_applications(db: Session, employer_ref_id: uuid.UUID) -> List[JobApplication]:
    """Get all applications for all jobs owned by a specific employer."""
    return db.exec(
        select(JobApplication)
        .join(JobListing)
        .where(JobListing.employer_ref_id == employer_ref_id)
        .where(JobApplication.is_deleted == False)
        .order_by(JobApplication.applied_at.desc())
    ).all()

def update_job_application_status(
    db: Session,
    application_ref_id: str | uuid.UUID,
    status: str,
    performed_by: str | uuid.UUID | None = None,
) -> Optional[JobApplication]:
    """Update the status of a job application."""
    application = get_job_application_by_ref_id(db, application_ref_id)

    if not application:
        return None

    before_state = {"status": application.status}
    application.status = status
    stamp_update(application)

    db.add(application)
    create_transaction_log(
        db,
        tl_name=f"UPDATED job application status {application.id}",
        before=before_state,
        after={"status": application.status},
        performed_by=performed_by,
    )
    db.commit()
    db.refresh(application)
    return application
