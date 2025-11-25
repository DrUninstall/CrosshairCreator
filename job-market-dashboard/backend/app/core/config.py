"""
Application configuration settings.
All sensitive values loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Application
    APP_NAME: str = "Job Market Skills Intelligence"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/jobmarket"
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgres@localhost:5432/jobmarket"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 3600  # 1 hour default cache

    # Scraping API Keys (optional - use what you have)
    SERPAPI_KEY: Optional[str] = None
    SCRAPERAPI_KEY: Optional[str] = None
    BRIGHTDATA_USERNAME: Optional[str] = None
    BRIGHTDATA_PASSWORD: Optional[str] = None
    OXYLABS_USERNAME: Optional[str] = None
    OXYLABS_PASSWORD: Optional[str] = None

    # Proxy Configuration
    PROXY_ENABLED: bool = False
    PROXY_HOST: Optional[str] = None
    PROXY_PORT: Optional[int] = None
    PROXY_USERNAME: Optional[str] = None
    PROXY_PASSWORD: Optional[str] = None

    # Rate Limiting (requests per minute per domain)
    # LEGAL NOTE: Aggressive rate limiting to respect server resources
    RATE_LIMIT_LINKEDIN: int = 10
    RATE_LIMIT_INDEED: int = 15
    RATE_LIMIT_GLASSDOOR: int = 10
    RATE_LIMIT_DEFAULT: int = 20

    # Scraping Settings
    SCRAPE_DELAY_MIN: float = 2.0  # Minimum seconds between requests
    SCRAPE_DELAY_MAX: float = 5.0  # Maximum seconds between requests
    MAX_PAGES_PER_SEARCH: int = 10
    JOBS_PER_PAGE: int = 25

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Admin
    ADMIN_SECRET_KEY: str = "change-this-in-production"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
