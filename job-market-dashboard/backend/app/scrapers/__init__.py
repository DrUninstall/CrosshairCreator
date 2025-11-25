"""
Job Scrapers Package

LEGAL/ETHICAL NOTES:
- All scrapers respect robots.txt when possible
- Rate limits are enforced (see config.py for values)
- Data is cached to minimize requests
- Use for personal/research purposes only
- Some sources require API keys or proxy services

Supported sources:
- SerpAPI (Google for Jobs) - Recommended, most reliable
- LinkedIn (via proxy service or SerpAPI)
- Indeed (via SerpAPI or direct with caution)
- Glassdoor (via SerpAPI)
- Company career pages (RSS/direct)
"""

from .base import BaseScraper, ScraperResult
from .serpapi_scraper import SerpAPIScraper
from .linkedin_scraper import LinkedInScraper
from .indeed_scraper import IndeedScraper
from .aggregator import JobAggregator

__all__ = [
    "BaseScraper",
    "ScraperResult",
    "SerpAPIScraper",
    "LinkedInScraper",
    "IndeedScraper",
    "JobAggregator",
]
