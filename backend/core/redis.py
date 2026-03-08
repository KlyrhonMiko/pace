"""
Redis cache management for job listings
"""
import json
import logging
import os
from typing import Any, Callable, Optional, TypeVar

import redis
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel


logger = logging.getLogger(__name__)
CacheValue = TypeVar("CacheValue")

# Redis connection
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client: Optional[redis.Redis] = None

try:
    redis_client = redis.from_url(redis_url, decode_responses=True)
    if redis_client is not None:
        # Test connection
        redis_client.ping()
        logger.info("Redis connected successfully")
except Exception as e:
    logger.warning("Failed to connect to Redis: %s", e)
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
        logger.debug("Redis not connected; skipping cache read for key '%s'", key)
        return None
    
    try:
        data = redis_client.get(key)
        if data:
            logger.debug("Cache hit for key '%s'", key)
            return json.loads(data) # type: ignore
        logger.debug("Cache miss for key '%s'", key)
    except Exception as e:
        logger.warning("Error retrieving cache key '%s': %s", key, e)
    
    return None


def cache_set(key: str, data: Any, ttl: int = 3600) -> bool:
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
        logger.debug("Redis not connected; skipping cache write for key '%s'", key)
        return False
    
    try:
        payload = json.dumps(jsonable_encoder(data), sort_keys=True)
        redis_client.setex(
            key,
            ttl,
            payload
        )
        logger.debug("Cache set for key '%s' (TTL: %ss)", key, ttl)
        return True
    except Exception as e:
        logger.warning("Error setting cache key '%s': %s", key, e)
    
    return False


def cache_get_or_set(
    key: str,
    fetch_func: Callable[[], CacheValue],
    ttl: int = 3600,
    cache_none: bool = False,
) -> CacheValue:
    """
    Read through Redis cache.

    The returned value is JSON-encoded on cache miss so callers receive the same
    shape on both hits and misses.
    """
    cached_data = cache_get(key)
    if cached_data is not None:
        refreshed_cached_data = _refresh_cached_timestamp(cached_data)
        return _restore_cached_response_model(refreshed_cached_data)  # type: ignore[return-value]

    result = fetch_func()
    encoded_result = jsonable_encoder(result)

    if encoded_result is None and not cache_none:
        return result

    cache_set(key, encoded_result, ttl=ttl)
    refreshed_result = _refresh_cached_timestamp(encoded_result)

    if isinstance(result, BaseModel):
        return result.__class__.model_validate(refreshed_result)  # type: ignore[return-value]

    return _restore_cached_response_model(refreshed_result)  # type: ignore[return-value]


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
        logger.warning("Error deleting cache key '%s': %s", key, e)
    
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
        deleted = 0
        for key in redis_client.scan_iter(match=pattern, count=100):
            deleted += redis_client.delete(key)
        return deleted
    except Exception as e:
        logger.warning("Error deleting cache pattern '%s': %s", pattern, e)
    
    return 0


def invalidate_cache_namespaces(*namespaces: str) -> int:
    """Invalidate all cache entries belonging to one or more namespaces."""
    return sum(cache_delete_pattern(f"{namespace}:*") for namespace in namespaces)


def _refresh_cached_timestamp(data: Any) -> Any:
    """Keep response timestamps fresh even when the payload itself is cached."""
    if not isinstance(data, dict) or "timestamp" not in data:
        return data

    from utils.timezone import get_current_time_gmt8

    refreshed_data = dict(data)
    refreshed_data["timestamp"] = get_current_time_gmt8()
    return refreshed_data


def _restore_cached_response_model(data: Any) -> Any:
    """Rehydrate cached API envelopes into their response models when possible."""
    if not isinstance(data, dict):
        return data

    if {"success", "code", "message", "pagination"}.issubset(data):
        from models.pagination import PaginatedResponse

        return PaginatedResponse[Any].model_validate(data)

    if {"success", "code", "message"}.issubset(data):
        from models.response_codes import StandardResponse

        return StandardResponse.model_validate(data)

    return data


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
        logger.debug("Redis not connected; skipping all_jobs cache read")
        return None
    
    try:
        data = redis_client.get("all_jobs")
        if data:
            logger.debug("Cache hit for key 'all_jobs'")
            return json.loads(data) # type: ignore
        logger.debug("Cache miss for key 'all_jobs'")
    except Exception as e:
        logger.warning("Error retrieving all_jobs cache: %s", e)
    
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
        logger.debug("Redis not connected; skipping all_jobs cache write")
        return False
    
    try:
        redis_client.setex(
            "all_jobs",
            ttl,
            json.dumps(jsonable_encoder(data), sort_keys=True)
        )
        logger.debug("Cache set for key 'all_jobs' (%s jobs, TTL: %ss)", len(data), ttl)
        return True
    except Exception as e:
        logger.warning("Error setting all_jobs cache: %s", e)
    
    return False
