import uuid
import httpx
import math
import asyncio
import traceback
from typing import Optional
from datetime import datetime
from sqlmodel import Session, select, func
from core.config import settings
from core.redis import (
    cache_get,
    cache_set,
    generate_cache_key,
)
from models.job_listings import JobListing
from fastapi import BackgroundTasks
from utils.timezone import get_current_time_gmt8

from .constants import JOOBLE_API_URL, JOOBLE_BATCH_SIZE
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


def load_all_jobs_to_cache(session: Session) -> int:
    """
    Load all active jobs from database into Redis cache.
    Called on app startup and periodically to refresh the batch cache.

    Returns:
        Number of jobs cached
    """
    try:
        query = select(JobListing).where(JobListing.is_active == True)
        all_jobs = session.exec(query).all()

        # Convert to dict format
        jobs_data = [_map_db_job_to_dict(job) for job in all_jobs]

        # Cache for 6 hours
        from core.redis import cache_set_all_jobs

        cache_set_all_jobs(jobs_data, ttl=21600)

        return len(jobs_data)
    except Exception as e:
        print(f"[ERROR] Failed to load jobs to cache: {e}")
        return 0


def get_recommended_jobs(session: Session, limit: int = 3) -> list[dict]:
    """
    Get recommended jobs from the database cache.
    Currently returns random active jobs.
    Uses Redis caching to avoid repeated database queries.
    """
    # Generate cache key
    cache_key = generate_cache_key("recommended_jobs", limit=limit)

    # 1. Check Redis cache first
    cached_result = cache_get(cache_key)
    if cached_result is not None:
        return cached_result

    # 2. Fall back to database query
    query = (
        select(JobListing)
        .where(JobListing.is_active == True)
        .order_by(func.random())
        .limit(limit)
    )
    jobs = session.exec(query).all()
    result = [_map_db_job_to_dict(job) for job in jobs]

    # 3. Cache the result (1 hour TTL)
    cache_set(cache_key, result, ttl=3600)

    return result


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
    employer_id: Optional[uuid.UUID] = None,
) -> dict:
    """Fetch job listings from Jooble API with lazy caching."""
    print(
        f"\n[FETCH_JOBS] Searching: keywords={keywords}, location={location}, job_type={job_type}, work_type={work_type}, experience_level={experience_level}, page={page}, employer_id={employer_id}"
    )

    # Generate cache key
    cache_key = generate_cache_key(
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
        employer_id=str(employer_id) if employer_id else None,
    )

    # Check Redis cache
    from core.redis import cache_get

    cached_result = cache_get(cache_key)
    if cached_result is not None:
        print("[FETCH_JOBS] ✓ Cache hit! Returning cached results")
        return cached_result

    print("[FETCH_JOBS] Cache miss - fetching from Jooble API")

    # Normalize location
    search_location = location
    if location and location != "Philippines" and "philippines" not in location.lower():
        search_location = f"{location}, Philippines"

    # Check for API key
    if not settings.JOOBLE_API_KEY or settings.JOOBLE_API_KEY == "your_api_key_here":
        return {"jobs": [], "totalCount": 0, "error": "Jooble API key not configured."}

    # Build API payload
    api_keywords = keywords or ""
    # Don't add job_type to keywords - filter it in Python instead

    payload = {
        "keywords": api_keywords,
        "location": search_location or "Philippines",
        "page": "1",
        "ResultOnPage": str(JOOBLE_BATCH_SIZE),
    }
    if salary:
        payload["salary"] = str(salary)

    try:
        async with httpx.AsyncClient(
            timeout=60.0
        ) as client:  # Increased timeout for multi-page fetching
            normalized_jobs = []
            total_available = 0
            page_num = 1

            # ONLY fetch from API if no employer_id filter is active
            if not employer_id:
                # Fetch up to 1000 jobs by fetching multiple pages
                while len(normalized_jobs) < 1000:
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
                    total_available = int(data.get("totalCount", 0))

                    if not batch_jobs:
                        break

                    # Normalize and add jobs from this page
                    for job in batch_jobs:
                        if len(normalized_jobs) >= 1000:
                            break

                        job_data = _normalize_job_dict(job)

                        # Skip jobs without salary if requested
                        if has_salary and not any(
                            char.isdigit() for char in job_data.get("salary", "")
                        ):
                            continue

                        normalized_jobs.append(job_data)

                    # Stop if we've fetched all available or hit 1000
                    if len(normalized_jobs) >= 1000 or len(batch_jobs) < JOOBLE_BATCH_SIZE:
                        break

                    page_num += 1

                print(
                    f"[FETCH_JOBS] Fetched {len(normalized_jobs)} jobs from {page_num} page(s)"
                )
            else:
                print(f"[FETCH_JOBS] Employer filter active (ID: {employer_id}) - skipping external API fetch")

            # Trigger background fetch for remaining pages beyond 1000
            if total_available > 1000:
                background_tasks.add_task(
                    fetch_all_remaining_jobs,
                    keywords=keywords,
                    location=search_location,
                    salary=salary,
                    start_page=page_num + 1,
                    total_count=total_available,
                    fetch_start_time=get_current_time_gmt8(),
                    job_type=job_type,
                    has_salary=has_salary,
                )

            # Fetch local jobs if session is provided
            local_jobs_data = []
            if session:
                query = select(JobListing)
                if not include_inactive:
                    query = query.where(JobListing.is_active == True)
                
                if keywords:
                    query = query.where(
                        (JobListing.title.contains(keywords)) | 
                        (JobListing.description.contains(keywords)) |
                        (JobListing.company.contains(keywords))
                    )
                if location and location != "Philippines":
                    query = query.where(JobListing.location.contains(location))
                if job_type:
                    query = query.where(JobListing.job_type == job_type)
                if work_type:
                    query = query.where(JobListing.work_type == work_type)
                if experience_level:
                    query = query.where(JobListing.experience_level == experience_level)
                if employer_id:
                    query = query.where(JobListing.employer_id == employer_id)
                
                local_jobs = session.exec(query).all()
                
                # Fetch logos for local jobs
                from models.employers import Employer
                employer_ids = {j.employer_id for j in local_jobs if j.employer_id}
                logo_map = {}
                if employer_ids:
                    employers = session.exec(select(Employer.employer_id, Employer.company_logo_url).where(Employer.employer_id.in_(list(employer_ids)))).all()
                    logo_map = {emp_id: logo for emp_id, logo in employers if logo}
                    
                local_jobs_data = [_map_db_job_to_dict(j, logo_map.get(j.employer_id)) for j in local_jobs]

            # Merge local jobs with API results (giving priority to local jobs)
            # Create a set of external IDs to avoid duplicates if we happen to fetch a job we already have locally
            local_external_ids = {j.get("external_id") for j in local_jobs_data if j.get("external_id")}
            
            combined_jobs = local_jobs_data + [
                j for j in normalized_jobs if j.get("id") not in local_external_ids
            ]

            print(f"[FETCH_JOBS] Combined jobs count: {len(combined_jobs)}")

            # Filter by location (case-insensitive contains check) - already filtered local, but filter API ones
            if location and location != "Philippines":
                location_lower = location.lower().strip()
                combined_jobs = [
                    j
                    for j in combined_jobs
                    if location_lower in j.get("location", "").lower()
                ]
                print(
                    f"[FETCH_JOBS] Filtered combined by location={location}: {len(combined_jobs)} jobs remain"
                )

            # Filter by job_type, work_type and experience_level - already filtered local, but filter API ones
            if job_type:
                job_type_lower = job_type.lower().strip()
                combined_jobs = [
                    j
                    for j in combined_jobs
                    if j.get("type", "").lower() == job_type_lower or j.get("job_type", "").lower() == job_type_lower
                ]
            if work_type:
                work_type_lower = work_type.lower().strip()
                combined_jobs = [
                    j
                    for j in combined_jobs
                    if j.get("work_type", "").lower() == work_type_lower
                ]
            if experience_level:
                exp_level_lower = experience_level.lower().strip()
                combined_jobs = [
                    j
                    for j in combined_jobs
                    if j.get("experience_level", "").lower() == exp_level_lower
                ]

            # Calculate facets from the combined list
            facets = {
                "jobTypes": {},
                "workTypes": {},
                "experienceLevels": {}
            }
            
            for j in combined_jobs:
                jt = j.get("type") or j.get("job_type") or "Full-time"
                wt = j.get("work_type") or "On-site"
                el = j.get("experience_level") or "Not specified"
                
                facets["jobTypes"][jt] = facets["jobTypes"].get(jt, 0) + 1
                facets["workTypes"][wt] = facets["workTypes"].get(wt, 0) + 1
                facets["experienceLevels"][el] = facets["experienceLevels"].get(el, 0) + 1

            # Paginate
            total_count = len(combined_jobs)
            start_idx = (page - 1) * results_per_page
            end_idx = start_idx + results_per_page
            paginated_jobs = combined_jobs[start_idx:end_idx]
            
            result = {"jobs": paginated_jobs, "totalCount": total_count, "facets": facets}

            # Cache result
            cache_set(cache_key, result, ttl=3600)
            print(
                f"[FETCH_JOBS] ✓ Cached {len(paginated_jobs)} results from Jooble API (TTL: 3600s)"
            )

            return result

    except httpx.HTTPStatusError as e:
        print(f"[FETCH_JOBS] API error: {e.response.status_code}")
        return {
            "jobs": [],
            "totalCount": 0,
            "error": f"Jooble API error: {e.response.status_code}",
        }
    except httpx.RequestError as e:
        print(f"[FETCH_JOBS] Request error: {str(e)}")
        return {"jobs": [], "totalCount": 0, "error": f"Request failed: {str(e)}"}
    except Exception as e:
        print(f"[FETCH_JOBS] Unexpected error: {str(e)}")
        traceback.print_exc()
        return {"jobs": [], "totalCount": 0, "error": f"Unexpected error: {str(e)}"}


