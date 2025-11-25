"""
Caching service using Redis for API response caching.

Implements:
- API response caching
- Rate limiting
- Scrape result caching
"""
import json
import logging
from typing import Any, Optional
from datetime import timedelta
import hashlib

import redis.asyncio as redis

from ..core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """
    Redis-based caching service.

    Caches API responses to reduce database load and
    scraping results to avoid duplicate requests.
    """

    def __init__(self):
        self._redis: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis."""
        if self._redis is None:
            try:
                self._redis = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True
                )
                await self._redis.ping()
                logger.info("Connected to Redis")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Caching disabled.")
                self._redis = None

    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()

    def _generate_key(self, prefix: str, params: dict) -> str:
        """Generate cache key from parameters."""
        param_str = json.dumps(params, sort_keys=True)
        param_hash = hashlib.md5(param_str.encode()).hexdigest()[:12]
        return f"{prefix}:{param_hash}"

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self._redis:
            return None

        try:
            value = await self._redis.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.error(f"Cache get error: {e}")

        return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = None
    ) -> bool:
        """Set value in cache."""
        if not self._redis:
            return False

        try:
            ttl = ttl or settings.CACHE_TTL_SECONDS
            await self._redis.setex(
                key,
                timedelta(seconds=ttl),
                json.dumps(value)
            )
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        if not self._redis:
            return False

        try:
            await self._redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern."""
        if not self._redis:
            return 0

        try:
            keys = []
            async for key in self._redis.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                await self._redis.delete(*keys)

            logger.info(f"Cleared {len(keys)} cache keys matching {pattern}")
            return len(keys)
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return 0

    # Specialized cache methods

    async def get_dashboard_data(self, filters: dict) -> Optional[dict]:
        """Get cached dashboard data."""
        key = self._generate_key("dashboard", filters)
        return await self.get(key)

    async def set_dashboard_data(self, filters: dict, data: dict, ttl: int = 3600):
        """Cache dashboard data."""
        key = self._generate_key("dashboard", filters)
        return await self.set(key, data, ttl)

    async def get_skill_trend(self, skill_id: int, filters: dict) -> Optional[list]:
        """Get cached skill trend data."""
        key = self._generate_key(f"skill_trend:{skill_id}", filters)
        return await self.get(key)

    async def set_skill_trend(self, skill_id: int, filters: dict, data: list, ttl: int = 3600):
        """Cache skill trend data."""
        key = self._generate_key(f"skill_trend:{skill_id}", filters)
        return await self.set(key, data, ttl)

    async def get_scrape_result(self, source: str, query: str, location: str) -> Optional[dict]:
        """Get cached scrape result."""
        key = self._generate_key(f"scrape:{source}", {"query": query, "location": location})
        return await self.get(key)

    async def set_scrape_result(
        self,
        source: str,
        query: str,
        location: str,
        data: dict,
        ttl: int = 3600  # 1 hour cache for scrape results
    ):
        """Cache scrape result."""
        key = self._generate_key(f"scrape:{source}", {"query": query, "location": location})
        return await self.set(key, data, ttl)

    async def clear_dashboard_cache(self) -> int:
        """Clear all dashboard caches."""
        return await self.clear_pattern("dashboard:*")

    async def clear_all_caches(self) -> int:
        """Clear all caches."""
        if not self._redis:
            return 0

        try:
            await self._redis.flushdb()
            logger.info("Cleared all caches")
            return 1
        except Exception as e:
            logger.error(f"Failed to clear caches: {e}")
            return 0

    # Rate limiting

    async def check_rate_limit(
        self,
        key: str,
        limit: int,
        window: int = 60
    ) -> bool:
        """
        Check if request is within rate limit.

        Args:
            key: Rate limit key (e.g., "api:user:123")
            limit: Maximum requests allowed
            window: Time window in seconds

        Returns:
            True if within limit, False if exceeded
        """
        if not self._redis:
            return True  # Allow if Redis is down

        try:
            current = await self._redis.incr(key)
            if current == 1:
                await self._redis.expire(key, window)
            return current <= limit
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return True


# Singleton instance
cache_service = CacheService()


async def get_cache() -> CacheService:
    """Get cache service instance."""
    if cache_service._redis is None:
        await cache_service.connect()
    return cache_service
