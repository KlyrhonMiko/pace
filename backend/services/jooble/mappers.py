from models.job_listings import JobListing

def _map_db_job_to_dict(job: JobListing, company_logo_url: str = None) -> dict:
    """Maps database JobListing model to the dictionary format expected by frontend."""
    # Construct salary string if raw_salary is missing or generic
    salary_display = job.raw_salary
    if not salary_display or salary_display.strip().lower() == "negotiable":
        if job.salary_min and job.salary_max:
            salary_display = f"₱{job.salary_min:,.0f} - ₱{job.salary_max:,.0f}"
        elif job.salary_min:
            salary_display = f"₱{job.salary_min:,.0f}"
        elif job.salary_max:
            salary_display = f"₱{job.salary_max:,.0f}"
        else:
            salary_display = "Negotiable"

    return {
        "id": str(job.external_id) if job.external_id else str(job.id),
        "db_id": str(job.id),
        "title": job.title or "",
        "company": job.company or "",
        "location": job.location or "Philippines",
        "salary": salary_display,
        "logo": company_logo_url or "",
        "type": job.job_type or "Full-time",
        "work_type": job.work_type or "On-site",
        "experience_level": job.experience_level or "Mid-Level",
        "snippet": job.description or "",
        "description": job.description or "",
        "requirements": job.requirements or "",
        "link": job.source_url or "",
        "source": job.source_api or "Internal",
        "updated": str(job.updated_at),
        "is_active": job.is_active,
    }
