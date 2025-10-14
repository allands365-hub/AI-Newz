from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_service import supabase_service
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user_supabase(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current user from Supabase token"""
    try:
        access_token = credentials.credentials
        logger.info(f"get_current_user_supabase called with token: {access_token[:20]}...")
        
        # Verify token and get user from Supabase
        user = supabase_service.get_user(access_token)
        logger.info(f"Supabase service returned user: {user}")
        
        if not user:
            logger.error("No user returned from Supabase service")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Return the user data from Supabase directly
        # The newsletter API will handle database operations
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_current_user_supabase: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional_supabase(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """Get current user from Supabase token (optional)"""
    if not credentials:
        return None
    
    try:
        access_token = credentials.credentials
        user = supabase_service.get_user(access_token)
        
        if not user:
            return None
        
        # Get user profile
        user_profile = supabase_service.get_user_profile(user["id"])
        return user_profile
        
    except Exception as e:
        logger.error(f"Error in get_current_user_optional_supabase: {str(e)}")
        return None
