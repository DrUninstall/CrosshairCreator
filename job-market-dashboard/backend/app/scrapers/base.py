"""
Base scraper class with common functionality.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any
import asyncio
import random
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ScraperResult:
    """Result from a single scrape operation."""
    success: bool
    jobs: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None
    pages_scraped: int = 0
    rate_limited: bool = False
    source: str = ""


class BaseScraper(ABC):
    """
    Base class for all job scrapers.

    Implements common functionality:
    - Rate limiting
    - Random delays
    - Error handling
    - Logging
    """

    def __init__(self, source_name: str):
        self.source_name = source_name
        self.last_request_time: Optional[datetime] = None
        self.request_count = 0
        self._rate_limit = getattr(
            settings,
            f"RATE_LIMIT_{source_name.upper()}",
            settings.RATE_LIMIT_DEFAULT
        )

    async def _enforce_rate_limit(self):
        """
        Enforce rate limiting between requests.

        LEGAL NOTE: Rate limiting is crucial for ethical scraping.
        We space out requests to avoid overloading servers.
        """
        delay = random.uniform(settings.SCRAPE_DELAY_MIN, settings.SCRAPE_DELAY_MAX)

        if self.last_request_time:
            elapsed = (datetime.utcnow() - self.last_request_time).total_seconds()
            if elapsed < delay:
                await asyncio.sleep(delay - elapsed)

        self.last_request_time = datetime.utcnow()
        self.request_count += 1
        logger.debug(f"[{self.source_name}] Request #{self.request_count}, delay: {delay:.2f}s")

    def _get_proxy_url(self) -> Optional[str]:
        """Get proxy URL if configured."""
        if not settings.PROXY_ENABLED:
            return None

        if settings.PROXY_USERNAME and settings.PROXY_PASSWORD:
            return f"http://{settings.PROXY_USERNAME}:{settings.PROXY_PASSWORD}@{settings.PROXY_HOST}:{settings.PROXY_PORT}"

        return f"http://{settings.PROXY_HOST}:{settings.PROXY_PORT}"

    def _get_brightdata_proxy(self) -> Optional[str]:
        """Get Bright Data proxy URL."""
        if not settings.BRIGHTDATA_USERNAME or not settings.BRIGHTDATA_PASSWORD:
            return None

        return f"http://{settings.BRIGHTDATA_USERNAME}:{settings.BRIGHTDATA_PASSWORD}@brd.superproxy.io:22225"

    @abstractmethod
    async def scrape_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        page: int = 1,
        **kwargs
    ) -> ScraperResult:
        """
        Scrape jobs from the source.

        Args:
            query: Search query (job title, skills, etc.)
            location: Location filter
            page: Page number for pagination
            **kwargs: Additional source-specific parameters

        Returns:
            ScraperResult with list of job dictionaries
        """
        pass

    @abstractmethod
    async def parse_job_detail(self, job_url: str) -> Optional[Dict[str, Any]]:
        """
        Parse detailed job information from a job listing page.

        Args:
            job_url: URL of the job listing

        Returns:
            Dictionary with full job details or None if failed
        """
        pass

    def normalize_job_data(self, raw_job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize raw job data to standard format.

        Override in subclasses for source-specific normalization.
        """
        return {
            "external_id": raw_job.get("id", ""),
            "source": self.source_name,
            "url": raw_job.get("url"),
            "title": raw_job.get("title", ""),
            "company": raw_job.get("company", ""),
            "location": raw_job.get("location"),
            "description": raw_job.get("description"),
            "posted_date": raw_job.get("posted_date"),
            "salary_min": raw_job.get("salary_min"),
            "salary_max": raw_job.get("salary_max"),
            "raw_data": raw_job,
        }
