"""Database models for Job Market Intelligence."""
from .job import JobPosting, JobSkill, JobCertification
from .skill import Skill, SkillCategory
from .certification import Certification
from .analytics import SkillTrend, CertificationTrend, DegreeDistribution
from .scrape_log import ScrapeLog

__all__ = [
    "JobPosting",
    "JobSkill",
    "JobCertification",
    "Skill",
    "SkillCategory",
    "Certification",
    "SkillTrend",
    "CertificationTrend",
    "DegreeDistribution",
    "ScrapeLog",
]
