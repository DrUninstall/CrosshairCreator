"""
SerpAPI-based scraper for Google for Jobs.

This is the most reliable and legal scraping method as it uses
the official SerpAPI service which handles all the complexity.

Requires: SERPAPI_KEY environment variable
Pricing: https://serpapi.com/pricing (free tier available)
"""
import httpx
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import hashlib

from .base import BaseScraper, ScraperResult
from ..core.config import settings

logger = logging.getLogger(__name__)

# API endpoint
SERPAPI_BASE_URL = "https://serpapi.com/search"


class SerpAPIScraper(BaseScraper):
    """
    Scraper using SerpAPI for Google for Jobs results.

    Benefits:
    - Legal and ToS-compliant
    - No proxy needed
    - Structured data returned
    - Handles rate limiting automatically

    LEGAL NOTE: Uses official API, fully compliant with ToS.
    """

    def __init__(self):
        super().__init__("serpapi")
        self.api_key = settings.SERPAPI_KEY

    def _is_available(self) -> bool:
        """Check if API key is configured."""
        return bool(self.api_key)

    async def scrape_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        page: int = 1,
        remote_only: bool = False,
        date_posted: str = "month",  # day, 3days, week, month
        **kwargs
    ) -> ScraperResult:
        """
        Scrape jobs from Google for Jobs via SerpAPI.

        Args:
            query: Job search query
            location: Location (e.g., "New York, NY", "United States")
            page: Page number (start = (page-1) * 10)
            remote_only: Filter for remote jobs only
            date_posted: Time filter (day, 3days, week, month)

        Returns:
            ScraperResult with normalized job data
        """
        if not self._is_available():
            return ScraperResult(
                success=False,
                error="SerpAPI key not configured",
                source=self.source_name
            )

        await self._enforce_rate_limit()

        # Build search parameters
        params = {
            "engine": "google_jobs",
            "q": query,
            "api_key": self.api_key,
            "start": (page - 1) * 10,
        }

        if location:
            params["location"] = location

        # Date filter
        date_filters = {
            "day": "date_posted:today",
            "3days": "date_posted:3days",
            "week": "date_posted:week",
            "month": "date_posted:month",
        }
        if date_posted in date_filters:
            params["chips"] = date_filters[date_posted]

        # Remote filter
        if remote_only:
            chips = params.get("chips", "")
            params["chips"] = f"{chips},remote" if chips else "remote"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(SERPAPI_BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

            if "error" in data:
                return ScraperResult(
                    success=False,
                    error=data["error"],
                    source=self.source_name
                )

            jobs_data = data.get("jobs_results", [])
            normalized_jobs = [self._normalize_serpapi_job(job) for job in jobs_data]

            logger.info(f"[SerpAPI] Found {len(normalized_jobs)} jobs for query: {query}")

            return ScraperResult(
                success=True,
                jobs=normalized_jobs,
                pages_scraped=1,
                source=self.source_name
            )

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                return ScraperResult(
                    success=False,
                    error="Rate limited by SerpAPI",
                    rate_limited=True,
                    source=self.source_name
                )
            return ScraperResult(
                success=False,
                error=f"HTTP error: {e.response.status_code}",
                source=self.source_name
            )
        except Exception as e:
            logger.error(f"[SerpAPI] Error: {str(e)}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source_name
            )

    async def parse_job_detail(self, job_url: str) -> Optional[Dict[str, Any]]:
        """
        SerpAPI returns full details in search results.
        This method is for compatibility with the base class.
        """
        return None

    def _normalize_serpapi_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize SerpAPI job data to standard format."""
        # Generate unique ID
        job_id = hashlib.md5(
            f"{job.get('title', '')}{job.get('company_name', '')}{job.get('location', '')}".encode()
        ).hexdigest()[:16]

        # Parse posted date
        posted_date = None
        via_text = job.get("detected_extensions", {}).get("posted_at", "")
        if via_text:
            posted_date = self._parse_relative_date(via_text)

        # Extract salary if available
        salary_info = job.get("detected_extensions", {})
        salary_min = salary_max = None
        salary_text = salary_info.get("salary", "")
        if salary_text:
            salary_min, salary_max = self._parse_salary(salary_text)

        # Determine work type
        work_type = "unknown"
        if job.get("detected_extensions", {}).get("work_from_home"):
            work_type = "remote"
        elif "remote" in job.get("title", "").lower():
            work_type = "remote"
        elif "hybrid" in job.get("title", "").lower():
            work_type = "hybrid"

        return {
            "external_id": f"serpapi_{job_id}",
            "source": "google_jobs",
            "url": job.get("share_link") or job.get("apply_links", [{}])[0].get("link"),
            "title": job.get("title", ""),
            "company": job.get("company_name", ""),
            "location": job.get("location", ""),
            "description": job.get("description", ""),
            "requirements_text": self._extract_requirements(job),
            "posted_date": posted_date,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "work_type": work_type,
            "raw_data": job,
        }

    def _parse_relative_date(self, date_text: str) -> Optional[datetime]:
        """Parse relative date strings like '3 days ago'."""
        date_text = date_text.lower()
        now = datetime.utcnow()

        if "today" in date_text or "just posted" in date_text:
            return now
        elif "yesterday" in date_text:
            return now - timedelta(days=1)
        elif "day" in date_text:
            try:
                days = int(''.join(filter(str.isdigit, date_text.split("day")[0])))
                return now - timedelta(days=days)
            except ValueError:
                pass
        elif "week" in date_text:
            try:
                weeks = int(''.join(filter(str.isdigit, date_text.split("week")[0])) or "1")
                return now - timedelta(weeks=weeks)
            except ValueError:
                pass
        elif "month" in date_text:
            try:
                months = int(''.join(filter(str.isdigit, date_text.split("month")[0])) or "1")
                return now - timedelta(days=months * 30)
            except ValueError:
                pass

        return None

    def _parse_salary(self, salary_text: str) -> tuple:
        """Parse salary range from text."""
        import re

        # Clean and extract numbers
        salary_text = salary_text.replace(",", "").replace("$", "").lower()
        numbers = re.findall(r"[\d.]+[km]?", salary_text)

        def convert_salary(s: str) -> Optional[float]:
            try:
                if s.endswith("k"):
                    return float(s[:-1]) * 1000
                elif s.endswith("m"):
                    return float(s[:-1]) * 1000000
                return float(s)
            except ValueError:
                return None

        if len(numbers) >= 2:
            return convert_salary(numbers[0]), convert_salary(numbers[1])
        elif len(numbers) == 1:
            val = convert_salary(numbers[0])
            return val, val

        return None, None

    def _extract_requirements(self, job: Dict[str, Any]) -> str:
        """Extract requirements section from job description."""
        description = job.get("description", "")
        highlights = job.get("job_highlights", [])

        requirements = []
        for section in highlights:
            if section.get("title", "").lower() in ["qualifications", "requirements", "skills"]:
                requirements.extend(section.get("items", []))

        return "\n".join(requirements) if requirements else ""


# Additional search queries for comprehensive coverage
JOB_SEARCH_QUERIES = {
    "software_engineering": [
        "software engineer",
        "software developer",
        "backend engineer",
        "frontend engineer",
        "full stack developer",
        "python developer",
        "java developer",
        "javascript developer",
        "golang developer",
        "rust developer",
    ],
    "data_science": [
        "data scientist",
        "machine learning engineer",
        "data analyst",
        "AI engineer",
        "NLP engineer",
        "computer vision engineer",
    ],
    "data_engineering": [
        "data engineer",
        "ETL developer",
        "data architect",
        "analytics engineer",
        "big data engineer",
    ],
    "devops": [
        "devops engineer",
        "SRE",
        "site reliability engineer",
        "platform engineer",
        "cloud engineer",
        "infrastructure engineer",
    ],
    "product_management": [
        "product manager",
        "technical product manager",
        "product owner",
        "senior product manager",
    ],
    "design": [
        "UX designer",
        "UI designer",
        "product designer",
        "UX researcher",
    ],
}
