import uuid
import httpx
import asyncio
import traceback
from typing import Optional
from sqlmodel import Session, select, func
from core.config import settings
from core.redis import (
    cache_get,
    cache_set,
    generate_cache_key,
)
from models.job_listings import JobListing
from fastapi import BackgroundTasks

from .constants import JOOBLE_API_URL, JOOBLE_BATCH_SIZE, MAX_SYNC_PAGES, MAX_SYNC_ITEMS
from .normalization import _normalize_job_dict
from .mappers import _map_db_job_to_dict


# Global shutdown signal for background tasks
_shutdown_event: Optional[asyncio.Event] = None


def get_shutdown_event() -> asyncio.Event:
    """Lazy initialize and return the shutdown event"""
    global _shutdown_event
    if _shutdown_event is None:
        _shutdown_event = asyncio.Event()
    return _shutdown_event


def signal_shutdown():
    """Signal all background tasks to stop"""
    if _shutdown_event:
        _shutdown_event.set()
        print("[JOOBLE] Shutdown signal sent to background tasks")


async def get_recommended_jobs(session: Session, limit: int = 3) -> list[dict]:
    """
    Get recommended jobs from the local database.
    Returns a cached selection of recent active jobs. Cheap and predictable.
    Uses Redis caching to avoid repeated database queries.
    """
    cache_key = generate_cache_key("recommended_jobs", limit=limit)

    cached_result = cache_get(cache_key)
    if cached_result is not None and len(cached_result) > 0:
        return cached_result

    query = (
        select(JobListing)
        .where(JobListing.is_active == True)
        .where(JobListing.is_deleted == False)
        .order_by(JobListing.updated_at.desc())
        .limit(limit * 2)
    )
    jobs = session.exec(query).all()

    from models.employers import Employer

    employer_ref_ids = {j.employer_ref_id for j in jobs if j.employer_ref_id}
    logo_map = {}
    if employer_ref_ids:
        employers = session.exec(
            select(Employer.id, Employer.company_logo_url).where(
                Employer.id.in_(list(employer_ref_ids))
            )
        ).all()
        logo_map = {emp_id: logo for emp_id, logo in employers if logo}

    result = [_map_db_job_to_dict(job, logo_map.get(job.employer_ref_id)) for job in jobs]
    result = result[:limit]

    if result:
        cache_set(cache_key, result, ttl=3600)

    return result


def _build_local_jobs_query(
    keywords: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    work_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    salary: Optional[int] = None,
    has_salary: bool = False,
    include_inactive: bool = False,
    employer_ref_id: Optional[uuid.UUID] = None,
    local_only: bool = False,
):
    """Build a filtered local job listing query. Always excludes soft-deleted rows."""
    query = select(JobListing).where(JobListing.is_deleted == False)

    if not include_inactive:
        query = query.where(JobListing.is_active == True)

    if keywords:
        query = query.where(
            (JobListing.title.ilike(f"%{keywords}%"))
            | (JobListing.description.ilike(f"%{keywords}%"))
            | (JobListing.company.ilike(f"%{keywords}%"))
        )
    if location and location != "Philippines":
        query = query.where(JobListing.location.contains(location))
    if job_type:
        query = query.where(JobListing.job_type == job_type)
    if work_type:
        query = query.where(JobListing.work_type == work_type)
    if experience_level:
        query = query.where(JobListing.experience_level == experience_level)
    if has_salary:
        query = query.where(
            (JobListing.salary_min != None) | (JobListing.salary_max != None)
        )
    if salary is not None:
        query = query.where(
            ((JobListing.salary_max != None) & (JobListing.salary_max >= salary))
            | (
                (JobListing.salary_max == None)
                & (JobListing.salary_min != None)
                & (JobListing.salary_min >= salary)
            )
        )
    if employer_ref_id:
        query = query.where(JobListing.employer_ref_id == employer_ref_id)
    if local_only:
        query = query.where(
            (JobListing.source_api == "Internal") | (JobListing.source_api == None)
        )

    return query


