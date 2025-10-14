from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime


class SupabaseUserResponse(BaseModel):
    """User response from Supabase"""
    id: str
    email: str
    name: str
    profile_picture: Optional[str] = None
    google_id: Optional[str] = None
    auth_provider: str = "google"
    subscription_tier: Optional[str] = "free"
    is_active: Optional[bool] = True
    is_verified: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class SupabaseAuthResponse(BaseModel):
    """Authentication response"""
    user: SupabaseUserResponse
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: int
    token_type: str = "bearer"
    is_new_user: bool = False
    message: str = "Authentication successful"


class UserPreferencesResponse(BaseModel):
    """User preferences response"""
    id: str
    user_id: str
    preferred_sources: list[str] = []
    content_categories: list[str] = []
    newsletter_frequency: str = "weekly"
    ai_style: str = "professional"
    created_at: datetime
    updated_at: datetime


class UserPreferencesUpdate(BaseModel):
    """User preferences update request"""
    preferred_sources: Optional[list[str]] = None
    content_categories: Optional[list[str]] = None
    newsletter_frequency: Optional[str] = None
    ai_style: Optional[str] = None


class UserUpdate(BaseModel):
    """User update request"""
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    subscription_tier: Optional[str] = None
