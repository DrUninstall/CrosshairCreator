"""
Job Market Skills Intelligence Dashboard - FastAPI Application

DISCLAIMER: Data shown for personal/research use only.

This application aggregates job market data to provide insights
on in-demand skills, certifications, and degree requirements.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from .core.config import settings
from .core.database import init_db
from .api import api_router
from .services.cache import cache_service

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Connect to Redis
    await cache_service.connect()
    logger.info("Cache service connected")

    yield

    # Shutdown
    await cache_service.close()
    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Job Market Skills Intelligence Dashboard

Analyze job market trends to discover:
- **Top 50 in-demand skills** across industries
- **Top 30 certifications** employers are looking for
- **Degree requirements** distribution
- **University preferences** when mentioned

### Legal Notice
Data shown for personal/research use only. Job data is aggregated
from public sources and cached to minimize server load.

### Filters
All metrics support filtering by:
- Country/Region
- Job Category (Software Engineering, Data Science, etc.)
- Seniority Level
- Work Type (Remote/Hybrid/Onsite)
- Date Range
    """,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2)) + "ms"
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred",
        }
    )


# Include API router
app.include_router(api_router, prefix=settings.API_PREFIX)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api_prefix": settings.API_PREFIX,
        "disclaimer": "Data shown for personal/research use only",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
