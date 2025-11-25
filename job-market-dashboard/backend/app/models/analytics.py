"""
Analytics models for tracking trends over time.
"""
from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, Index, Float
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, date
from typing import Optional

from ..core.database import Base


class SkillTrend(Base):
    """
    Daily skill mention trends for time-series analysis.
    Aggregated daily to show how skill demand changes over time.
    """
    __tablename__ = "skill_trends"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)

    # Counts
    total_mentions: Mapped[int] = mapped_column(Integer, default=0)
    required_mentions: Mapped[int] = mapped_column(Integer, default=0)
    preferred_mentions: Mapped[int] = mapped_column(Integer, default=0)
    unique_companies: Mapped[int] = mapped_column(Integer, default=0)

    # Filters applied (for segmented trends)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    seniority: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_skill_trend_date_skill", "date", "skill_id"),
        Index("ix_skill_trend_filters", "skill_id", "country", "category", "seniority"),
    )


class CertificationTrend(Base):
    """Daily certification mention trends."""
    __tablename__ = "certification_trends"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    certification_id: Mapped[int] = mapped_column(Integer, ForeignKey("certifications.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)

    # Counts
    total_mentions: Mapped[int] = mapped_column(Integer, default=0)
    required_mentions: Mapped[int] = mapped_column(Integer, default=0)
    preferred_mentions: Mapped[int] = mapped_column(Integer, default=0)
    unique_companies: Mapped[int] = mapped_column(Integer, default=0)

    # Filters
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_cert_trend_date", "date", "certification_id"),
    )


class DegreeDistribution(Base):
    """Daily degree requirement distribution."""
    __tablename__ = "degree_distributions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    date: Mapped[date] = mapped_column(Date, index=True)
    degree_level: Mapped[str] = mapped_column(String(50), index=True)

    # Counts
    required_count: Mapped[int] = mapped_column(Integer, default=0)
    preferred_count: Mapped[int] = mapped_column(Integer, default=0)
    percentage: Mapped[float] = mapped_column(Float, default=0.0)

    # Filters
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_degree_dist_date", "date", "degree_level"),
    )


class UniversityMention(Base):
    """Track mentions of specific universities or tiers."""
    __tablename__ = "university_mentions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    university_name: Mapped[str] = mapped_column(String(200), index=True)
    normalized_name: Mapped[str] = mapped_column(String(200), index=True)
    tier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # ivy, russell_group, top_50, etc.
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    total_mentions: Mapped[int] = mapped_column(Integer, default=0)

    first_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_uni_mentions", "total_mentions"),
    )


# University tiers for classification
UNIVERSITY_TIERS = {
    "ivy_league": [
        "Harvard", "Yale", "Princeton", "Columbia", "Brown",
        "Cornell", "Dartmouth", "Penn", "University of Pennsylvania"
    ],
    "russell_group": [
        "Oxford", "Cambridge", "Imperial College", "LSE", "UCL",
        "Edinburgh", "Manchester", "Bristol", "King's College London"
    ],
    "top_tech": [
        "MIT", "Stanford", "Carnegie Mellon", "Caltech", "Georgia Tech",
        "Berkeley", "UC Berkeley", "ETH Zurich", "IIT"
    ],
    "top_50_us": [
        "Duke", "Northwestern", "Stanford", "Chicago", "Johns Hopkins",
        "UCLA", "Michigan", "UVA", "NYU", "USC"
    ]
}
