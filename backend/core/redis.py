"""
Redis cache management for job listings
"""
import json
import redis
import os
from typing import Optional, Any
from datetime import timedelta

# Redis connection
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client: Optional[redis.Redis] = None

try:
    redis_client = redis.from_url(redis_url, decode_responses=True)
    if redis_client is not None:
        # Test connection
        redis_client.ping()
        print("[CACHE] Redis connected successfully")
except Exception as e:
    print(f"[CACHE ERROR] Failed to connect to Redis: {e}")
    redis_client = None


def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client instance"""
    return redis_client


def generate_cache_key(prefix: str, **kwargs) -> str:
    """
    Generate a cache key from prefix and kwargs.
    
    Args:
        prefix: Cache key prefix (e.g., "job_search", "recommended_jobs")
        **kwargs: Parameters to include in the key (order-independent)
    
    Returns:
        Cache key string
    """
    # Sort kwargs for consistent keys
    sorted_items = sorted(kwargs.items())
    params = "|".join([f"{k}={v}" for k, v in sorted_items if v is not None])
    return f"{prefix}:{params}" if params else prefix


def cache_get(key: str) -> Optional[dict]:
    """
    Get data from Redis cache
    
    Args:
        key: Cache key
        
    Returns:
        Cached data as dict or None if not found
    """
    if not redis_client:
        print(f"[CACHE] Redis not connected")
        return None
    
    try:
        data = redis_client.get(key)
        if data:
            print(f"[CACHE HIT] {key}")
            return json.loads(data) # type: ignore
        else:
            print(f"[CACHE MISS] {key}")
    except Exception as e:
        print(f"[CACHE ERROR] Error retrieving cache key '{key}': {e}")
    
    return None


def cache_set(key: str, data: dict, ttl: int = 3600) -> bool:
    """
    Set data in Redis cache
    
    Args:
        key: Cache key
        data: Data to cache (must be JSON serializable)
        ttl: Time to live in seconds (default 1 hour)
        
    Returns:
        True if successful, False otherwise
    """
    if not redis_client:
        print(f"[CACHE] Redis not connected, cannot cache")
        return False
    
    try:
        redis_client.setex(
            key,
            ttl,
            json.dumps(data)
        )
        print(f"[CACHE SET] {key} (TTL: {ttl}s)")
        return True
    except Exception as e:
        print(f"[CACHE ERROR] Error setting cache key '{key}': {e}")
    
    return False


def cache_delete(key: str) -> bool:
    """
    Delete a cache key
    
    Args:
        key: Cache key
        
    Returns:
        True if successful, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        redis_client.delete(key)
        return True
    except Exception as e:
        print(f"Error deleting cache key '{key}': {e}")
    
    return False


def cache_delete_pattern(pattern: str) -> int:
    """
    Delete all cache keys matching a pattern
    
    Args:
        pattern: Key pattern (e.g., "job_search:*")
        
    Returns:
        Number of keys deleted
    """
    if not redis_client:
        return 0
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            return redis_client.delete(*keys) # type: ignore
    except Exception as e:
        print(f"Error deleting cache pattern '{pattern}': {e}")
    
    return 0


def cache_invalidate_job_searches() -> int:
    """
    Invalidate all job search cache entries (called when jobs are updated)
    
    Returns:
        Number of cache entries deleted
    """
    return cache_delete_pattern("job_search:*")


def cache_invalidate_recommended() -> int:
    """
    Invalidate recommended jobs cache (called when jobs are updated)
    
    Returns:
        Number of cache entries deleted
    """
    return cache_delete_pattern("recommended_jobs:*")


def cache_get_all_jobs() -> Optional[list]:
    """
    Get all cached jobs (batch cache)
    
    Returns:
        List of jobs or None if not cached
    """
    if not redis_client:
        print(f"[CACHE] Redis not connected")
        return None
    
    try:
        data = redis_client.get("all_jobs")
        if data:
            print(f"[CACHE HIT] all_jobs (batch cache)")
            return json.loads(data) # type: ignore
        else:
            print(f"[CACHE MISS] all_jobs (batch cache)")
    except Exception as e:
        print(f"[CACHE ERROR] Error retrieving all_jobs: {e}")
    
    return None


def cache_set_all_jobs(data: list, ttl: int = 21600) -> bool:
    """
    Set all jobs in Redis cache (batch cache)
    
    Args:
        data: List of all jobs to cache
        ttl: Time to live in seconds (default 6 hours)
        
    Returns:
        True if successful, False otherwise
    """
    if not redis_client:
        print(f"[CACHE] Redis not connected, cannot cache all_jobs")
        return False
    
    try:
        redis_client.setex(
            "all_jobs",
            ttl,
            json.dumps(data)
        )
        print(f"[CACHE SET] all_jobs ({len(data)} jobs, TTL: {ttl}s)")
        return True
    except Exception as e:
        print(f"[CACHE ERROR] Error setting all_jobs: {e}")
    
    return False
