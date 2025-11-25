"""
Scheduler for automated scraping jobs.

Runs scraping tasks on a schedule to keep data fresh.
Use with caution and respect rate limits.

LEGAL NOTE: Ensure you have appropriate API keys configured
and are not violating any ToS with automated scraping.
"""
import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from .core.database import AsyncSessionLocal
from .scrapers.aggregator import JobAggregator, AggregatorConfig
from .services.cache import cache_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def run_daily_scrape():
    """Run daily scraping job."""
    logger.info("Starting scheduled daily scrape")

    async with AsyncSessionLocal() as db:
        aggregator = JobAggregator(db)

        config = AggregatorConfig(
            enable_serpapi=True,
            enable_indeed=True,
            enable_linkedin=False,  # Disabled by default
            categories=["software_engineering", "data_science", "devops"],
            locations=["United States", "United Kingdom", "Remote"],
            date_posted="week",
            max_pages_per_source=3,
        )

        try:
            result = await aggregator.run_full_scrape(config, triggered_by="scheduler")
            logger.info(f"Daily scrape completed: {result}")

            # Clear dashboard cache after scrape
            await cache_service.connect()
            await cache_service.clear_dashboard_cache()
            logger.info("Dashboard cache cleared")

        except Exception as e:
            logger.error(f"Daily scrape failed: {e}")
        finally:
            await aggregator.cleanup()


async def run_weekly_deep_scrape():
    """Run weekly deep scraping job with more categories."""
    logger.info("Starting scheduled weekly deep scrape")

    async with AsyncSessionLocal() as db:
        aggregator = JobAggregator(db)

        config = AggregatorConfig(
            enable_serpapi=True,
            enable_indeed=True,
            enable_linkedin=False,
            categories=[
                "software_engineering",
                "data_science",
                "data_engineering",
                "devops",
                "product_management",
                "machine_learning",
            ],
            locations=[
                "United States",
                "United Kingdom",
                "Canada",
                "Germany",
                "Remote",
            ],
            date_posted="month",
            max_pages_per_source=5,
        )

        try:
            result = await aggregator.run_full_scrape(config, triggered_by="scheduler")
            logger.info(f"Weekly deep scrape completed: {result}")

            await cache_service.connect()
            await cache_service.clear_all_caches()

        except Exception as e:
            logger.error(f"Weekly scrape failed: {e}")
        finally:
            await aggregator.cleanup()


def main():
    """Main entry point for scheduler."""
    logger.info("Starting Job Market Intelligence Scheduler")

    scheduler = AsyncIOScheduler()

    # Daily scrape at 2 AM UTC
    scheduler.add_job(
        run_daily_scrape,
        CronTrigger(hour=2, minute=0),
        id="daily_scrape",
        name="Daily Job Scrape",
        replace_existing=True,
    )

    # Weekly deep scrape on Sunday at 3 AM UTC
    scheduler.add_job(
        run_weekly_deep_scrape,
        CronTrigger(day_of_week="sun", hour=3, minute=0),
        id="weekly_scrape",
        name="Weekly Deep Scrape",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler started. Jobs scheduled:")
    for job in scheduler.get_jobs():
        logger.info(f"  - {job.name}: {job.trigger}")

    # Keep running
    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler shutting down")
        scheduler.shutdown()


if __name__ == "__main__":
    main()
