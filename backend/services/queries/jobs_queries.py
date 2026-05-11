import uuid
from typing import Optional, List

from sqlmodel import Session, select

from models.job_listings import JobListing, JobListingCreate, JobListingUpdate, JobApplication
from models.response_codes import ErrorCode
from models.user_activities import ActivityType
from services.queries.audit import stamp_create, stamp_restore, stamp_soft_delete, stamp_update
from services.queries.transaction_logs_queries import create_transaction_log
from services.queries.user_activities_queries import create_user_activity
from services.machines.job_matching import job_matching_service

def create_job_listing(
    db: Session,
    job: JobListingCreate,
    employer_ref_id: Optional[uuid.UUID] = None,
    performed_by: str | uuid.UUID | None = None,
) -> JobListing:
    db_job = JobListing.model_validate(job, from_attributes=True)
    if employer_ref_id:
        db_job.employer_ref_id = employer_ref_id
        
    # Generate vector embedding for semantic matching
    text_to_embed = f"{db_job.title} {db_job.description} {db_job.requirements or ''}"
    try:
        embedding_bytes = job_matching_service.generate_and_serialize(text_to_embed)
        if embedding_bytes is not None:
            db_job.vector_embedding = embedding_bytes
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to generate embedding for job {db_job.title}: {e}")
        
    stamp_create(db_job, performed_by)
    db.add(db_job)
    create_transaction_log(
        db,
        tl_name=f"CREATED job {db_job.title}",
        after=db_job,
        performed_by=performed_by,
    )
    if performed_by is not None:
        create_user_activity(
            session=db,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.POST_JOB,
            description=f"Posted a new job: {db_job.title}",
            activity_metadata={
                "job_listing_ref_id": str(db_job.id),
            },
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

    before_state = db_job.model_dump(mode="json", exclude={"vector_embedding"})
    job_data = job_update.model_dump(exclude_unset=True)
    for key, value in job_data.items():
        setattr(db_job, key, value)

    # Re-generate vector embedding if relevant fields are updated
    if "title" in job_data or "description" in job_data or "requirements" in job_data:
        text_to_embed = f"{db_job.title} {db_job.description} {db_job.requirements or ''}"
        try:
            embedding_bytes = job_matching_service.generate_and_serialize(text_to_embed)
            if embedding_bytes is not None:
                db_job.vector_embedding = embedding_bytes
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to generate embedding for job {db_job.title}: {e}")

    stamp_update(db_job)
    db.add(db_job)
    create_transaction_log(
        db,
        tl_name=f"UPDATED job {db_job.title}",
        before=before_state,
        after=db_job,
        performed_by=performed_by,
    )
    if performed_by is not None:
        create_user_activity(
            session=db,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.UPDATE_JOB,
            description=f"Updated job details: {db_job.title}",
            activity_metadata={
                "job_listing_ref_id": str(db_job.id),
            },
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
    if performed_by is not None:
        create_user_activity(
            session=db,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.DELETE_JOB,
            description=f"Deleted job listing: {db_job.title}",
            activity_metadata={
                "job_listing_title": db_job.title,
            },
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
    if performed_by is not None:
        status_text = "visible" if db_job.is_active else "hidden"
        create_user_activity(
            session=db,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.TOGGLE_JOB_VISIBILITY,
            description=f"Made job listing {status_text}: {db_job.title}",
            activity_metadata={
                "job_listing_ref_id": str(db_job.id),
                "is_active": db_job.is_active
            },
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

def get_jobs_with_embeddings(db: Session) -> List[JobListing]:
    """Get all active jobs that have a pre-computed vector embedding."""
    return db.exec(
        select(JobListing).where(
            (JobListing.is_active == True) & 
            (JobListing.is_deleted == False) & 
            (JobListing.vector_embedding != None)
        )
    ).all()


def get_embedded_job_tuples(db: Session) -> list[tuple]:
    """Return lightweight (id, embedding, title, company, employer_ref_id) tuples for matching.

    Avoids loading heavy text columns (description, requirements) for the full set;
    the match route loads full rows only for the top-50 after similarity computes.
    """
    rows = db.exec(
        select(
            JobListing.id,
            JobListing.vector_embedding,
            JobListing.title,
            JobListing.company,
            JobListing.employer_ref_id,
        ).where(
            (JobListing.is_active == True)
            & (JobListing.is_deleted == False)
            & (JobListing.vector_embedding != None)
        )
    ).all()
    return [(r[0], r[1], r[2], r[3] or "Unknown Company", r[4]) for r in rows]

def create_job_application(
    db: Session,
    job_listing: JobListing,
    alumni_ref_id: uuid.UUID,
    resume_file_url: Optional[str] = None,
    performed_by: str | uuid.UUID | None = None,
) -> JobApplication:
    """Create a new job application."""
    application = JobApplication(
        job_listing_ref_id=job_listing.id, 
        alumni_ref_id=alumni_ref_id,
        resume_file_url=resume_file_url
    )
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
    
    try:
        from schemas.notifications import NotificationCreate
        from services.queries.notifications_queries import create_notification
        from services.notifications import publish_notification
        from models.employers import Employer
        import logging

        if job_listing.employer_ref_id:
            employer = db.exec(select(Employer).where(Employer.id == job_listing.employer_ref_id)).first()
            if employer and employer.user_ref_id:
                from models.alumni import Alumni
                alumni = db.exec(select(Alumni).where(Alumni.id == alumni_ref_id)).first()
                alumni_name = f"{alumni.first_name} {alumni.last_name}" if alumni else "Someone"
                
                notif = NotificationCreate(
                    user_ref_id=employer.user_ref_id,
                    title="New Job Application",
                    message=f"{alumni_name} applied for your job: {job_listing.title}.",
                    link=f"/dashboard/employer/applications"
                )
                created_notif = create_notification(db, notif)
                publish_notification(employer.user_ref_id, created_notif)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to create job application notification: {e}")

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

def get_employer_applications(db: Session, employer_ref_id: uuid.UUID, limit: Optional[int] = None) -> List[JobApplication]:
    """Get all applications for all jobs owned by a specific employer."""
    query = select(JobApplication).join(JobListing).where(JobListing.employer_ref_id == employer_ref_id).where(JobApplication.is_deleted == False).order_by(JobApplication.applied_at.desc())
    if limit:
        query = query.limit(limit)
    return db.exec(query).all()

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
    if performed_by is not None:
        job = get_job_listing(db, application.job_listing_ref_id)
        from models.alumni import Alumni
        alumni = db.exec(select(Alumni).where(Alumni.id == application.alumni_ref_id)).first()
        alumni_name = f"{alumni.first_name} {alumni.last_name}" if alumni else "an applicant"
        
        create_user_activity(
            session=db,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.UPDATE_JOB_APPLICATION,
            description=f"{status} application for {job.title if job else 'job'} from {alumni_name}",
            activity_metadata={
                "application_ref_id": str(application.id),
                "status": status
            },
        )
    db.commit()
    db.refresh(application)

    try:
        from schemas.notifications import NotificationCreate
        from services.queries.notifications_queries import create_notification
        from services.notifications import publish_notification
        from models.alumni import Alumni

        alumni = db.exec(select(Alumni).where(Alumni.id == application.alumni_ref_id)).first()
        if alumni and alumni.user_ref_id:
            job = get_job_listing(db, application.job_listing_ref_id)
            if job:
                notif = NotificationCreate(
                    user_ref_id=alumni.user_ref_id,
                    title="Job Application Update",
                    message=f"Your application for {job.title} at {job.company or 'the company'} was updated to: {status}.",
                    link=f"/dashboard/alumni/applications"
                )
                created_notif = create_notification(db, notif)
                publish_notification(alumni.user_ref_id, created_notif)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to create application status notification: {e}")

    return application

def update_job_application_schedule(
    db: Session,
    application_ref_id: str | uuid.UUID,
    interview_date: Optional[str] = None,
    interview_link: Optional[str] = None,
    performed_by: str | uuid.UUID | None = None,
) -> Optional[JobApplication]:
    from datetime import datetime
    
    application = get_job_application_by_ref_id(db, application_ref_id)
    if not application:
        return None

    is_reschedule = application.interview_date is not None
    before_state = {"interview_date": str(application.interview_date) if application.interview_date else None, "interview_link": application.interview_link}
    
    if interview_date is not None:
        try:
            from utils.timezone import convert_to_gmt8
            parsed_date = datetime.fromisoformat(interview_date.replace('Z', '+00:00'))
            # Convert to GMT+8 and strip timezone for naive storage in SQLite
            application.interview_date = convert_to_gmt8(parsed_date).replace(tzinfo=None)
        except ValueError:
            pass # Keep it as is or handle error, for simplicity let's just ignore invalid strings
    else:
        application.interview_date = None
        
    application.interview_link = interview_link
    
    # Auto-update status to Interview if currently Pending or Reviewed
    if interview_date and application.status in ["Pending", "Reviewed"]:
        application.status = "Interview"
        
    stamp_update(application)

    db.add(application)
    
    action_name = "RESCHEDULED" if is_reschedule else "UPDATED"
    create_transaction_log(
        db,
        tl_name=f"{action_name} job application schedule {application.id}",
        before=before_state,
        after={"interview_date": str(application.interview_date), "interview_link": application.interview_link},
        performed_by=performed_by,
    )

    if performed_by is not None:
        job = get_job_listing(db, application.job_listing_ref_id)
        from models.alumni import Alumni
        alumni = db.exec(select(Alumni).where(Alumni.id == application.alumni_ref_id)).first()
        alumni_name = f"{alumni.first_name} {alumni.last_name}" if alumni else "an applicant"
        
        verb = "Rescheduled" if is_reschedule else "Scheduled"
        create_user_activity(
            session=db,
            user_ref_id=performed_by,
            actor_ref_id=performed_by,
            activity_type=ActivityType.SCHEDULE_INTERVIEW,
            description=f"{verb} interview for {job.title if job else 'job'} with {alumni_name}",
            activity_metadata={
                "application_ref_id": str(application.id),
                "interview_date": str(application.interview_date)
            },
        )

    db.commit()
    db.refresh(application)

    try:
        from schemas.notifications import NotificationCreate
        from services.queries.notifications_queries import create_notification
        from services.notifications import publish_notification
        from models.alumni import Alumni
        from utils.timezone import format_datetime_gmt8

        alumni = db.exec(select(Alumni).where(Alumni.id == application.alumni_ref_id)).first()
        if alumni and alumni.user_ref_id:
            job = get_job_listing(db, application.job_listing_ref_id)
            if job:
                verb = "rescheduled" if is_reschedule else "scheduled"
                title = "Interview Rescheduled" if is_reschedule else "Interview Scheduled"
                
                message = f"An interview has been {verb} for your application for {job.title} at {job.company or 'the company'}."
                if application.interview_date:
                    formatted_date = format_datetime_gmt8(application.interview_date, fmt='%b %d, %Y at %I:%M %p')
                    message = f"Your interview for {job.title} at {job.company or 'the company'} has been {verb} for {formatted_date}."
                
                notif = NotificationCreate(
                    user_ref_id=alumni.user_ref_id,
                    title=title,
                    message=message,
                    link=f"/dashboard/alumni/applications"
                )
                created_notif = create_notification(db, notif)
                publish_notification(alumni.user_ref_id, created_notif)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to create application schedule notification: {e}")

    return application
