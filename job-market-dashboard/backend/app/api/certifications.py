"""
Certifications API endpoints.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional

from ..core.database import get_db
from ..services.analytics import AnalyticsService
from ..models.certification import Certification

router = APIRouter()


@router.get("/")
async def list_certifications(
    search: Optional[str] = Query(None, description="Search by name or acronym"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    List all certifications with optional filters.
    """
    query = select(Certification)

    if search:
        query = query.where(
            (Certification.display_name.ilike(f"%{search}%")) |
            (Certification.acronym.ilike(f"%{search}%"))
        )

    if provider:
        query = query.where(Certification.provider.ilike(f"%{provider}%"))

    if category:
        query = query.where(Certification.category.ilike(f"%{category}%"))

    query = query.order_by(desc(Certification.total_mentions)).offset(offset).limit(limit)

    result = await db.execute(query)
    certs = result.scalars().all()

    return {
        "items": [
            {
                "id": c.id,
                "name": c.display_name,
                "acronym": c.acronym,
                "provider": c.provider,
                "category": c.category,
                "total_mentions": c.total_mentions,
            }
            for c in certs
        ],
        "total": len(certs),
    }


@router.get("/providers")
async def list_providers(
    db: AsyncSession = Depends(get_db),
):
    """
    List all certification providers.
    """
    query = (
        select(
            Certification.provider,
            func.count(Certification.id).label("count")
        )
        .where(Certification.provider.isnot(None))
        .group_by(Certification.provider)
        .order_by(desc("count"))
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        {"provider": row.provider, "count": row.count}
        for row in rows
    ]


@router.get("/{cert_id}")
async def get_certification(
    cert_id: int = Path(..., description="Certification ID"),
    days: int = Query(90, ge=7, le=365, description="Days for trend data"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information for a specific certification.

    Includes trend over time and sample job postings.
    """
    analytics = AnalyticsService(db)
    result = await analytics.get_certification_details(cert_id, days=days)

    if not result:
        raise HTTPException(status_code=404, detail="Certification not found")

    return result


@router.get("/{cert_id}/jobs")
async def get_certification_jobs(
    cert_id: int = Path(..., description="Certification ID"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get jobs that mention a specific certification.
    """
    from ..models.job import JobPosting, job_certifications

    cert = await db.get(Certification, cert_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")

    query = (
        select(JobPosting)
        .join(job_certifications, JobPosting.id == job_certifications.c.job_id)
        .where(job_certifications.c.certification_id == cert_id)
        .order_by(desc(JobPosting.scraped_at))
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(query)
    jobs = result.scalars().all()

    return {
        "certification": {
            "id": cert.id,
            "name": cert.display_name,
            "acronym": cert.acronym,
        },
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "work_type": j.work_type.value if j.work_type else None,
                "url": j.url,
                "posted_date": j.posted_date.isoformat() if j.posted_date else None,
            }
            for j in jobs
        ],
    }
