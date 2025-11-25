"""
Analytics service for computing dashboard metrics.

Handles:
- Top skills ranking
- Certification rankings
- Degree distribution
- Trend calculations
- Filter aggregations
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, desc, text
from sqlalchemy.orm import selectinload

from ..models.job import JobPosting, JobCategory, SeniorityLevel, WorkType, DegreeLevel, job_skills, job_certifications
from ..models.skill import Skill
from ..models.certification import Certification
from ..models.analytics import SkillTrend, CertificationTrend, DegreeDistribution
from .cache import cache_service

logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Analytics service for computing dashboard metrics.

    All queries are optimized and cached for performance.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_summary(
        self,
        country: Optional[str] = None,
        category: Optional[str] = None,
        seniority: Optional[str] = None,
        work_type: Optional[str] = None,
        company: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get complete dashboard summary with all metrics.

        Args:
            country: Filter by country
            category: Filter by job category
            seniority: Filter by seniority level
            work_type: Filter by work type (remote/hybrid/onsite)
            company: Filter by company name
            days: Number of days to look back

        Returns:
            Dictionary with all dashboard metrics
        """
        # Build filter conditions
        filters = self._build_filters(country, category, seniority, work_type, company, days)

        # Check cache
        cache_key_data = {
            "country": country, "category": category, "seniority": seniority,
            "work_type": work_type, "company": company, "days": days
        }
        cached = await cache_service.get_dashboard_data(cache_key_data)
        if cached:
            return cached

        # Compute metrics
        result = {
            "total_jobs": await self._count_jobs(filters),
            "top_skills": await self._get_top_skills(filters, limit=50),
            "top_certifications": await self._get_top_certifications(filters, limit=30),
            "degree_distribution": await self._get_degree_distribution(filters),
            "notable_universities": await self._get_university_mentions(filters),
            "work_type_distribution": await self._get_work_type_distribution(filters),
            "seniority_distribution": await self._get_seniority_distribution(filters),
            "category_distribution": await self._get_category_distribution(filters),
            "top_companies": await self._get_top_companies(filters, limit=20),
            "recent_trend": await self._get_recent_trend(filters, days=days),
            "filters_applied": cache_key_data,
            "generated_at": datetime.utcnow().isoformat(),
        }

        # Cache result
        await cache_service.set_dashboard_data(cache_key_data, result, ttl=3600)

        return result

    def _build_filters(
        self,
        country: Optional[str],
        category: Optional[str],
        seniority: Optional[str],
        work_type: Optional[str],
        company: Optional[str],
        days: int
    ) -> List:
        """Build SQLAlchemy filter conditions."""
        conditions = []

        # Date filter
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        conditions.append(JobPosting.scraped_at >= cutoff_date)

        if country:
            if country.lower() == "remote":
                conditions.append(JobPosting.work_type == WorkType.REMOTE)
            else:
                conditions.append(JobPosting.country == country)

        if category:
            try:
                cat_enum = JobCategory(category)
                conditions.append(JobPosting.category == cat_enum)
            except ValueError:
                pass

        if seniority:
            try:
                sen_enum = SeniorityLevel(seniority)
                conditions.append(JobPosting.seniority == sen_enum)
            except ValueError:
                pass

        if work_type:
            try:
                wt_enum = WorkType(work_type)
                conditions.append(JobPosting.work_type == wt_enum)
            except ValueError:
                pass

        if company:
            conditions.append(JobPosting.company.ilike(f"%{company}%"))

        return conditions

    async def _count_jobs(self, filters: List) -> int:
        """Count total jobs matching filters."""
        query = select(func.count(JobPosting.id)).where(and_(*filters))
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def _get_top_skills(self, filters: List, limit: int = 50) -> List[Dict]:
        """Get top skills by mention count."""
        # Subquery for filtered jobs
        job_subq = (
            select(JobPosting.id)
            .where(and_(*filters))
            .subquery()
        )

        # Join with skills and count
        query = (
            select(
                Skill.id,
                Skill.display_name,
                Skill.is_hard_skill,
                func.count(job_skills.c.job_id).label("mention_count")
            )
            .select_from(Skill)
            .join(job_skills, Skill.id == job_skills.c.skill_id)
            .where(job_skills.c.job_id.in_(select(job_subq.c.id)))
            .group_by(Skill.id, Skill.display_name, Skill.is_hard_skill)
            .order_by(desc("mention_count"))
            .limit(limit)
        )

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "id": row.id,
                "name": row.display_name,
                "count": row.mention_count,
                "is_hard_skill": row.is_hard_skill,
            }
            for row in rows
        ]

    async def _get_top_certifications(self, filters: List, limit: int = 30) -> List[Dict]:
        """Get top certifications by mention count."""
        job_subq = (
            select(JobPosting.id)
            .where(and_(*filters))
            .subquery()
        )

        query = (
            select(
                Certification.id,
                Certification.display_name,
                Certification.acronym,
                Certification.provider,
                Certification.category,
                func.count(job_certifications.c.job_id).label("mention_count")
            )
            .select_from(Certification)
            .join(job_certifications, Certification.id == job_certifications.c.certification_id)
            .where(job_certifications.c.job_id.in_(select(job_subq.c.id)))
            .group_by(
                Certification.id, Certification.display_name,
                Certification.acronym, Certification.provider, Certification.category
            )
            .order_by(desc("mention_count"))
            .limit(limit)
        )

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "id": row.id,
                "name": row.display_name,
                "acronym": row.acronym,
                "provider": row.provider,
                "category": row.category,
                "count": row.mention_count,
            }
            for row in rows
        ]

    async def _get_degree_distribution(self, filters: List) -> List[Dict]:
        """Get distribution of degree requirements."""
        query = (
            select(
                JobPosting.degree_required,
                func.count(JobPosting.id).label("count")
            )
            .where(and_(*filters))
            .group_by(JobPosting.degree_required)
            .order_by(desc("count"))
        )

        result = await self.db.execute(query)
        rows = result.all()

        total = sum(row.count for row in rows)
        return [
            {
                "degree": row.degree_required.value if row.degree_required else "unknown",
                "count": row.count,
                "percentage": round(row.count / total * 100, 1) if total > 0 else 0,
            }
            for row in rows
        ]

    async def _get_university_mentions(self, filters: List) -> List[Dict]:
        """Get notable university mentions."""
        # This uses the universities_mentioned array column
        query = (
            select(
                func.unnest(JobPosting.universities_mentioned).label("university"),
                func.count().label("count")
            )
            .where(
                and_(
                    *filters,
                    JobPosting.universities_mentioned.isnot(None)
                )
            )
            .group_by(text("university"))
            .order_by(desc("count"))
            .limit(20)
        )

        try:
            result = await self.db.execute(query)
            rows = result.all()
            return [{"name": row.university, "count": row.count} for row in rows]
        except Exception:
            # Fallback if array operations not supported
            return []

    async def _get_work_type_distribution(self, filters: List) -> List[Dict]:
        """Get distribution of work types."""
        query = (
            select(
                JobPosting.work_type,
                func.count(JobPosting.id).label("count")
            )
            .where(and_(*filters))
            .group_by(JobPosting.work_type)
            .order_by(desc("count"))
        )

        result = await self.db.execute(query)
        rows = result.all()

        total = sum(row.count for row in rows)
        return [
            {
                "type": row.work_type.value if row.work_type else "unknown",
                "count": row.count,
                "percentage": round(row.count / total * 100, 1) if total > 0 else 0,
            }
            for row in rows
        ]

    async def _get_seniority_distribution(self, filters: List) -> List[Dict]:
        """Get distribution of seniority levels."""
        query = (
            select(
                JobPosting.seniority,
                func.count(JobPosting.id).label("count")
            )
            .where(and_(*filters))
            .group_by(JobPosting.seniority)
            .order_by(desc("count"))
        )

        result = await self.db.execute(query)
        rows = result.all()

        total = sum(row.count for row in rows)
        return [
            {
                "level": row.seniority.value if row.seniority else "unknown",
                "count": row.count,
                "percentage": round(row.count / total * 100, 1) if total > 0 else 0,
            }
            for row in rows
        ]

    async def _get_category_distribution(self, filters: List) -> List[Dict]:
        """Get distribution of job categories."""
        query = (
            select(
                JobPosting.category,
                func.count(JobPosting.id).label("count")
            )
            .where(and_(*filters))
            .group_by(JobPosting.category)
            .order_by(desc("count"))
        )

        result = await self.db.execute(query)
        rows = result.all()

        total = sum(row.count for row in rows)
        return [
            {
                "category": row.category.value if row.category else "other",
                "count": row.count,
                "percentage": round(row.count / total * 100, 1) if total > 0 else 0,
            }
            for row in rows
        ]

    async def _get_top_companies(self, filters: List, limit: int = 20) -> List[Dict]:
        """Get companies with most job postings."""
        query = (
            select(
                JobPosting.company,
                JobPosting.company_type,
                func.count(JobPosting.id).label("count")
            )
            .where(and_(*filters))
            .group_by(JobPosting.company, JobPosting.company_type)
            .order_by(desc("count"))
            .limit(limit)
        )

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "name": row.company,
                "type": row.company_type,
                "count": row.count,
            }
            for row in rows
        ]

    async def _get_recent_trend(self, filters: List, days: int = 30) -> List[Dict]:
        """Get job posting trend over time."""
        # Group by date
        query = (
            select(
                func.date(JobPosting.scraped_at).label("date"),
                func.count(JobPosting.id).label("count")
            )
            .where(and_(*filters))
            .group_by(func.date(JobPosting.scraped_at))
            .order_by(text("date"))
        )

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "date": row.date.isoformat() if row.date else None,
                "count": row.count,
            }
            for row in rows
        ]

    async def get_skill_details(
        self,
        skill_id: int,
        days: int = 90
    ) -> Dict[str, Any]:
        """
        Get detailed information for a specific skill.

        Includes trend over time and sample job postings.
        """
        # Get skill
        skill = await self.db.get(Skill, skill_id)
        if not skill:
            return None

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get trend data
        query = (
            select(
                func.date(JobPosting.scraped_at).label("date"),
                func.count(job_skills.c.job_id).label("count")
            )
            .select_from(job_skills)
            .join(JobPosting, JobPosting.id == job_skills.c.job_id)
            .where(
                and_(
                    job_skills.c.skill_id == skill_id,
                    JobPosting.scraped_at >= cutoff_date
                )
            )
            .group_by(func.date(JobPosting.scraped_at))
            .order_by(text("date"))
        )

        trend_result = await self.db.execute(query)
        trend = [
            {"date": row.date.isoformat(), "count": row.count}
            for row in trend_result.all()
        ]

        # Get sample jobs
        sample_query = (
            select(JobPosting)
            .join(job_skills, JobPosting.id == job_skills.c.job_id)
            .where(
                and_(
                    job_skills.c.skill_id == skill_id,
                    JobPosting.scraped_at >= cutoff_date
                )
            )
            .order_by(desc(JobPosting.scraped_at))
            .limit(10)
        )

        sample_result = await self.db.execute(sample_query)
        samples = [
            {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "url": job.url,
                "posted_date": job.posted_date.isoformat() if job.posted_date else None,
            }
            for job in sample_result.scalars().all()
        ]

        return {
            "id": skill.id,
            "name": skill.display_name,
            "total_mentions": skill.total_mentions,
            "trend": trend,
            "sample_jobs": samples,
        }

    async def get_certification_details(
        self,
        cert_id: int,
        days: int = 90
    ) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific certification."""
        cert = await self.db.get(Certification, cert_id)
        if not cert:
            return None

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get trend
        query = (
            select(
                func.date(JobPosting.scraped_at).label("date"),
                func.count(job_certifications.c.job_id).label("count")
            )
            .select_from(job_certifications)
            .join(JobPosting, JobPosting.id == job_certifications.c.job_id)
            .where(
                and_(
                    job_certifications.c.certification_id == cert_id,
                    JobPosting.scraped_at >= cutoff_date
                )
            )
            .group_by(func.date(JobPosting.scraped_at))
            .order_by(text("date"))
        )

        trend_result = await self.db.execute(query)
        trend = [
            {"date": row.date.isoformat(), "count": row.count}
            for row in trend_result.all()
        ]

        # Sample jobs
        sample_query = (
            select(JobPosting)
            .join(job_certifications, JobPosting.id == job_certifications.c.job_id)
            .where(
                and_(
                    job_certifications.c.certification_id == cert_id,
                    JobPosting.scraped_at >= cutoff_date
                )
            )
            .order_by(desc(JobPosting.scraped_at))
            .limit(10)
        )

        sample_result = await self.db.execute(sample_query)
        samples = [
            {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "url": job.url,
            }
            for job in sample_result.scalars().all()
        ]

        return {
            "id": cert.id,
            "name": cert.display_name,
            "acronym": cert.acronym,
            "provider": cert.provider,
            "category": cert.category,
            "total_mentions": cert.total_mentions,
            "trend": trend,
            "sample_jobs": samples,
        }
