from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # App Configuration
    APP_NAME: str = "AI-Newz"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Database
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_JWT_SECRET: Optional[str] = None
    
    # Google OAuth (optional - used by Supabase Auth)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None
    
    # JWT Configuration (legacy - not used with Supabase Auth)
    JWT_SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated string to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # Email Configuration
    RESEND_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@resend.dev"  # Use Resend's verified domain for testing
    FROM_NAME: str = "AI-Newz"
    
    # Legacy SMTP (for fallback)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # AI Configuration
    GROK_API_KEY: Optional[str] = None
    GROK_API_URL: str = "https://api.groq.com/openai/v1"
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 3600  # seconds
    
    class Config:
        env_file = "env.local"
        case_sensitive = True


# Global settings instance
settings = Settings()
