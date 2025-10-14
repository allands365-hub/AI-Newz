from fastapi import APIRouter, Depends, HTTPException, status
from app.core.supabase_auth import get_current_user_supabase, get_current_user_optional_supabase
from app.services.supabase_service import supabase_service
from app.schemas.supabase_auth import (
    SupabaseUserResponse,
    SupabaseAuthResponse,
    UserPreferencesResponse,
    UserPreferencesUpdate,
    UserUpdate
)
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Supabase Authentication"])


@router.get("/me", response_model=SupabaseUserResponse)
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
):
    """Get current user information"""
    # Add missing fields with defaults
    user_data = {
        "subscription_tier": "free",
        "is_active": True,
        "updated_at": None,
        **current_user
    }
    return SupabaseUserResponse(**user_data)


@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
):
    """Get user preferences"""
    preferences = supabase_service.get_user_preferences(current_user["id"])
    
    if not preferences:
        # Create default preferences if they don't exist
        preferences = supabase_service.create_user_preferences(
            current_user["id"],
            {
                "preferred_sources": [],
                "content_categories": [],
                "newsletter_frequency": "weekly",
                "ai_style": "professional"
            }
        )
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get or create user preferences"
        )
    
    return UserPreferencesResponse(**preferences)


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
):
    """Update user preferences"""
    # Filter out None values
    update_data = {k: v for k, v in preferences_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    preferences = supabase_service.update_user_preferences(
        current_user["id"],
        update_data
    )
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user preferences"
        )
    
    return UserPreferencesResponse(**preferences)


@router.put("/profile", response_model=SupabaseUserResponse)
async def update_user_profile(
    profile_update: UserUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
):
    """Update user profile"""
    # Filter out None values
    update_data = {k: v for k, v in profile_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    user_profile = supabase_service.update_user_profile(
        current_user["id"],
        update_data
    )
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )
    
    return SupabaseUserResponse(**user_profile)


@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Logout successful"}


@router.get("/health")
async def auth_health():
    """Auth service health check"""
    return {
        "status": "healthy",
        "service": "supabase_auth",
        "message": "Supabase authentication service is running"
    }
