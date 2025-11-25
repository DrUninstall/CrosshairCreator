"""API routes package."""
from fastapi import APIRouter

from .dashboard import router as dashboard_router
from .skills import router as skills_router
from .certifications import router as certifications_router
from .admin import router as admin_router
from .export import router as export_router

api_router = APIRouter()

api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(skills_router, prefix="/skills", tags=["Skills"])
api_router.include_router(certifications_router, prefix="/certifications", tags=["Certifications"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
api_router.include_router(export_router, prefix="/export", tags=["Export"])
