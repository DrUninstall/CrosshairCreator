"""
Indeed job scraper using SerpAPI.

Indeed actively blocks direct scraping, so we use SerpAPI's
Indeed engine for reliable, legal access.

LEGAL NOTE: Uses official SerpAPI service for ToS compliance.
"""
import httpx
import logging
import hashlib
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from .base import BaseScraper, ScraperResult
from ..core.config import settings

logger = logging.getLogger(__name__)

SERPAPI_BASE_URL = "https://serpapi.com/search"


class IndeedScraper(BaseScraper):
    """
    Indeed scraper using SerpAPI Indeed engine.

    This is the recommended approach as:
    - Indeed blocks direct scraping aggressively
    - SerpAPI handles anti-bot measures
    - Data is structured and reliable
    """

    def __init__(self):
        super().__init__("indeed")
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
        date_posted: str = "month",
        job_type: Optional[str] = None,  # fulltime, parttime, contract, internship
        experience_level: Optional[str] = None,  # entry_level, mid_level, senior_level
        **kwargs
    ) -> ScraperResult:
        """
        Scrape jobs from Indeed via SerpAPI.

        Args:
            query: Search query
            location: Location filter
            page: Page number
            remote_only: Filter remote jobs
            date_posted: Time filter
            job_type: Employment type filter
            experience_level: Experience filter

        Returns:
            ScraperResult with jobs
        """
        if not self._is_available():
            return ScraperResult(
                success=False,
                error="SerpAPI key not configured for Indeed",
                source=self.source_name
            )

        await self._enforce_rate_limit()

        # Build parameters
        params = {
            "engine": "indeed",
            "q": query,
            "api_key": self.api_key,
            "start": (page - 1) * 10,
        }

        if location:
            params["l"] = location

        # Date filter
        date_map = {
            "day": "1",
            "3days": "3",
            "week": "7",
            "month": "30",
        }
        if date_posted in date_map:
            params["fromage"] = date_map[date_posted]

        # Remote filter
        if remote_only:
            params["remotejob"] = "1"

        # Job type
        job_type_map = {
            "fulltime": "fulltime",
            "parttime": "parttime",
            "contract": "contract",
            "internship": "internship",
            "temporary": "temporary",
        }
        if job_type in job_type_map:
            params["jt"] = job_type_map[job_type]

        # Experience level
        exp_map = {
            "entry_level": "entry_level",
            "mid_level": "mid_level",
            "senior_level": "senior_level",
        }
        if experience_level in exp_map:
            params["explvl"] = exp_map[experience_level]

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
            normalized_jobs = [self._normalize_indeed_job(job) for job in jobs_data]

            logger.info(f"[Indeed] Found {len(normalized_jobs)} jobs for query: {query}")

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
                    error="Rate limited",
                    rate_limited=True,
                    source=self.source_name
                )
            return ScraperResult(
                success=False,
                error=f"HTTP error: {e.response.status_code}",
                source=self.source_name
            )
        except Exception as e:
            logger.error(f"[Indeed] Error: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source_name
            )

    async def parse_job_detail(self, job_url: str) -> Optional[Dict[str, Any]]:
        """Indeed details are included in search results via SerpAPI."""
        return None

    def _normalize_indeed_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Indeed job data."""
        # Generate ID
        job_id = hashlib.md5(
            f"{job.get('title', '')}{job.get('company_name', '')}{job.get('location', '')}".encode()
        ).hexdigest()[:16]

        # Parse posted date
        posted_date = None
        date_text = job.get("date", "")
        if date_text:
            posted_date = self._parse_date(date_text)

        # Parse salary
        salary_min = salary_max = None
        salary = job.get("salary", "")
        if salary:
            salary_min, salary_max = self._parse_salary(salary)

        # Work type
        work_type = "unknown"
        attributes = job.get("detected_extensions", {})
        if attributes.get("work_from_home") or "remote" in job.get("location", "").lower():
            work_type = "remote"

        return {
            "external_id": f"indeed_{job_id}",
            "source": "indeed",
            "url": job.get("link"),
            "title": job.get("title", ""),
            "company": job.get("company_name", ""),
            "location": job.get("location", ""),
            "description": job.get("description", ""),
            "posted_date": posted_date,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "work_type": work_type,
            "raw_data": job,
        }

    def _parse_date(self, date_text: str) -> Optional[datetime]:
        """Parse Indeed date strings."""
        date_text = date_text.lower()
        now = datetime.utcnow()

        if "just posted" in date_text or "today" in date_text:
            return now
        elif "day" in date_text:
            try:
                days = int(''.join(filter(str.isdigit, date_text.split("day")[0])) or "1")
                return now - timedelta(days=days)
            except ValueError:
                pass

        return None

    def _parse_salary(self, salary_text: str) -> tuple:
        """Parse salary string."""
        import re

        salary_text = salary_text.replace(",", "").replace("$", "").lower()
        numbers = re.findall(r"[\d.]+", salary_text)

        if len(numbers) >= 2:
            return float(numbers[0]), float(numbers[1])
        elif len(numbers) == 1:
            val = float(numbers[0])
            return val, val

        return None, None


class DirectIndeedScraper(BaseScraper):
    """
    Direct Indeed scraper using httpx (fallback).

    WARNING: Indeed blocks most direct scraping attempts.
    This is provided as a fallback/educational reference.
    Use SerpAPI for production.
    """

    def __init__(self):
        super().__init__("indeed_direct")
        self._headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }

    async def scrape_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        page: int = 1,
        **kwargs
    ) -> ScraperResult:
        """Direct Indeed scraping (likely to be blocked)."""
        logger.warning("[Indeed Direct] This method is likely to be blocked. Use SerpAPI instead.")

        await self._enforce_rate_limit()

        params = {
            "q": query,
            "start": (page - 1) * 10,
        }
        if location:
            params["l"] = location

        try:
            from bs4 import BeautifulSoup

            proxy = self._get_proxy_url()
            async with httpx.AsyncClient(
                timeout=30.0,
                headers=self._headers,
                proxies={"all://": proxy} if proxy else None
            ) as client:
                response = await client.get(
                    "https://www.indeed.com/jobs",
                    params=params
                )

                if response.status_code == 403:
                    return ScraperResult(
                        success=False,
                        error="Blocked by Indeed. Use SerpAPI instead.",
                        source=self.source_name
                    )

                soup = BeautifulSoup(response.text, "lxml")
                jobs = self._parse_indeed_html(soup)

                return ScraperResult(
                    success=True,
                    jobs=jobs,
                    pages_scraped=1,
                    source=self.source_name
                )

        except Exception as e:
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source_name
            )

    def _parse_indeed_html(self, soup) -> List[Dict[str, Any]]:
        """Parse Indeed HTML (structure changes frequently)."""
        jobs = []

        job_cards = soup.select(".job_seen_beacon, .jobsearch-ResultsList > li")

        for card in job_cards[:25]:
            try:
                title_elem = card.select_one("h2.jobTitle span")
                company_elem = card.select_one("[data-testid='company-name']")
                location_elem = card.select_one("[data-testid='text-location']")
                link_elem = card.select_one("a.jcs-JobTitle")

                if title_elem:
                    job_id = hashlib.md5(
                        f"{title_elem.text}{company_elem.text if company_elem else ''}".encode()
                    ).hexdigest()[:16]

                    jobs.append({
                        "external_id": f"indeed_direct_{job_id}",
                        "source": "indeed",
                        "title": title_elem.text.strip(),
                        "company": company_elem.text.strip() if company_elem else "",
                        "location": location_elem.text.strip() if location_elem else "",
                        "url": f"https://indeed.com{link_elem['href']}" if link_elem else None,
                    })

            except Exception:
                continue

        return jobs

    async def parse_job_detail(self, job_url: str) -> Optional[Dict[str, Any]]:
        """Parse job detail page."""
        return None
