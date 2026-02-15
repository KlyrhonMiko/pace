import httpx
import math
import asyncio 
import traceback
import httpx
import math
import asyncio 
import traceback
from typing import Optional
from datetime import datetime, timedelta

from sqlmodel import Session, select, col, or_, func
from core.config import settings
from core.database import engine
from core.redis import cache_get, cache_set, generate_cache_key, cache_invalidate_job_searches, cache_invalidate_recommended
from models.job_listings import JobListing
from fastapi import BackgroundTasks

from .constants import JOOBLE_API_URL, JOOBLE_BATCH_SIZE
from .facets import _get_facet_counts
from .normalization import _normalize_job_dict
from .mappers import _map_db_job_to_dict

def load_all_jobs_to_cache(session: Session) -> int:
    """
    Load all active jobs from database into Redis cache.
    Called on app startup and periodically to refresh the bulk cache.
    
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
    query = select(JobListing).where(JobListing.is_active == True).order_by(func.random()).limit(limit)
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
    session: Optional['Session'] = None,
    background_tasks: Optional['BackgroundTasks'] = None,
    has_salary: bool = False
) -> dict:
    """Fetch job listings from Jooble API with lazy caching."""
    print(f"\n[FETCH_JOBS] Searching: keywords={keywords}, location={location}, job_type={job_type}, work_type={work_type}, experience_level={experience_level}, page={page}")
    
    # Generate cache key
    cache_key = generate_cache_key(
        "job_search",
        keywords=keywords,
        location=location,
        job_type=job_type,
        work_type=work_type,
        experience_level=experience_level,
        page=page,
        results_per_page=results_per_page,
        salary=salary,
        has_salary=has_salary
    )
    
    # Check Redis cache
    from core.redis import cache_get
    cached_result = cache_get(cache_key)
    if cached_result is not None:
        print(f"[FETCH_JOBS] ✓ Cache hit! Returning cached results")
        return cached_result
    
    print(f"[FETCH_JOBS] Cache miss - fetching from Jooble API")
    
    # Normalize location
    search_location = location
    if location and location != "Philippines" and "philippines" not in location.lower():
        search_location = f"{location}, Philippines"
    
    # Check for API key
    if not settings.JOOBLE_API_KEY or settings.JOOBLE_API_KEY == "your_api_key_here":
        return {"jobs": [], "totalCount": 0, "error": "Jooble API key not configured."}
    
    # Build API payl load
    api_keywords = keywords or ""
    if job_type:
        api_keywords = f"{api_keywords} {job_type}".strip()
    
    payload = {
        "keywords": api_keywords,
        "location": search_location or "Philippines",
        "page": "1",
        "ResultOnPage": str(JOOBLE_BATCH_SIZE),
    }
    if salary:
        payload["salary"] = str(salary)
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:  # Increased timeout for multi-page fetching
            normalized_jobs = []
            total_available = 0
            page_num = 1
            
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
                
                response = await client.post(JOOBLE_API_URL, json=payload, headers={"Content-Type": "application/json"})
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
                    
                    # Override generic Philippines location
                    if job_data["location"] == "Philippines" and search_location and search_location != "Philippines":
                        job_data["location"] = search_location
                    
                    # Skip jobs without salary if requested
                    if has_salary and not any(char.isdigit() for char in job_data.get("salary", "")):
                        continue
                    
                    normalized_jobs.append(job_data)
                
                # Stop if we've fetched all available or hit 1000
                if len(normalized_jobs) >= 1000 or len(batch_jobs) < JOOBLE_BATCH_SIZE:
                    break
                
                page_num += 1
            
            print(f"[FETCH_JOBS] Fetched {len(normalized_jobs)} jobs from {page_num} page(s)")
            
            # Trigger background fetch for remaining pages beyond 1000
            if total_available > 1000:
                background_tasks.add_task(
                    fetch_all_remaining_jobs,
                    keywords=keywords,
                    location=search_location,
                    salary=salary,
                    start_page=page_num + 1,
                    total_count=total_available,
                    fetch_start_time=datetime.utcnow(),
                    job_type=job_type,
                    has_salary=has_salary
                )
            
            # Filter by work_type and experience_level
            if work_type:
                # Exact matches for work type
                work_type_lower = work_type.lower().strip()
                normalized_jobs = [j for j in normalized_jobs 
                                  if j.get('work_type', '').lower() == work_type_lower]
                print(f"[FETCH_JOBS] Filtered by work_type={work_type}: {len(normalized_jobs)} jobs remain")
            
            if experience_level:
                # Exact matches for experience level
                exp_level_lower = experience_level.lower().strip()
                normalized_jobs = [j for j in normalized_jobs 
                                  if j.get('experience_level', '').lower() == exp_level_lower]
                print(f"[FETCH_JOBS] Filtered by experience_level={experience_level}: {len(normalized_jobs)} jobs remain")
            
            # Paginate
            total_count = len(normalized_jobs)
            start_idx = (page - 1) * results_per_page
            end_idx = start_idx + results_per_page
            paginated_jobs = normalized_jobs[start_idx:end_idx]
            
            result = {"jobs": paginated_jobs, "totalCount": total_count}
            
            # Cache result
            cache_set(cache_key, result, ttl=3600)
            print(f"[FETCH_JOBS] ✓ Cached {len(paginated_jobs)} results from Jooble API (TTL: 3600s)")
            
            return result
            
    except httpx.HTTPStatusError as e:
        print(f"[FETCH_JOBS] API error: {e.response.status_code}")
        return {"jobs": [], "totalCount": 0, "error": f"Jooble API error: {e.response.status_code}"}
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
    has_salary: bool = False
):

    
    MAX_JOBS_LIMIT = 5000  # Fetch up to 5000 jobs in background
    
    if fetch_start_time is None:
        fetch_start_time = datetime.utcnow()

    real_limit = min(total_count, MAX_JOBS_LIMIT)
    total_pages = math.ceil(real_limit / JOOBLE_BATCH_SIZE)
    
    if start_page > total_pages:
        return

    print(f"Starting background fetch for {real_limit} jobs (Pages {start_page} to {total_pages})...")

    async with httpx.AsyncClient(timeout=60.0) as client:  # Increased timeout for multi-page fetching
        for p in range(start_page, total_pages + 1):
            try:
                # Small delay to be nice to API
                await asyncio.sleep(1.0)
                
                # Construct keywords with job type if passed
                api_keywords = keywords or ""
                if job_type:
                    api_keywords = f"{api_keywords} {job_type}".strip()

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
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code != 200:
                    print(f"Background fetch failed for page {p}: {response.status_code}")
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
