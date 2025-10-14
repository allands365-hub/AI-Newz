"""
Supabase Fallback Service
Used when direct database connection fails due to DNS issues
"""
import httpx
import json
import uuid
from typing import Dict, Any, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseFallbackService:
    """Service to interact with Supabase using REST API when direct DB connection fails"""
    
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_ANON_KEY
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json"
        }
    
    async def create_newsletter(self, newsletter_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a newsletter using Supabase REST API"""
        try:
            # Prepare the data for Supabase
            supabase_data = {
                "id": str(uuid.uuid4()),
                "user_id": newsletter_data.get("user_id"),
                "title": newsletter_data.get("title"),
                "subject": newsletter_data.get("subject"),
                "content": newsletter_data.get("content"),
                "status": newsletter_data.get("status", "draft"),
                "style": newsletter_data.get("style", "professional"),
                "length": newsletter_data.get("length", "medium"),
                "estimated_read_time": newsletter_data.get("estimated_read_time", "5 minutes"),
                "tags": newsletter_data.get("tags", []),
                "ai_model_used": newsletter_data.get("ai_model_used", "llama-3.1-70b-versatile"),
                "tokens_used": newsletter_data.get("tokens_used", 0),
                "open_rate": newsletter_data.get("open_rate", 0),
                "click_rate": newsletter_data.get("click_rate", 0),
                "subscribers_count": newsletter_data.get("subscribers_count", 0),
                "views_count": newsletter_data.get("views_count", 0)
            }
            
            # Make the API call to Supabase
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.supabase_url}/rest/v1/newsletters",
                    headers=self.headers,
                    json=supabase_data
                )
                
                if response.status_code == 201:
                    logger.info(f"Newsletter created successfully via Supabase API: {supabase_data['id']}")
                    return {
                        "id": supabase_data["id"],
                        "title": supabase_data["title"],
                        "subject": supabase_data["subject"],
                        "status": supabase_data["status"],
                        "created_at": response.json().get("created_at"),
                        "message": "Newsletter saved to draft successfully"
                    }
                else:
                    logger.error(f"Failed to create newsletter via Supabase API: {response.status_code} - {response.text}")
                    return {
                        "error": f"Failed to save newsletter: {response.status_code}",
                        "details": response.text
                    }
                    
        except Exception as e:
            logger.error(f"Error creating newsletter via Supabase API: {e}")
            return {
                "error": f"Failed to save newsletter: {str(e)}"
            }
    
    async def get_newsletter(self, newsletter_id: str) -> Optional[Dict[str, Any]]:
        """Get a newsletter by ID using Supabase REST API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.supabase_url}/rest/v1/newsletters?id=eq.{newsletter_id}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data:
                        return data[0]
                return None
                
        except Exception as e:
            logger.error(f"Error getting newsletter via Supabase API: {e}")
            return None
    
    async def update_newsletter(self, newsletter_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a newsletter using Supabase REST API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.supabase_url}/rest/v1/newsletters?id=eq.{newsletter_id}",
                    headers=self.headers,
                    json=update_data
                )
                
                if response.status_code == 200:
                    logger.info(f"Newsletter updated successfully via Supabase API: {newsletter_id}")
                    return {"message": "Newsletter updated successfully"}
                else:
                    logger.error(f"Failed to update newsletter via Supabase API: {response.status_code} - {response.text}")
                    return {"error": f"Failed to update newsletter: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error updating newsletter via Supabase API: {e}")
            return {"error": f"Failed to update newsletter: {str(e)}"}

    async def get_user_newsletters(self, user_id: str) -> Dict[str, Any]:
        """Get all newsletters for a user using Supabase REST API"""
        try:
            url = f"{self.supabase_url}/rest/v1/newsletters?user_id=eq.{user_id}&order=created_at.desc"
            
            logger.info(f"Supabase Fallback: Getting newsletters for user {user_id}")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, timeout=30)
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"Supabase Fallback: Retrieved {len(result)} newsletters for user {user_id}")
                return {"data": result}
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Supabase Fallback: HTTP error getting newsletters: {e.response.status_code} - {e.response.text}")
            return {"error": f"Supabase HTTP error: {e.response.status_code} - {e.response.text}"}
        except httpx.RequestError as e:
            logger.error(f"Supabase Fallback: Request error getting newsletters: {e}")
            return {"error": f"Supabase request error: {e}"}
        except Exception as e:
            logger.error(f"Supabase Fallback: Unexpected error getting newsletters: {e}")
            return {"error": f"Supabase unexpected error: {e}"}

# Global instance
supabase_fallback = SupabaseFallbackService()