def _fetch_local_jobs_with_logos(
    session: Session,
    keywords: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    work_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    salary: Optional[int] = None,
    has_salary: bool = False,
    include_inactive: bool = False,
    employer_ref_id: Optional[uuid.UUID] = None,
    local_only: bool = False,
) -> list[dict]:
    """Execute local job query and return enriched dicts with employer logos."""
    query = _build_local_jobs_query(
        keywords=keywords,
        location=location,
        job_type=job_type,
        work_type=work_type,
        experience_level=experience_level,
        salary=salary,
        has_salary=has_salary,
        include_inactive=include_inactive,
        employer_ref_id=employer_ref_id,
        local_only=local_only,
    )
    local_jobs = session.exec(query).all()

    from models.employers import Employer

    employer_ref_ids = {j.employer_ref_id for j in local_jobs if j.employer_ref_id}
    logo_map = {}
    if employer_ref_ids:
        employers = session.exec(
            select(Employer.id, Employer.company_logo_url).where(
                Employer.id.in_(list(employer_ref_ids))
            )
        ).all()
        logo_map = {emp_id: logo for emp_id, logo in employers if logo}

    return [_map_db_job_to_dict(j, logo_map.get(j.employer_ref_id)) for j in local_jobs]


async def _fetch_and_normalize_remote(
    api_keywords: str,
    search_location: str,
    salary: Optional[int],
    has_salary: bool,
) -> list[dict]:
    """Fetch up to MAX_SYNC_ITEMS jobs from Jooble, normalizing each."""
    normalized = []
    page_num = 1

    async with httpx.AsyncClient(timeout=60.0) as client:
        while page_num <= MAX_SYNC_PAGES and len(normalized) < MAX_SYNC_ITEMS:
            payload = {
                "keywords": api_keywords,
                "location": search_location or "Philippines",
                "page": str(page_num),
                "ResultOnPage": str(JOOBLE_BATCH_SIZE),
            }
            if salary:
                payload["salary"] = str(salary)

            response = await client.post(
                JOOBLE_API_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            data = response.json()
            batch_jobs = data.get("jobs", [])

            if not batch_jobs:
                break

            for job in batch_jobs:
                job_data = _normalize_job_dict(job)
                if has_salary and not any(
                    char.isdigit() for char in job_data.get("salary", "")
                ):
                    continue
                normalized.append(job_data)

            if len(batch_jobs) < JOOBLE_BATCH_SIZE:
                break

            page_num += 1

    print(f"[FETCH_JOBS] Fetched {len(normalized)} remote jobs from {page_num} page(s)")
    return normalized


def _compute_facets(jobs: list[dict]) -> dict:
    facets = {"jobTypes": {}, "workTypes": {}, "experienceLevels": {}}
    for j in jobs:
        jt = j.get("type") or j.get("job_type") or "Full-time"
        wt = j.get("work_type") or "On-site"
        el = j.get("experience_level") or "Not specified"
        facets["jobTypes"][jt] = facets["jobTypes"].get(jt, 0) + 1
        facets["workTypes"][wt] = facets["workTypes"].get(wt, 0) + 1
        facets["experienceLevels"][el] = facets["experienceLevels"].get(el, 0) + 1
    return facets


def _filter_external_jobs(
    jobs: list[dict],
    job_type: Optional[str] = None,
    work_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    location: Optional[str] = None,
) -> list[dict]:
    """Apply post-hoc filters to external job dicts (local jobs are pre-filtered in SQL)."""
    if location and location != "Philippines":
        loc_lower = location.lower().strip()
        jobs = [j for j in jobs if loc_lower in j.get("location", "").lower()]

    if job_type:
        jt_lower = job_type.lower().strip()
        jobs = [
            j
            for j in jobs
            if j.get("type", "").lower() == jt_lower
            or j.get("job_type", "").lower() == jt_lower
        ]
    if work_type:
        wt_lower = work_type.lower().strip()
        jobs = [j for j in jobs if (j.get("work_type") or "").lower() == wt_lower]
    if experience_level:
        el_lower = experience_level.lower().strip()
        jobs = [
            j for j in jobs if (j.get("experience_level") or "").lower() == el_lower
        ]

    return jobs


async def fetch_jobs(
    keywords: Optional[str] = None,
    location: Optional[str] = "Philippines",
    job_type: Optional[str] = None,
    work_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    page: int = 1,
    results_per_page: int = 10,
    salary: Optional[int] = None,
    session: Optional["Session"] = None,
    background_tasks: Optional["BackgroundTasks"] = None,
    has_salary: bool = False,
    include_inactive: bool = False,
    employer_ref_id: Optional[uuid.UUID] = None,
    local_only: bool = False,
) -> dict:
    """Local-first job search with optional bounded remote augmentation."""
    print(
        f"\n[FETCH_JOBS] Searching: keywords={keywords}, location={location}, "
        f"job_type={job_type}, work_type={work_type}, experience_level={experience_level}, "
        f"page={page}, local_only={local_only}, employer_ref_id={employer_ref_id}"
    )

    merged_cache_key = generate_cache_key(
        "job_search_v2",
        keywords=keywords,
        location=location,
        job_type=job_type,
        work_type=work_type,
        experience_level=experience_level,
        page=page,
        results_per_page=results_per_page,
        salary=salary,
        has_salary=has_salary,
        include_inactive=include_inactive,
        employer_ref_id=str(employer_ref_id) if employer_ref_id else None,
        local_only=local_only,
    )

    cached_result = cache_get(merged_cache_key)
    if cached_result is not None:
        print("[FETCH_JOBS] Cache hit — returning cached merged results")
        return cached_result

    print("[FETCH_JOBS] Cache miss — building fresh results")

    remote_error = None

    # ── 1. Local DB search (always runs first) ──
    local_jobs_data: list[dict] = []
    if session:
        local_jobs_data = _fetch_local_jobs_with_logos(
            session=session,
            keywords=keywords,
            location=location,
            job_type=job_type,
            work_type=work_type,
            experience_level=experience_level,
            salary=salary,
            has_salary=has_salary,
            include_inactive=include_inactive,
            employer_ref_id=employer_ref_id,
            local_only=local_only,
        )
        print(f"[FETCH_JOBS] Local jobs found: {len(local_jobs_data)}")

    # ── 2. Remote augmentation (bounded, cache-backed) ──
    remote_jobs: list[dict] = []
    wants_remote = not employer_ref_id and not local_only

    if wants_remote:
        search_location = location
        if location and location != "Philippines" and "philippines" not in location.lower():
            search_location = f"{location}, Philippines"

        api_keywords = keywords or ""

        remote_cache_key = generate_cache_key(
            "jooble_remote",
            keywords=api_keywords,
            location=search_location,
            salary=salary,
            has_salary=has_salary,
        )

        remote_cached = cache_get(remote_cache_key)
        if remote_cached is not None:
            print("[FETCH_JOBS] Remote cache hit — reusing normalized Jooble data")
            remote_jobs = remote_cached
        elif settings.JOOBLE_API_KEY and settings.JOOBLE_API_KEY != "your_api_key_here":
            try:
                remote_jobs = await _fetch_and_normalize_remote(
                    api_keywords=api_keywords,
                    search_location=search_location or "Philippines",
                    salary=salary,
                    has_salary=has_salary,
                )
                if remote_jobs:
                    cache_set(remote_cache_key, remote_jobs, ttl=7200)
                    print(
                        f"[FETCH_JOBS] Cached {len(remote_jobs)} normalized remote jobs (TTL: 7200s)"
                    )
            except httpx.HTTPStatusError as e:
                remote_error = f"Jooble API error: {e.response.status_code}"
                print(f"[FETCH_JOBS] {remote_error}")
            except httpx.RequestError as e:
                remote_error = f"Request failed: {str(e)}"
                print(f"[FETCH_JOBS] {remote_error}")
            except Exception as e:
                remote_error = f"Unexpected error: {str(e)}"
                traceback.print_exc()
        else:
            remote_error = "Jooble API key not configured."

    # ── 3. Filter external jobs ──
    filtered_remote = _filter_external_jobs(
        remote_jobs,
        job_type=job_type,
        work_type=work_type,
        experience_level=experience_level,
        location=location,
    )

    # ── 4. Merge local + remote (local-first, deduplicate by external_id) ──
    local_external_ids = {j.get("external_id") for j in local_jobs_data if j.get("external_id")}

    combined_jobs = local_jobs_data + [
        j for j in filtered_remote if j.get("id") not in local_external_ids
    ]
    print(f"[FETCH_JOBS] Combined jobs count: {len(combined_jobs)}")

    # ── 5. Facets from combined set ──
    facets = _compute_facets(combined_jobs)

    # ── 6. Paginate ──
    total_count = len(combined_jobs)
    start_idx = (page - 1) * results_per_page
    end_idx = start_idx + results_per_page
    paginated_jobs = combined_jobs[start_idx:end_idx]

    result: dict = {"jobs": paginated_jobs, "totalCount": total_count, "facets": facets}
    if remote_error and not local_jobs_data:
        result["error"] = remote_error

    cache_set(merged_cache_key, result, ttl=3600)
    print(f"[FETCH_JOBS] Cached merged result ({len(paginated_jobs)} jobs, TTL: 3600s)")

    return result
