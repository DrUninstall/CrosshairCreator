"""
Scrape logging for tracking scraping operations.
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
import enum

from ..core.database import Base


class ScrapeStatus(str, enum.Enum):
    """Scrape job status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"  # Some pages failed


class ScrapeLog(Base):
    """
    Log of scraping operations for monitoring and debugging.

    LEGAL NOTE: All scraping operations are logged for compliance.
    Rate limits and robots.txt are respected.
    """
    __tablename__ = "scrape_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Operation info
    source: Mapped[str] = mapped_column(String(50), index=True)
    search_query: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    job_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Status
    status: Mapped[ScrapeStatus] = mapped_column(Enum(ScrapeStatus), default=ScrapeStatus.PENDING, index=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Stats
    pages_scraped: Mapped[int] = mapped_column(Integer, default=0)
    jobs_found: Mapped[int] = mapped_column(Integer, default=0)
    jobs_new: Mapped[int] = mapped_column(Integer, default=0)
    jobs_updated: Mapped[int] = mapped_column(Integer, default=0)
    skills_extracted: Mapped[int] = mapped_column(Integer, default=0)
    certs_extracted: Mapped[int] = mapped_column(Integer, default=0)

    # Rate limiting
    requests_made: Mapped[int] = mapped_column(Integer, default=0)
    rate_limited: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timing
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Triggered by
    triggered_by: Mapped[str] = mapped_column(String(50), default="scheduler")  # scheduler, manual, api

    def mark_completed(self, jobs_found: int, jobs_new: int):
        """Mark the scrape as completed."""
        self.status = ScrapeStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        self.jobs_found = jobs_found
        self.jobs_new = jobs_new
        if self.started_at:
            self.duration_seconds = int((self.completed_at - self.started_at).total_seconds())

    def mark_failed(self, error: str):
        """Mark the scrape as failed."""
        self.status = ScrapeStatus.FAILED
        self.error_message = error
        self.completed_at = datetime.utcnow()
        if self.started_at:
            self.duration_seconds = int((self.completed_at - self.started_at).total_seconds())
