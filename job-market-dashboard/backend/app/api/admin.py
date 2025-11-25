"""
Admin API endpoints.

Protected endpoints for administrative tasks like
triggering scrapes and clearing caches.
"""
from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from datetime import datetime

from ..core.database import get_db
from ..core.config import settings
from ..services.cache import cache_service
from ..scrapers.aggregator import JobAggregator, AggregatorConfig
from ..models.scrape_log import ScrapeLog, ScrapeStatus

router = APIRouter()


def verify_admin_key(x_admin_key: str = Header(..., alias="X-Admin-Key")):
    """Verify admin API key."""
    if x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    return True


@router.post("/scrape/trigger")
async def trigger_scrape(
    categories: Optional[str] = None,  # comma-separated
    locations: Optional[str] = None,   # comma-separated
    remote_only: bool = False,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key),
):
    """
    Trigger a new scrape job.

    This runs in the background and returns immediately.
    Check scrape logs for progress.
    """
    config = AggregatorConfig(
        enable_serpapi=bool(settings.SERPAPI_KEY),
        enable_indeed=bool(settings.SERPAPI_KEY),
        enable_linkedin=bool(settings.BRIGHTDATA_USERNAME or settings.PROXY_HOST),
        remote_only=remote_only,
    )

    if categories:
        config.categories = [c.strip() for c in categories.split(",")]

    if locations:
        config.locations = [l.strip() for l in locations.split(",")]

    async def run_scrape():
        aggregator = JobAggregator(db)
        try:
            result = await aggregator.run_full_scrape(config, triggered_by="api")
            return result
        finally:
            await aggregator.cleanup()

    if background_tasks:
        background_tasks.add_task(run_scrape)
        return {
            "status": "started",
            "message": "Scrape job started in background",
            "config": {
                "categories": config.categories,
                "locations": config.locations,
                "remote_only": config.remote_only,
            }
        }
    else:
        # Run synchronously (for testing)
        result = await run_scrape()
        return {
            "status": "completed",
            "result": result,
        }


@router.get("/scrape/logs")
async def get_scrape_logs(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key),
):
    """
    Get recent scrape logs.
    """
    query = (
        select(ScrapeLog)
        .order_by(desc(ScrapeLog.started_at))
        .limit(limit)
    )

    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        {
            "id": log.id,
            "source": log.source,
            "status": log.status.value,
            "jobs_found": log.jobs_found,
            "jobs_new": log.jobs_new,
            "duration_seconds": log.duration_seconds,
            "started_at": log.started_at.isoformat() if log.started_at else None,
            "completed_at": log.completed_at.isoformat() if log.completed_at else None,
            "error_message": log.error_message,
            "triggered_by": log.triggered_by,
        }
        for log in logs
    ]


@router.post("/cache/clear")
async def clear_cache(
    pattern: Optional[str] = None,
    _: bool = Depends(verify_admin_key),
):
    """
    Clear cached data.

    If pattern is provided, only clear matching keys.
    Otherwise, clear all dashboard caches.
    """
    await cache_service.connect()

    if pattern:
        count = await cache_service.clear_pattern(pattern)
        return {"message": f"Cleared {count} keys matching {pattern}"}
    else:
        count = await cache_service.clear_dashboard_cache()
        return {"message": f"Cleared {count} dashboard cache keys"}


@router.post("/cache/clear-all")
async def clear_all_caches(
    _: bool = Depends(verify_admin_key),
):
    """
    Clear ALL cached data. Use with caution.
    """
    await cache_service.connect()
    result = await cache_service.clear_all_caches()
    return {"message": "All caches cleared", "success": bool(result)}


@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key),
):
    """
    Get administrative statistics.
    """
    from ..models.job import JobPosting
    from ..models.skill import Skill
    from ..models.certification import Certification
    from datetime import timedelta

    now = datetime.utcnow()

    # Total counts
    jobs_total = await db.execute(select(func.count(JobPosting.id)))
    skills_total = await db.execute(select(func.count(Skill.id)))
    certs_total = await db.execute(select(func.count(Certification.id)))

    # Recent counts
    week_ago = now - timedelta(days=7)
    jobs_week = await db.execute(
        select(func.count(JobPosting.id)).where(JobPosting.scraped_at >= week_ago)
    )

    # Scrape stats
    successful_scrapes = await db.execute(
        select(func.count(ScrapeLog.id)).where(ScrapeLog.status == ScrapeStatus.COMPLETED)
    )
    failed_scrapes = await db.execute(
        select(func.count(ScrapeLog.id)).where(ScrapeLog.status == ScrapeStatus.FAILED)
    )

    # Last scrape
    last_scrape = await db.execute(
        select(ScrapeLog).order_by(desc(ScrapeLog.started_at)).limit(1)
    )
    last = last_scrape.scalar_one_or_none()

    return {
        "totals": {
            "jobs": jobs_total.scalar() or 0,
            "skills": skills_total.scalar() or 0,
            "certifications": certs_total.scalar() or 0,
        },
        "jobs_this_week": jobs_week.scalar() or 0,
        "scrapes": {
            "successful": successful_scrapes.scalar() or 0,
            "failed": failed_scrapes.scalar() or 0,
        },
        "last_scrape": {
            "started_at": last.started_at.isoformat() if last else None,
            "status": last.status.value if last else None,
            "jobs_found": last.jobs_found if last else 0,
        } if last else None,
        "generated_at": now.isoformat(),
    }


@router.delete("/jobs/old")
async def delete_old_jobs(
    days: int = 90,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_key),
):
    """
    Delete jobs older than specified days.
    """
    from ..models.job import JobPosting
    from sqlalchemy import delete

    cutoff = datetime.utcnow() - datetime.timedelta(days=days)

    # Count first
    count_query = select(func.count(JobPosting.id)).where(JobPosting.scraped_at < cutoff)
    count_result = await db.execute(count_query)
    count = count_result.scalar() or 0

    if count > 0:
        delete_query = delete(JobPosting).where(JobPosting.scraped_at < cutoff)
        await db.execute(delete_query)
        await db.commit()

    return {
        "message": f"Deleted {count} jobs older than {days} days",
        "deleted_count": count,
    }
