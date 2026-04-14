from models.job_listings import JobListing

def _map_db_job_to_dict(job: JobListing) -> dict:
    """Maps database JobListing model to the dictionary format expected by frontend."""
    return {
        "id": str(job.external_id) if job.external_id else str(job.id),
        "db_id": job.id,
        "title": job.title or "",
        "company": job.company or "",
        "location": job.location or "Philippines",
        "salary": job.raw_salary or "Negotiable",
        "type": job.job_type or "Full-time",
        "work_type": job.work_type or "On-site",
        "experience_level": job.experience_level or "Mid-Level",
        "snippet": job.description or "",
        "link": job.source_url or "",
        "source": job.source_api or "Jooble",
        "updated": str(job.updated_at),
        "is_active": job.is_active,
    }
