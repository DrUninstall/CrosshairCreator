"""
Export API endpoints.

Export dashboard data to CSV format.
"""
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import csv
import io
from datetime import datetime

from ..core.database import get_db
from ..services.analytics import AnalyticsService

router = APIRouter()


@router.get("/skills")
async def export_skills_csv(
    country: Optional[str] = None,
    category: Optional[str] = None,
    seniority: Optional[str] = None,
    work_type: Optional[str] = None,
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
):
    """
    Export top skills to CSV.
    """
    analytics = AnalyticsService(db)
    data = await analytics.get_dashboard_summary(
        country=country,
        category=category,
        seniority=seniority,
        work_type=work_type,
        days=days,
    )

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["Rank", "Skill", "Mentions", "Type"])

    # Data
    for i, skill in enumerate(data.get("top_skills", []), 1):
        writer.writerow([
            i,
            skill.get("name", ""),
            skill.get("count", 0),
            "Hard Skill" if skill.get("is_hard_skill", True) else "Soft Skill",
        ])

    # Return CSV response
    output.seek(0)
    filename = f"skills_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/certifications")
async def export_certifications_csv(
    country: Optional[str] = None,
    category: Optional[str] = None,
    seniority: Optional[str] = None,
    work_type: Optional[str] = None,
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
):
    """
    Export top certifications to CSV.
    """
    analytics = AnalyticsService(db)
    data = await analytics.get_dashboard_summary(
        country=country,
        category=category,
        seniority=seniority,
        work_type=work_type,
        days=days,
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Rank", "Certification", "Acronym", "Provider", "Category", "Mentions"])

    for i, cert in enumerate(data.get("top_certifications", []), 1):
        writer.writerow([
            i,
            cert.get("name", ""),
            cert.get("acronym", ""),
            cert.get("provider", ""),
            cert.get("category", ""),
            cert.get("count", 0),
        ])

    output.seek(0)
    filename = f"certifications_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/full")
async def export_full_dashboard_csv(
    country: Optional[str] = None,
    category: Optional[str] = None,
    seniority: Optional[str] = None,
    work_type: Optional[str] = None,
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
):
    """
    Export full dashboard data to CSV (multiple sheets in one file).
    """
    analytics = AnalyticsService(db)
    data = await analytics.get_dashboard_summary(
        country=country,
        category=category,
        seniority=seniority,
        work_type=work_type,
        days=days,
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Summary section
    writer.writerow(["=== SUMMARY ==="])
    writer.writerow(["Total Jobs", data.get("total_jobs", 0)])
    writer.writerow(["Filters Applied"])
    for key, value in data.get("filters_applied", {}).items():
        if value:
            writer.writerow([f"  {key}", value])
    writer.writerow([])

    # Top Skills
    writer.writerow(["=== TOP 50 SKILLS ==="])
    writer.writerow(["Rank", "Skill", "Mentions", "Type"])
    for i, skill in enumerate(data.get("top_skills", []), 1):
        writer.writerow([
            i,
            skill.get("name", ""),
            skill.get("count", 0),
            "Hard" if skill.get("is_hard_skill", True) else "Soft",
        ])
    writer.writerow([])

    # Certifications
    writer.writerow(["=== TOP 30 CERTIFICATIONS ==="])
    writer.writerow(["Rank", "Certification", "Provider", "Mentions"])
    for i, cert in enumerate(data.get("top_certifications", []), 1):
        writer.writerow([
            i,
            cert.get("name", ""),
            cert.get("provider", ""),
            cert.get("count", 0),
        ])
    writer.writerow([])

    # Degree Distribution
    writer.writerow(["=== DEGREE DISTRIBUTION ==="])
    writer.writerow(["Degree Level", "Count", "Percentage"])
    for deg in data.get("degree_distribution", []):
        writer.writerow([
            deg.get("degree", ""),
            deg.get("count", 0),
            f"{deg.get('percentage', 0)}%",
        ])
    writer.writerow([])

    # Work Type Distribution
    writer.writerow(["=== WORK TYPE DISTRIBUTION ==="])
    writer.writerow(["Type", "Count", "Percentage"])
    for wt in data.get("work_type_distribution", []):
        writer.writerow([
            wt.get("type", ""),
            wt.get("count", 0),
            f"{wt.get('percentage', 0)}%",
        ])
    writer.writerow([])

    # Top Companies
    writer.writerow(["=== TOP COMPANIES ==="])
    writer.writerow(["Company", "Jobs"])
    for company in data.get("top_companies", []):
        writer.writerow([
            company.get("name", ""),
            company.get("count", 0),
        ])

    # Disclaimer
    writer.writerow([])
    writer.writerow(["=== DISCLAIMER ==="])
    writer.writerow(["Data shown for personal/research use only."])
    writer.writerow([f"Generated at: {data.get('generated_at', '')}"])

    output.seek(0)
    filename = f"dashboard_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
