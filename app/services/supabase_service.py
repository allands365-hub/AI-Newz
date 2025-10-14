from supabase import create_client, Client
from app.core.config import settings
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Global Supabase client instance
_supabase_client = None

def get_supabase_client() -> Client:
    """Get the global Supabase client instance"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
    return _supabase_client

class SupabaseService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
    
    def get_user(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user from Supabase using access token via Supabase client with timeout handling"""
        import asyncio
        import signal
        from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
        
        def _verify_token_with_timeout():
            """Internal function to verify token with timeout"""
            try:
                logger.info(f"Getting user with token: {access_token[:20]}...")
                
                # Skip the problematic Supabase client method and go directly to fallback
                # The Supabase Python client has known issues with JWT token verification
                logger.info("Skipping Supabase client method due to known JWT issues, using fallback directly")
                return None
                
                # Original code (commented out due to JWT issues):
                # self.supabase.auth.set_session(access_token, "")
                # user_response = self.supabase.auth.get_user()
                # if user_response and user_response.user:
                #     user = user_response.user
                #     logger.info(f"Successfully verified user: {user.email}")
                #     # ... rest of the code
                
            except Exception as auth_error:
                logger.error(f"Supabase auth error: {auth_error}")
                return None
        
        try:
            # Use ThreadPoolExecutor with timeout to prevent hanging
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_verify_token_with_timeout)
                try:
                    # Set timeout to 10 seconds
                    result = future.result(timeout=10)
                    if result:
                        return result
                    else:
                        # If main verification failed, try fallback method
                        logger.info("Main JWT verification failed, trying fallback method...")
                        return self._fallback_jwt_verification(access_token)
                except FutureTimeoutError:
                    logger.error("JWT verification timed out after 10 seconds, trying fallback method...")
                    future.cancel()  # Cancel the hanging operation
                    return self._fallback_jwt_verification(access_token)
                except Exception as e:
                    logger.error(f"Error in JWT verification thread: {str(e)}, trying fallback method...")
                    return self._fallback_jwt_verification(access_token)
                    
        except Exception as e:
            logger.error(f"Error getting user from Supabase: {str(e)}, trying fallback method...")
            return self._fallback_jwt_verification(access_token)
    
    def _fallback_jwt_verification(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Fallback JWT verification using direct HTTP request to Supabase Auth API"""
        try:
            import httpx
            from app.core.config import settings
            
            logger.info("Attempting fallback JWT verification via HTTP API...")
            
            # Make a direct HTTP request to Supabase Auth API
            with httpx.Client(timeout=5.0) as client:
                response = client.get(
                    f"{settings.SUPABASE_URL}/auth/v1/user",
                    headers={
                        "apikey": settings.SUPABASE_ANON_KEY,
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    logger.info(f"Fallback verification successful: {user_data.get('email')}")
                    
                    # Extract user information
                    user_id = user_data.get("id")
                    email = user_data.get("email")
                    user_metadata = user_data.get("user_metadata", {})
                    app_metadata = user_data.get("app_metadata", {})
                    
                    result = {
                        "id": user_id,
                        "email": email,
                        "name": user_metadata.get("full_name", user_metadata.get("name", "")),
                        "profile_picture": user_metadata.get("avatar_url", user_metadata.get("picture", "")),
                        "google_id": user_metadata.get("provider_id", ""),
                        "auth_provider": "google" if app_metadata.get("provider") == "google" else "email",
                        "is_verified": user_data.get("email_confirmed_at") is not None,
                        "created_at": user_data.get("created_at"),
                        "last_login": user_data.get("last_sign_in_at")
                    }
                    logger.info(f"Fallback returning user data: {result}")
                    return result
                else:
                    logger.error(f"Fallback verification failed: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Fallback JWT verification error: {str(e)}")
            return None
    
    def verify_token(self, access_token: str) -> bool:
        """Verify if the access token is valid"""
        try:
            self.supabase.auth.set_session(access_token, "")
            user_response = self.supabase.auth.get_user()
            return user_response and user_response.user is not None
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return False
    
    def create_user_profile(self, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create user profile in our custom users table"""
        try:
            # Insert into our custom users table
            result = self.supabase.table("users").insert({
                "id": user_data["id"],
                "email": user_data["email"],
                "name": user_data["name"],
                "profile_picture": user_data.get("profile_picture"),
                "google_id": user_data.get("google_id"),
                "auth_provider": user_data.get("auth_provider", "google"),
                "is_verified": user_data.get("is_verified", True),
                "last_login": user_data.get("last_login")
            }).execute()
            
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error creating user profile: {str(e)}")
            return None
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile from our custom users table"""
        try:
            result = self.supabase.table("users").select("*").eq("id", user_id).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            return None
    
    def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user profile in our custom users table"""
        try:
            result = self.supabase.table("users").update(updates).eq("id", user_id).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            return None
    
    def create_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create user preferences"""
        try:
            result = self.supabase.table("user_preferences").insert({
                "user_id": user_id,
                **preferences
            }).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error creating user preferences: {str(e)}")
            return None
    
    def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences"""
        try:
            result = self.supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting user preferences: {str(e)}")
            return None
    
    def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user preferences"""
        try:
            result = self.supabase.table("user_preferences").update(preferences).eq("user_id", user_id).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating user preferences: {str(e)}")
            return None


# Global instance
supabase_service = SupabaseService()
