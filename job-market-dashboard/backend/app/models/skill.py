"""
Skill model for tracking technical and soft skills.
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from typing import Optional, List

from ..core.database import Base


class SkillCategory(Base):
    """Categories for organizing skills."""
    __tablename__ = "skill_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    skills: Mapped[List["Skill"]] = relationship("Skill", back_populates="category")


class Skill(Base):
    """
    Normalized skill tracking.

    Skills are extracted from job postings and normalized to prevent duplicates
    (e.g., 'Python', 'python', 'Python 3' -> 'Python').
    """
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Identifiers
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    normalized_name: Mapped[str] = mapped_column(String(200), index=True)  # lowercase, cleaned
    display_name: Mapped[str] = mapped_column(String(200))  # Pretty display version

    # Classification
    category_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("skill_categories.id"), nullable=True)
    is_hard_skill: Mapped[bool] = mapped_column(Boolean, default=True)  # Hard vs soft skill

    # Aliases for matching
    aliases: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of aliases

    # Stats (denormalized for performance)
    total_mentions: Mapped[int] = mapped_column(Integer, default=0)
    required_mentions: Mapped[int] = mapped_column(Integer, default=0)
    preferred_mentions: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    first_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category: Mapped[Optional["SkillCategory"]] = relationship("SkillCategory", back_populates="skills")
    jobs: Mapped[List["JobPosting"]] = relationship(
        "JobPosting", secondary="job_skills", back_populates="skills"
    )

    __table_args__ = (
        Index("ix_skill_mentions", "total_mentions"),
        Index("ix_skill_category_mentions", "category_id", "total_mentions"),
    )


# Pre-defined skill categories
DEFAULT_SKILL_CATEGORIES = [
    {"name": "Programming Languages", "description": "General-purpose programming languages"},
    {"name": "Web Frameworks", "description": "Frontend and backend web frameworks"},
    {"name": "Databases", "description": "Database systems and query languages"},
    {"name": "Cloud Platforms", "description": "Cloud service providers and platforms"},
    {"name": "DevOps & Tools", "description": "Development operations and tooling"},
    {"name": "Data Science", "description": "Data analysis, ML, and AI tools"},
    {"name": "Mobile Development", "description": "Mobile app development tools"},
    {"name": "Soft Skills", "description": "Non-technical professional skills"},
    {"name": "Design Tools", "description": "UI/UX and graphic design tools"},
    {"name": "Testing", "description": "Testing frameworks and methodologies"},
    {"name": "Security", "description": "Security tools and practices"},
    {"name": "Other Technical", "description": "Other technical skills"},
]


# Import for type hints
from .job import JobPosting
