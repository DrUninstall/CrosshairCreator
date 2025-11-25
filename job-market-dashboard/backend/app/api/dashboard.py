"""
Dashboard API endpoints.

Main endpoints for the skills intelligence dashboard.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from enum import Enum

from ..core.database import get_db
from ..services.analytics import AnalyticsService
from ..models.job import JobCategory, SeniorityLevel, WorkType

router = APIRouter()


class DateRange(str, Enum):
    """Date range options."""
    WEEK = "7"
    MONTH = "30"
    QUARTER = "90"


@router.get("/summary")
async def get_dashboard_summary(
    country: Optional[str] = Query(None, description="Filter by country"),
    category: Optional[str] = Query(None, description="Job category filter"),
    seniority: Optional[str] = Query(None, description="Seniority level filter"),
    work_type: Optional[str] = Query(None, description="Work type (remote/hybrid/onsite)"),
    company: Optional[str] = Query(None, description="Company name filter"),
    days: int = Query(30, ge=7, le=90, description="Number of days to look back"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get complete dashboard summary with all metrics.

    Returns top skills, certifications, degree distribution, and more.
    All metrics are filterable and combinable.

    DISCLAIMER: Data shown for personal/research use only.
    """
    analytics = AnalyticsService(db)
    return await analytics.get_dashboard_summary(
        country=country,
        category=category,
        seniority=seniority,
        work_type=work_type,
        company=company,
        days=days,
    )


@router.get("/filters")
async def get_filter_options(
    db: AsyncSession = Depends(get_db),
):
    """
    Get available filter options for the dashboard.

    Returns lists of countries, categories, seniority levels, etc.
    """
    from sqlalchemy import select, func, distinct
    from ..models.job import JobPosting

    # Get distinct countries
    countries_query = select(distinct(JobPosting.country)).where(JobPosting.country.isnot(None))
    countries_result = await db.execute(countries_query)
    countries = [row[0] for row in countries_result.all()]

    # Get distinct companies (top 100 by count)
    companies_query = (
        select(JobPosting.company, func.count(JobPosting.id).label("count"))
        .group_by(JobPosting.company)
        .order_by(func.count(JobPosting.id).desc())
        .limit(100)
    )
    companies_result = await db.execute(companies_query)
    companies = [row.company for row in companies_result.all()]

    return {
        "countries": sorted(countries),
        "categories": [c.value for c in JobCategory],
        "seniority_levels": [s.value for s in SeniorityLevel],
        "work_types": [w.value for w in WorkType],
        "companies": companies,
        "date_ranges": [
            {"label": "Last 7 days", "value": 7},
            {"label": "Last 30 days", "value": 30},
            {"label": "Last 90 days", "value": 90},
        ],
    }


@router.get("/stats")
async def get_quick_stats(
    db: AsyncSession = Depends(get_db),
):
    """
    Get quick statistics for the dashboard header.

    Returns total jobs, skills, certifications counts.
    """
    from sqlalchemy import select, func
    from ..models.job import JobPosting
    from ..models.skill import Skill
    from ..models.certification import Certification
    from datetime import datetime, timedelta

    # Total jobs in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    jobs_query = select(func.count(JobPosting.id)).where(JobPosting.scraped_at >= thirty_days_ago)
    jobs_result = await db.execute(jobs_query)
    total_jobs = jobs_result.scalar() or 0

    # Total unique skills
    skills_query = select(func.count(Skill.id))
    skills_result = await db.execute(skills_query)
    total_skills = skills_result.scalar() or 0

    # Total certifications
    certs_query = select(func.count(Certification.id))
    certs_result = await db.execute(certs_query)
    total_certs = certs_result.scalar() or 0

    # Jobs today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_query = select(func.count(JobPosting.id)).where(JobPosting.scraped_at >= today)
    today_result = await db.execute(today_query)
    jobs_today = today_result.scalar() or 0

    return {
        "total_jobs": total_jobs,
        "total_skills": total_skills,
        "total_certifications": total_certs,
        "jobs_today": jobs_today,
        "last_updated": datetime.utcnow().isoformat(),
    }
