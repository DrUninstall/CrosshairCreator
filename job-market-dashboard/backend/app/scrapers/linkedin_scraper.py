"""
LinkedIn job scraper using Playwright with stealth mode.

LEGAL/ETHICAL NOTES:
- LinkedIn ToS restricts scraping - use at your own risk
- This scraper is provided for educational purposes
- Requires residential proxies to avoid detection
- Use SerpAPI LinkedIn jobs engine as a legal alternative
- Rate limit is very conservative to avoid account issues

For production use, consider:
- LinkedIn Jobs API (requires partnership)
- Bright Data LinkedIn API
- SerpAPI LinkedIn engine
"""
import asyncio
import logging
import hashlib
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from urllib.parse import urlencode, quote_plus

from .base import BaseScraper, ScraperResult
from ..core.config import settings

logger = logging.getLogger(__name__)

# LinkedIn URLs
LINKEDIN_JOBS_URL = "https://www.linkedin.com/jobs/search"


class LinkedInScraper(BaseScraper):
    """
    LinkedIn job scraper using Playwright.

    IMPORTANT: LinkedIn actively blocks scraping.
    Use SerpAPI or Bright Data API for production.

    This implementation uses:
    - Stealth mode (playwright-stealth)
    - Residential proxies
    - Human-like delays
    - Rotating user agents
    """

    def __init__(self):
        super().__init__("linkedin")
        self._browser = None
        self._context = None

    async def _init_browser(self):
        """Initialize Playwright browser with stealth settings."""
        if self._browser is not None:
            return

        try:
            from playwright.async_api import async_playwright

            playwright = await async_playwright().start()

            # Browser launch options
            launch_options = {
                "headless": True,
                "args": [
                    "--disable-blink-features=AutomationControlled",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--no-sandbox",
                ]
            }

            # Add proxy if configured
            proxy_url = self._get_brightdata_proxy() or self._get_proxy_url()
            if proxy_url:
                launch_options["proxy"] = {"server": proxy_url}
                logger.info("[LinkedIn] Using proxy for requests")

            self._browser = await playwright.chromium.launch(**launch_options)

            # Create context with realistic settings
            self._context = await self._browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="en-US",
                timezone_id="America/New_York",
            )

            # Add stealth scripts
            await self._context.add_init_script("""
                // Overwrite navigator.webdriver
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });

                // Overwrite chrome runtime
                window.chrome = { runtime: {} };

                // Overwrite permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) =>
                    parameters.name === 'notifications'
                        ? Promise.resolve({ state: Notification.permission })
                        : originalQuery(parameters);
            """)

        except Exception as e:
            logger.error(f"[LinkedIn] Failed to initialize browser: {e}")
            raise

    async def close(self):
        """Clean up browser resources."""
        if self._browser:
            await self._browser.close()
            self._browser = None
            self._context = None

    async def scrape_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        page: int = 1,
        remote_only: bool = False,
        experience_level: Optional[str] = None,
        date_posted: str = "month",
        **kwargs
    ) -> ScraperResult:
        """
        Scrape jobs from LinkedIn.

        Args:
            query: Job search query
            location: Location filter
            page: Page number
            remote_only: Filter for remote jobs
            experience_level: entry, associate, mid_senior, director, executive
            date_posted: day, week, month

        Returns:
            ScraperResult with jobs
        """
        await self._enforce_rate_limit()

        try:
            await self._init_browser()

            # Build URL with filters
            params = {
                "keywords": query,
                "start": (page - 1) * 25,
            }

            if location:
                params["location"] = location

            # Time filter (f_TPR)
            time_filters = {
                "day": "r86400",
                "week": "r604800",
                "month": "r2592000",
            }
            if date_posted in time_filters:
                params["f_TPR"] = time_filters[date_posted]

            # Remote filter
            if remote_only:
                params["f_WT"] = "2"  # Remote

            # Experience level
            exp_filters = {
                "entry": "2",
                "associate": "3",
                "mid_senior": "4",
                "director": "5",
                "executive": "6",
            }
            if experience_level in exp_filters:
                params["f_E"] = exp_filters[experience_level]

            url = f"{LINKEDIN_JOBS_URL}?{urlencode(params)}"
            logger.info(f"[LinkedIn] Fetching: {url}")

            page_obj = await self._context.new_page()

            try:
                # Navigate with realistic behavior
                await page_obj.goto(url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(2)  # Wait for dynamic content

                # Scroll to load more jobs
                await self._scroll_page(page_obj)

                # Extract job listings
                jobs = await self._extract_jobs(page_obj)

                return ScraperResult(
                    success=True,
                    jobs=jobs,
                    pages_scraped=1,
                    source=self.source_name
                )

            finally:
                await page_obj.close()

        except Exception as e:
            logger.error(f"[LinkedIn] Scrape error: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source_name
            )

    async def _scroll_page(self, page):
        """Scroll page to load lazy content."""
        for _ in range(3):
            await page.evaluate("window.scrollBy(0, 500)")
            await asyncio.sleep(0.5)

    async def _extract_jobs(self, page) -> List[Dict[str, Any]]:
        """Extract job listings from the page."""
        jobs = []

        try:
            # Wait for job cards
            await page.wait_for_selector(".jobs-search__results-list li", timeout=10000)

            job_elements = await page.query_selector_all(".jobs-search__results-list li")

            for elem in job_elements[:25]:  # Limit to 25 per page
                try:
                    job_data = await self._parse_job_card(elem)
                    if job_data:
                        jobs.append(job_data)
                except Exception as e:
                    logger.debug(f"[LinkedIn] Failed to parse job card: {e}")
                    continue

        except Exception as e:
            logger.error(f"[LinkedIn] Failed to extract jobs: {e}")

        return jobs

    async def _parse_job_card(self, element) -> Optional[Dict[str, Any]]:
        """Parse a single job card element."""
        try:
            # Extract title
            title_elem = await element.query_selector(".base-search-card__title")
            title = await title_elem.inner_text() if title_elem else ""

            # Extract company
            company_elem = await element.query_selector(".base-search-card__subtitle")
            company = await company_elem.inner_text() if company_elem else ""

            # Extract location
            location_elem = await element.query_selector(".job-search-card__location")
            location = await location_elem.inner_text() if location_elem else ""

            # Extract URL
            link_elem = await element.query_selector("a.base-card__full-link")
            url = await link_elem.get_attribute("href") if link_elem else ""

            # Extract date
            date_elem = await element.query_selector("time")
            posted_date = None
            if date_elem:
                date_str = await date_elem.get_attribute("datetime")
                if date_str:
                    posted_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))

            # Generate unique ID
            job_id = hashlib.md5(f"{title}{company}{location}".encode()).hexdigest()[:16]

            # Determine work type
            work_type = "unknown"
            location_lower = location.lower() if location else ""
            title_lower = title.lower() if title else ""
            if "remote" in location_lower or "remote" in title_lower:
                work_type = "remote"
            elif "hybrid" in location_lower or "hybrid" in title_lower:
                work_type = "hybrid"
            elif location:
                work_type = "onsite"

            return {
                "external_id": f"linkedin_{job_id}",
                "source": "linkedin",
                "url": url,
                "title": title.strip(),
                "company": company.strip(),
                "location": location.strip(),
                "posted_date": posted_date,
                "work_type": work_type,
                "description": None,  # Need to fetch detail page
                "raw_data": {
                    "title": title,
                    "company": company,
                    "location": location,
                    "url": url,
                },
            }

        except Exception as e:
            logger.debug(f"[LinkedIn] Parse error: {e}")
            return None

    async def parse_job_detail(self, job_url: str) -> Optional[Dict[str, Any]]:
        """
        Fetch full job details from job page.

        Note: This is rate-limited heavily to avoid detection.
        """
        await self._enforce_rate_limit()

        try:
            await self._init_browser()
            page = await self._context.new_page()

            try:
                await page.goto(job_url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(2)

                # Extract description
                desc_elem = await page.query_selector(".description__text")
                description = await desc_elem.inner_text() if desc_elem else ""

                # Extract criteria
                criteria = {}
                criteria_elems = await page.query_selector_all(".description__job-criteria-item")
                for elem in criteria_elems:
                    header = await elem.query_selector(".description__job-criteria-subheader")
                    value = await elem.query_selector(".description__job-criteria-text")
                    if header and value:
                        key = (await header.inner_text()).strip().lower()
                        val = (await value.inner_text()).strip()
                        criteria[key] = val

                return {
                    "description": description,
                    "seniority_level": criteria.get("seniority level"),
                    "employment_type": criteria.get("employment type"),
                    "job_function": criteria.get("job function"),
                    "industries": criteria.get("industries"),
                }

            finally:
                await page.close()

        except Exception as e:
            logger.error(f"[LinkedIn] Detail fetch error: {e}")
            return None
