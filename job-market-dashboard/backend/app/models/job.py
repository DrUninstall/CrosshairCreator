"""
Job posting model and related associations.
"""
from sqlalchemy import (
    Column, String, Text, Integer, DateTime, Boolean,
    ForeignKey, Table, Enum, Index, Float
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from datetime import datetime
from typing import Optional, List
import enum

from ..core.database import Base


class SeniorityLevel(str, enum.Enum):
    """Job seniority levels."""
    INTERN = "intern"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    STAFF = "staff"
    PRINCIPAL = "principal"
    DIRECTOR = "director"
    VP = "vp"
    EXECUTIVE = "executive"
    UNKNOWN = "unknown"


class WorkType(str, enum.Enum):
    """Work arrangement type."""
    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"
    UNKNOWN = "unknown"


class DegreeLevel(str, enum.Enum):
    """Academic degree levels."""
    NONE_REQUIRED = "none_required"
    HIGH_SCHOOL = "high_school"
    ASSOCIATE = "associate"
    BACHELOR = "bachelor"
    MASTER = "master"
    MBA = "mba"
    PHD = "phd"
    PROFESSIONAL = "professional"  # JD, MD, etc.
    UNKNOWN = "unknown"


class JobCategory(str, enum.Enum):
    """Job categories/fields."""
    SOFTWARE_ENGINEERING = "software_engineering"
    DATA_SCIENCE = "data_science"
    DATA_ENGINEERING = "data_engineering"
    MACHINE_LEARNING = "machine_learning"
    DEVOPS = "devops"
    PRODUCT_MANAGEMENT = "product_management"
    DESIGN = "design"
    MARKETING = "marketing"
    SALES = "sales"
    FINANCE = "finance"
    HR = "hr"
    OPERATIONS = "operations"
    LEGAL = "legal"
    CONSULTING = "consulting"
    HEALTHCARE = "healthcare"
    OTHER = "other"


# Association table for job-skill many-to-many
job_skills = Table(
    "job_skills",
    Base.metadata,
    Column("job_id", Integer, ForeignKey("job_postings.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
    Column("is_required", Boolean, default=True),  # Required vs preferred
    Column("extracted_at", DateTime, default=datetime.utcnow),
)


# Association table for job-certification many-to-many
job_certifications = Table(
    "job_certifications",
    Base.metadata,
    Column("job_id", Integer, ForeignKey("job_postings.id", ondelete="CASCADE"), primary_key=True),
    Column("certification_id", Integer, ForeignKey("certifications.id", ondelete="CASCADE"), primary_key=True),
    Column("is_required", Boolean, default=False),
    Column("extracted_at", DateTime, default=datetime.utcnow),
)


class JobPosting(Base):
    """
    Job posting model storing scraped job data.

    LEGAL NOTE: Data stored for personal/research purposes only.
    Respect source ToS and rate limits when scraping.
    """
    __tablename__ = "job_postings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Identifiers
    external_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    source: Mapped[str] = mapped_column(String(50), index=True)  # linkedin, indeed, etc.
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Basic info
    title: Mapped[str] = mapped_column(String(500), index=True)
    company: Mapped[str] = mapped_column(String(255), index=True)
    company_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    company_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # FAANG, startup, etc.

    # Location
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    work_type: Mapped[WorkType] = mapped_column(Enum(WorkType), default=WorkType.UNKNOWN, index=True)

    # Classification
    category: Mapped[JobCategory] = mapped_column(Enum(JobCategory), default=JobCategory.OTHER, index=True)
    seniority: Mapped[SeniorityLevel] = mapped_column(Enum(SeniorityLevel), default=SeniorityLevel.UNKNOWN, index=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Education requirements
    degree_required: Mapped[DegreeLevel] = mapped_column(Enum(DegreeLevel), default=DegreeLevel.UNKNOWN)
    degree_preferred: Mapped[Optional[DegreeLevel]] = mapped_column(Enum(DegreeLevel), nullable=True)
    specific_degrees: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)  # CS, Math, etc.
    universities_mentioned: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)

    # Experience
    years_experience_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    years_experience_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Salary (if available)
    salary_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    salary_currency: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Content
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requirements_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Raw data for reprocessing
    raw_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Timestamps
    posted_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    scraped_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skills: Mapped[List["Skill"]] = relationship(
        "Skill", secondary=job_skills, back_populates="jobs"
    )
    certifications: Mapped[List["Certification"]] = relationship(
        "Certification", secondary=job_certifications, back_populates="jobs"
    )

    __table_args__ = (
        Index("ix_job_posted_source", "posted_date", "source"),
        Index("ix_job_category_seniority", "category", "seniority"),
        Index("ix_job_company_country", "company", "country"),
    )


# These are imported for the relationship, defined in separate files
from .skill import Skill
from .certification import Certification