async def fetch_all_remaining_jobs(
    keywords: Optional[str],
    location: Optional[str],
    salary: Optional[int],
    start_page: int,
    total_count: int,
    fetch_start_time: Optional[datetime] = None,
    job_type: Optional[str] = None,
    has_salary: bool = False,
):

    MAX_JOBS_LIMIT = 5000  # Fetch up to 5000 jobs in background

    if fetch_start_time is None:
        fetch_start_time = get_current_time_gmt8()

    real_limit = min(total_count, MAX_JOBS_LIMIT)
    total_pages = math.ceil(real_limit / JOOBLE_BATCH_SIZE)

    if start_page > total_pages:
        return

    print(
        f"Starting background fetch for {real_limit} jobs (Pages {start_page} to {total_pages})..."
    )

    async with httpx.AsyncClient(
        timeout=60.0
    ) as client:  # Increased timeout for multi-page fetching
        for p in range(start_page, total_pages + 1):
            try:
                # Small delay to be nice to API
                await asyncio.sleep(1.0)

                # construct keywords (don't add job_type here - filtered in main function)
                api_keywords = keywords or ""

                # Check if we should stop
                if _shutdown_event and _shutdown_event.is_set():
                    print(f"[JOOBLE] Background fetch aborted at page {p} due to shutdown signal")
                    break

                payload = {
                    "keywords": api_keywords,
                    "location": location or "Philippines",
                    "page": str(p),
                    "ResultOnPage": str(JOOBLE_BATCH_SIZE),
                }
                if salary:
                    payload["salary"] = str(salary)

                response = await client.post(
                    JOOBLE_API_URL,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code != 200:
                    print(
                        f"Background fetch failed for page {p}: {response.status_code}"
                    )
                    continue

                data = response.json()
                jobs = data.get("jobs", [])

                if not jobs:
                    break

                # Just skip the database saves to avoid deadlocks
                # Redis cache is sufficient for search performance
                print(f"Background fetch: Retrieved page {p} ({len(jobs)} jobs)")

            except Exception as e:
                print(f"Error in background fetch loop page {p}: {e}")
                break

    # CLEANUP STALE JOBS - DISABLED for performance
    # Aggressive cleanup on every search was causing slowdowns with 90+ DB writes per search
    # Jobs naturally age out via the 1-hour Redis cache and can be manually invalidated if needed
    # TODO: Implement lazy cleanup - only mark jobs inactive if not seen in 7+ days
