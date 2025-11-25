"""
Skills API endpoints.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional, List

from ..core.database import get_db
from ..services.analytics import AnalyticsService
from ..models.skill import Skill

router = APIRouter()


@router.get("/")
async def list_skills(
    search: Optional[str] = Query(None, description="Search skills by name"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    is_hard_skill: Optional[bool] = Query(None, description="Filter by skill type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    List all skills with optional filters.
    """
    query = select(Skill)

    if search:
        query = query.where(Skill.display_name.ilike(f"%{search}%"))

    if category_id:
        query = query.where(Skill.category_id == category_id)

    if is_hard_skill is not None:
        query = query.where(Skill.is_hard_skill == is_hard_skill)

    query = query.order_by(desc(Skill.total_mentions)).offset(offset).limit(limit)

    result = await db.execute(query)
    skills = result.scalars().all()

    return {
        "items": [
            {
                "id": s.id,
                "name": s.display_name,
                "normalized_name": s.normalized_name,
                "total_mentions": s.total_mentions,
                "is_hard_skill": s.is_hard_skill,
                "category_id": s.category_id,
            }
            for s in skills
        ],
        "total": len(skills),
    }


@router.get("/{skill_id}")
async def get_skill(
    skill_id: int = Path(..., description="Skill ID"),
    days: int = Query(90, ge=7, le=365, description="Days for trend data"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information for a specific skill.

    Includes trend over time and sample job postings that mention this skill.
    Click on a skill in the dashboard to see this detailed view.
    """
    analytics = AnalyticsService(db)
    result = await analytics.get_skill_details(skill_id, days=days)

    if not result:
        raise HTTPException(status_code=404, detail="Skill not found")

    return result


@router.get("/{skill_id}/jobs")
async def get_skill_jobs(
    skill_id: int = Path(..., description="Skill ID"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get jobs that mention a specific skill.
    """
    from ..models.job import JobPosting, job_skills

    # Check skill exists
    skill = await db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    query = (
        select(JobPosting)
        .join(job_skills, JobPosting.id == job_skills.c.job_id)
        .where(job_skills.c.skill_id == skill_id)
        .order_by(desc(JobPosting.scraped_at))
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(query)
    jobs = result.scalars().all()

    return {
        "skill": {
            "id": skill.id,
            "name": skill.display_name,
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


@router.get("/categories/list")
async def list_skill_categories(
    db: AsyncSession = Depends(get_db),
):
    """
    List all skill categories.
    """
    from ..models.skill import SkillCategory

    query = select(SkillCategory).order_by(SkillCategory.name)
    result = await db.execute(query)
    categories = result.scalars().all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
        }
        for c in categories
    ]
