"""
Job Aggregator - Coordinates multiple scrapers and handles data pipeline.

This is the main entry point for the scraping system.
It manages:
- Multiple scraper sources
- Rate limiting across sources
- Deduplication
- Database persistence
- Caching
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timedelta
from dataclasses import dataclass
import hashlib
import json

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from .base import ScraperResult
from .serpapi_scraper import SerpAPIScraper, JOB_SEARCH_QUERIES
from .linkedin_scraper import LinkedInScraper
from .indeed_scraper import IndeedScraper
from ..models.job import JobPosting, JobCategory, SeniorityLevel, WorkType, DegreeLevel
from ..models.scrape_log import ScrapeLog, ScrapeStatus
from ..services.extractor import SkillExtractor
from ..core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class AggregatorConfig:
    """Configuration for the aggregator."""
    enable_serpapi: bool = True
    enable_linkedin: bool = False  # Disabled by default (requires proxy)
    enable_indeed: bool = True
    max_pages_per_source: int = 5
    categories: List[str] = None
    locations: List[str] = None
    date_posted: str = "month"
    remote_only: bool = False

    def __post_init__(self):
        if self.categories is None:
            self.categories = ["software_engineering", "data_science", "devops"]
        if self.locations is None:
            self.locations = ["United States", "United Kingdom", "Remote"]


class JobAggregator:
    """
    Main job aggregation service.

    Coordinates multiple scrapers and processes results into the database.

    LEGAL NOTE: This aggregator implements rate limiting and caching
    to minimize requests to source websites.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.serpapi = SerpAPIScraper()
        self.linkedin = LinkedInScraper()
        self.indeed = IndeedScraper()
        self.extractor = SkillExtractor()
        self._seen_jobs: Set[str] = set()

    async def run_full_scrape(
        self,
        config: Optional[AggregatorConfig] = None,
        triggered_by: str = "manual"
    ) -> Dict[str, Any]:
        """
        Run a full scrape across all configured sources.

        Args:
            config: Aggregator configuration
            triggered_by: Who triggered the scrape (manual, scheduler, api)

        Returns:
            Summary statistics
        """
        config = config or AggregatorConfig()
        start_time = datetime.utcnow()

        # Create scrape log
        scrape_log = ScrapeLog(
            source="aggregator",
            status=ScrapeStatus.RUNNING,
            triggered_by=triggered_by,
            started_at=start_time
        )
        self.db.add(scrape_log)
        await self.db.commit()

        stats = {
            "total_jobs_found": 0,
            "new_jobs": 0,
            "updated_jobs": 0,
            "skills_extracted": 0,
            "certifications_extracted": 0,
            "errors": [],
            "sources_scraped": [],
        }

        try:
            # Generate search queries
            queries = self._generate_queries(config.categories)

            for location in config.locations:
                for query in queries:
                    logger.info(f"Scraping: {query} in {location}")

                    # Scrape from each enabled source
                    results = await self._scrape_all_sources(
                        query=query,
                        location=location,
                        config=config
                    )

                    # Process and store results
                    for result in results:
                        if result.success:
                            process_stats = await self._process_jobs(result.jobs)
                            stats["total_jobs_found"] += len(result.jobs)
                            stats["new_jobs"] += process_stats["new"]
                            stats["updated_jobs"] += process_stats["updated"]
                            stats["skills_extracted"] += process_stats["skills"]
                            stats["certifications_extracted"] += process_stats["certs"]
                            if result.source not in stats["sources_scraped"]:
                                stats["sources_scraped"].append(result.source)
                        else:
                            stats["errors"].append({
                                "source": result.source,
                                "error": result.error
                            })

                    # Small delay between queries
                    await asyncio.sleep(1)

            # Update scrape log
            scrape_log.mark_completed(stats["total_jobs_found"], stats["new_jobs"])
            scrape_log.jobs_found = stats["total_jobs_found"]
            scrape_log.jobs_new = stats["new_jobs"]
            scrape_log.jobs_updated = stats["updated_jobs"]
            scrape_log.skills_extracted = stats["skills_extracted"]
            scrape_log.certs_extracted = stats["certifications_extracted"]

        except Exception as e:
            logger.error(f"Aggregator error: {e}")
            scrape_log.mark_failed(str(e))
            stats["errors"].append({"source": "aggregator", "error": str(e)})

        await self.db.commit()

        stats["duration_seconds"] = int((datetime.utcnow() - start_time).total_seconds())
        logger.info(f"Scrape completed: {stats}")

        return stats

    async def _scrape_all_sources(
        self,
        query: str,
        location: str,
        config: AggregatorConfig
    ) -> List[ScraperResult]:
        """Scrape from all configured sources concurrently."""
        tasks = []

        if config.enable_serpapi and settings.SERPAPI_KEY:
            for page in range(1, config.max_pages_per_source + 1):
                tasks.append(
                    self.serpapi.scrape_jobs(
                        query=query,
                        location=location,
                        page=page,
                        remote_only=config.remote_only,
                        date_posted=config.date_posted
                    )
                )

        if config.enable_indeed and settings.SERPAPI_KEY:
            for page in range(1, config.max_pages_per_source + 1):
                tasks.append(
                    self.indeed.scrape_jobs(
                        query=query,
                        location=location,
                        page=page,
                        remote_only=config.remote_only,
                        date_posted=config.date_posted
                    )
                )

        if config.enable_linkedin and (settings.BRIGHTDATA_USERNAME or settings.PROXY_HOST):
            tasks.append(
                self.linkedin.scrape_jobs(
                    query=query,
                    location=location,
                    page=1,
                    remote_only=config.remote_only
                )
            )

        if not tasks:
            logger.warning("No scrapers enabled or configured. Check API keys.")
            return []

        # Run concurrently with rate limiting handled per-scraper
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions
        valid_results = []
        for r in results:
            if isinstance(r, ScraperResult):
                valid_results.append(r)
            elif isinstance(r, Exception):
                logger.error(f"Scraper exception: {r}")

        return valid_results

    async def _process_jobs(self, jobs: List[Dict[str, Any]]) -> Dict[str, int]:
        """Process and store job listings."""
        stats = {"new": 0, "updated": 0, "skills": 0, "certs": 0}

        for job_data in jobs:
            external_id = job_data.get("external_id")

            # Skip duplicates within this run
            if external_id in self._seen_jobs:
                continue
            self._seen_jobs.add(external_id)

            # Check if job exists
            existing = await self.db.execute(
                select(JobPosting).where(JobPosting.external_id == external_id)
            )
            existing_job = existing.scalar_one_or_none()

            if existing_job:
                # Update existing job
                await self._update_job(existing_job, job_data)
                stats["updated"] += 1
            else:
                # Create new job
                new_job = await self._create_job(job_data)
                if new_job:
                    stats["new"] += 1

                    # Extract skills and certifications
                    extract_result = await self._extract_and_link(new_job, job_data)
                    stats["skills"] += extract_result["skills"]
                    stats["certs"] += extract_result["certs"]

        await self.db.commit()
        return stats

    async def _create_job(self, job_data: Dict[str, Any]) -> Optional[JobPosting]:
        """Create a new job posting."""
        try:
            # Parse work type
            work_type = WorkType.UNKNOWN
            if job_data.get("work_type"):
                try:
                    work_type = WorkType(job_data["work_type"])
                except ValueError:
                    pass

            # Infer category from title
            category = self._infer_category(job_data.get("title", ""))

            # Infer seniority
            seniority = self._infer_seniority(job_data.get("title", ""))

            # Parse location
            location = job_data.get("location", "")
            country = self._extract_country(location)

            job = JobPosting(
                external_id=job_data["external_id"],
                source=job_data.get("source", "unknown"),
                url=job_data.get("url"),
                title=job_data.get("title", "")[:500],
                company=job_data.get("company", "")[:255],
                location=location[:255] if location else None,
                country=country,
                work_type=work_type,
                category=category,
                seniority=seniority,
                description=job_data.get("description"),
                requirements_text=job_data.get("requirements_text"),
                posted_date=job_data.get("posted_date"),
                salary_min=job_data.get("salary_min"),
                salary_max=job_data.get("salary_max"),
                raw_data=job_data.get("raw_data"),
            )

            self.db.add(job)
            await self.db.flush()  # Get ID without committing

            return job

        except Exception as e:
            logger.error(f"Failed to create job: {e}")
            return None

    async def _update_job(self, job: JobPosting, job_data: Dict[str, Any]):
        """Update existing job with new data."""
        # Only update if we have more data
        if job_data.get("description") and not job.description:
            job.description = job_data["description"]
        if job_data.get("salary_min") and not job.salary_min:
            job.salary_min = job_data["salary_min"]
            job.salary_max = job_data.get("salary_max")
        job.updated_at = datetime.utcnow()

    async def _extract_and_link(
        self,
        job: JobPosting,
        job_data: Dict[str, Any]
    ) -> Dict[str, int]:
        """Extract skills and certifications from job and link them."""
        stats = {"skills": 0, "certs": 0}

        text = f"{job_data.get('title', '')} {job_data.get('description', '')} {job_data.get('requirements_text', '')}"

        if not text.strip():
            return stats

        # Extract using NLP service
        extraction = self.extractor.extract(text)

        # Link skills
        for skill_name in extraction.get("skills", []):
            await self._link_skill(job, skill_name)
            stats["skills"] += 1

        # Link certifications
        for cert_name in extraction.get("certifications", []):
            await self._link_certification(job, cert_name)
            stats["certs"] += 1

        # Extract degree requirements
        degree = extraction.get("degree_required")
        if degree:
            try:
                job.degree_required = DegreeLevel(degree)
            except ValueError:
                pass

        # Extract universities mentioned
        universities = extraction.get("universities", [])
        if universities:
            job.universities_mentioned = universities

        return stats

    async def _link_skill(self, job: JobPosting, skill_name: str):
        """Link a skill to a job."""
        from ..models.skill import Skill

        # Find or create skill
        result = await self.db.execute(
            select(Skill).where(Skill.normalized_name == skill_name.lower())
        )
        skill = result.scalar_one_or_none()

        if not skill:
            skill = Skill(
                name=skill_name,
                normalized_name=skill_name.lower(),
                display_name=skill_name,
            )
            self.db.add(skill)
            await self.db.flush()

        # Update stats
        skill.total_mentions += 1
        skill.last_seen = datetime.utcnow()

        # Link to job (if not already linked)
        if skill not in job.skills:
            job.skills.append(skill)

    async def _link_certification(self, job: JobPosting, cert_name: str):
        """Link a certification to a job."""
        from ..models.certification import Certification

        result = await self.db.execute(
            select(Certification).where(Certification.normalized_name == cert_name.lower())
        )
        cert = result.scalar_one_or_none()

        if not cert:
            cert = Certification(
                name=cert_name,
                normalized_name=cert_name.lower(),
                display_name=cert_name,
            )
            self.db.add(cert)
            await self.db.flush()

        cert.total_mentions += 1
        cert.last_seen = datetime.utcnow()

        if cert not in job.certifications:
            job.certifications.append(cert)

    def _generate_queries(self, categories: List[str]) -> List[str]:
        """Generate search queries based on categories."""
        queries = []
        for category in categories:
            if category in JOB_SEARCH_QUERIES:
                queries.extend(JOB_SEARCH_QUERIES[category])
            else:
                queries.append(category.replace("_", " "))
        return list(set(queries))

    def _infer_category(self, title: str) -> JobCategory:
        """Infer job category from title."""
        title_lower = title.lower()

        category_keywords = {
            JobCategory.SOFTWARE_ENGINEERING: ["software", "developer", "engineer", "programmer", "full stack", "backend", "frontend"],
            JobCategory.DATA_SCIENCE: ["data scientist", "machine learning", "ml engineer", "ai ", "nlp", "computer vision"],
            JobCategory.DATA_ENGINEERING: ["data engineer", "etl", "data architect", "analytics engineer"],
            JobCategory.DEVOPS: ["devops", "sre", "site reliability", "platform engineer", "infrastructure"],
            JobCategory.PRODUCT_MANAGEMENT: ["product manager", "product owner", "pm "],
            JobCategory.DESIGN: ["designer", "ux", "ui ", "user experience"],
            JobCategory.MARKETING: ["marketing", "growth", "seo", "sem"],
            JobCategory.SALES: ["sales", "account executive", "business development"],
        }

        for category, keywords in category_keywords.items():
            if any(kw in title_lower for kw in keywords):
                return category

        return JobCategory.OTHER

    def _infer_seniority(self, title: str) -> SeniorityLevel:
        """Infer seniority from title."""
        title_lower = title.lower()

        seniority_keywords = {
            SeniorityLevel.INTERN: ["intern", "internship"],
            SeniorityLevel.JUNIOR: ["junior", "jr.", "entry level", "associate"],
            SeniorityLevel.MID: ["mid-level", "mid level"],
            SeniorityLevel.SENIOR: ["senior", "sr."],
            SeniorityLevel.LEAD: ["lead", "tech lead", "team lead"],
            SeniorityLevel.STAFF: ["staff", "principal"],
            SeniorityLevel.DIRECTOR: ["director"],
            SeniorityLevel.VP: ["vp ", "vice president"],
            SeniorityLevel.EXECUTIVE: ["cto", "ceo", "chief", "head of"],
        }

        for level, keywords in seniority_keywords.items():
            if any(kw in title_lower for kw in keywords):
                return level

        return SeniorityLevel.UNKNOWN

    def _extract_country(self, location: str) -> Optional[str]:
        """Extract country from location string."""
        if not location:
            return None

        location_lower = location.lower()

        # Common country patterns
        countries = {
            "united states": "United States",
            "usa": "United States",
            "us": "United States",
            "united kingdom": "United Kingdom",
            "uk": "United Kingdom",
            "canada": "Canada",
            "germany": "Germany",
            "france": "France",
            "australia": "Australia",
            "india": "India",
            "remote": "Remote",
        }

        for pattern, country in countries.items():
            if pattern in location_lower:
                return country

        # Check for state abbreviations (US)
        us_states = ["ca", "ny", "tx", "wa", "ma", "il", "fl", "co", "ga", "nc"]
        for state in us_states:
            if f", {state}" in location_lower or location_lower.endswith(f" {state}"):
                return "United States"

        return None

    async def cleanup(self):
        """Clean up resources."""
        await self.linkedin.close()
