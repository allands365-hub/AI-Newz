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
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
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
    
    @property
    def effective_grok_api_key(self) -> Optional[str]:
        """Get the effective Grok API key, checking both GROK_API_KEY and GROQ_API_KEY"""
        api_key = self.GROK_API_KEY or self.GROQ_API_KEY
        if api_key:
            print(f"[OK] Grok API Key loaded: {api_key[:10]}...{api_key[-4:] if len(api_key) > 14 else '...'}")
        else:
            print("[ERROR] No Grok API Key found in environment variables")
            print(f"   GROK_API_KEY: {self.GROK_API_KEY}")
            print(f"   GROQ_API_KEY: {self.GROQ_API_KEY}")
        return api_key
    
    @property
    def effective_grok_api_url(self) -> str:
        """Get the effective Grok API URL, checking both GROK_API_URL and GROQ_API_URL"""
        api_url = self.GROK_API_URL or self.GROQ_API_URL
        if api_url:
            print(f"[OK] Grok API URL loaded: {api_url}")
        else:
            print("[ERROR] No Grok API URL found in environment variables")
            print(f"   GROK_API_URL: {self.GROK_API_URL}")
            print(f"   GROQ_API_URL: {self.GROQ_API_URL}")
        return api_url
    
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
    GROQ_API_KEY: Optional[str] = None  # Alternative naming
    GROK_API_URL: str = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_API_URL: Optional[str] = None  # Alternative naming
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 3600  # seconds
    
    class Config:
        # Load environment variables from .env (root). Use OS env in production.
        env_file = ".env"
        # Accept case-insensitive keys to be more forgiving in local setups
        case_sensitive = False
        # Allow extra fields for environment variables
        extra = "ignore"


# Global settings instance
settings = Settings()
