"""
Certification model for tracking professional certifications.
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from typing import Optional, List

from ..core.database import Base


class Certification(Base):
    """
    Professional certification tracking.

    Certifications are extracted from job postings and normalized.
    """
    __tablename__ = "certifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Identifiers
    name: Mapped[str] = mapped_column(String(300), unique=True, index=True)
    normalized_name: Mapped[str] = mapped_column(String(300), index=True)
    display_name: Mapped[str] = mapped_column(String(300))
    acronym: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

    # Provider info
    provider: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # AWS, Google, etc.
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Cloud, Security, PM, etc.

    # Aliases for matching
    aliases: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array

    # Stats
    total_mentions: Mapped[int] = mapped_column(Integer, default=0)
    required_mentions: Mapped[int] = mapped_column(Integer, default=0)
    preferred_mentions: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    first_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    jobs: Mapped[List["JobPosting"]] = relationship(
        "JobPosting", secondary="job_certifications", back_populates="certifications"
    )

    __table_args__ = (
        Index("ix_cert_mentions", "total_mentions"),
        Index("ix_cert_provider", "provider", "total_mentions"),
    )


# Common certifications to seed the database
COMMON_CERTIFICATIONS = [
    # AWS
    {"name": "AWS Certified Solutions Architect - Associate", "acronym": "SAA", "provider": "AWS", "category": "Cloud"},
    {"name": "AWS Certified Solutions Architect - Professional", "acronym": "SAP", "provider": "AWS", "category": "Cloud"},
    {"name": "AWS Certified Developer - Associate", "acronym": "DVA", "provider": "AWS", "category": "Cloud"},
    {"name": "AWS Certified DevOps Engineer - Professional", "acronym": "DOP", "provider": "AWS", "category": "Cloud"},
    {"name": "AWS Certified Machine Learning - Specialty", "acronym": "MLS", "provider": "AWS", "category": "Cloud"},

    # Google Cloud
    {"name": "Google Cloud Professional Cloud Architect", "acronym": "GCP-PCA", "provider": "Google", "category": "Cloud"},
    {"name": "Google Cloud Professional Data Engineer", "acronym": "GCP-PDE", "provider": "Google", "category": "Cloud"},
    {"name": "Google Cloud Associate Cloud Engineer", "acronym": "GCP-ACE", "provider": "Google", "category": "Cloud"},

    # Azure
    {"name": "Microsoft Azure Administrator", "acronym": "AZ-104", "provider": "Microsoft", "category": "Cloud"},
    {"name": "Microsoft Azure Solutions Architect Expert", "acronym": "AZ-305", "provider": "Microsoft", "category": "Cloud"},
    {"name": "Microsoft Azure Developer Associate", "acronym": "AZ-204", "provider": "Microsoft", "category": "Cloud"},
    {"name": "Microsoft Azure Data Engineer Associate", "acronym": "DP-203", "provider": "Microsoft", "category": "Cloud"},

    # Kubernetes
    {"name": "Certified Kubernetes Administrator", "acronym": "CKA", "provider": "CNCF", "category": "DevOps"},
    {"name": "Certified Kubernetes Application Developer", "acronym": "CKAD", "provider": "CNCF", "category": "DevOps"},
    {"name": "Certified Kubernetes Security Specialist", "acronym": "CKS", "provider": "CNCF", "category": "DevOps"},

    # Security
    {"name": "Certified Information Systems Security Professional", "acronym": "CISSP", "provider": "ISC2", "category": "Security"},
    {"name": "Certified Ethical Hacker", "acronym": "CEH", "provider": "EC-Council", "category": "Security"},
    {"name": "CompTIA Security+", "acronym": "Security+", "provider": "CompTIA", "category": "Security"},
    {"name": "CompTIA Network+", "acronym": "Network+", "provider": "CompTIA", "category": "Networking"},

    # Data
    {"name": "Databricks Certified Data Engineer", "acronym": "DCE", "provider": "Databricks", "category": "Data"},
    {"name": "Snowflake SnowPro Core Certification", "acronym": "SnowPro", "provider": "Snowflake", "category": "Data"},
    {"name": "Google Professional Machine Learning Engineer", "acronym": "PMLE", "provider": "Google", "category": "ML"},

    # Project Management
    {"name": "Project Management Professional", "acronym": "PMP", "provider": "PMI", "category": "Management"},
    {"name": "Certified Scrum Master", "acronym": "CSM", "provider": "Scrum Alliance", "category": "Agile"},
    {"name": "Professional Scrum Master", "acronym": "PSM", "provider": "Scrum.org", "category": "Agile"},
    {"name": "SAFe Agilist", "acronym": "SA", "provider": "Scaled Agile", "category": "Agile"},

    # Other
    {"name": "Terraform Associate", "acronym": "TFA", "provider": "HashiCorp", "category": "DevOps"},
    {"name": "Docker Certified Associate", "acronym": "DCA", "provider": "Docker", "category": "DevOps"},
]


from .job import JobPosting
