"""
Supabase RSS Service - Uses Supabase REST API instead of direct database connection
This is a workaround for corporate networks that block direct database connections
"""

import httpx
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class SupabaseRSSService:
    """RSS service using Supabase REST API instead of direct database connection"""
    
    def __init__(self, access_token: str = None):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_ANON_KEY
        self.access_token = access_token
        
        # Use JWT token if provided, otherwise use anon key
        auth_token = access_token if access_token else self.supabase_key
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    async def get_rss_sources(self) -> List[Dict[str, Any]]:
        """Get all RSS sources using Supabase REST API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.supabase_url}/rest/v1/rss_sources",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching RSS sources via REST API: {e}")
            return []
    
    async def get_rss_sources_for_user(self, user_id: str, access_token: str = None) -> List[Dict[str, Any]]:
        """Get RSS sources for a specific user using Supabase REST API with JWT token"""
        try:
            # Use JWT token if provided, otherwise fall back to anon key
            headers = self.headers.copy()
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.supabase_url}/rest/v1/rss_sources",
                    headers=headers,
                    params={
                        "select": "*"
                        # RLS will automatically filter by user_id
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching RSS sources for user {user_id} via REST API: {e}")
            return []
    
    async def get_rss_stats(self) -> Dict[str, Any]:
        """Get RSS statistics using Supabase REST API"""
        try:
            # Get total sources
            sources_response = await self.get_rss_sources()
            total_sources = len(sources_response)
            active_sources = len([s for s in sources_response if s.get('is_active', True)])
            
            # Get articles count
            async with httpx.AsyncClient() as client:
                articles_response = await client.get(
                    f"{self.supabase_url}/rest/v1/articles",
                    headers=self.headers,
                    params={"select": "id,created_at"}
                )
                articles_response.raise_for_status()
                articles = articles_response.json()
            
            total_articles = len(articles)
            
            # Calculate articles today and this week
            from datetime import datetime, timedelta
            now = datetime.now()
            today = now.date()
            week_ago = (now - timedelta(days=7)).date()
            
            articles_today = len([a for a in articles if 
                                datetime.fromisoformat(a['created_at'].replace('Z', '+00:00')).date() == today])
            articles_this_week = len([a for a in articles if 
                                    datetime.fromisoformat(a['created_at'].replace('Z', '+00:00')).date() >= week_ago])
            
            return {
                "total_sources": total_sources,
                "active_sources": active_sources,
                "total_articles": total_articles,
                "articles_today": articles_today,
                "articles_this_week": articles_this_week,
                "top_categories": [],
                "recent_sources": sources_response[:5],
                "quality_distribution": {}
            }
        except Exception as e:
            logger.error(f"Error fetching RSS stats via REST API: {e}")
            return {
                "total_sources": 0,
                "active_sources": 0,
                "total_articles": 0,
                "articles_today": 0,
                "articles_this_week": 0,
                "top_categories": [],
                "recent_sources": [],
                "quality_distribution": {}
            }
    
    async def save_article(self, article_data: Dict[str, Any]) -> bool:
        """Save article to database via Supabase REST API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.supabase_url}/rest/v1/articles",
                    headers=self.headers,
                    json=article_data
                )
                response.raise_for_status()
                logger.info(f"Successfully saved article: {article_data.get('title', 'Unknown')}")
                return True
        except httpx.HTTPStatusError as e:
            if e.response is not None and e.response.status_code == 409:
                # Unique constraint violation - article already exists
                logger.info(
                    f"Duplicate article (409). Skipping insert for URL={article_data.get('url', 'unknown')}"
                )
                return True
            logger.error(f"HTTP error saving article via REST API: {e}")
            return False
        except Exception as e:
            logger.error(f"Error saving article via REST API: {e}")
            return False
    
    async def create_rss_source(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new RSS source using Supabase REST API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.supabase_url}/rest/v1/rss_sources",
                    headers=self.headers,
                    json=source_data
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error creating RSS source via REST API: {e}")
            raise e
    
    async def update_rss_source(self, source_id: int, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an RSS source using Supabase REST API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.supabase_url}/rest/v1/rss_sources?id=eq.{source_id}",
                    headers=self.headers,
                    json=source_data
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error updating RSS source via REST API: {e}")
            raise e
    
    async def delete_rss_source(self, source_id: int) -> bool:
        """Delete an RSS source using Supabase REST API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.supabase_url}/rest/v1/rss_sources?id=eq.{source_id}",
                    headers=self.headers
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error deleting RSS source via REST API: {e}")
            return False

    async def get_articles_for_user(
        self, 
        user_id: str, 
        limit: int = 20, 
        offset: int = 0,
        category: Optional[str] = None,
        min_quality: Optional[float] = None,
        exclude_duplicates: bool = True,
        exclude_used: bool = False,
        prefer_images: bool = False
    ) -> List[Dict[str, Any]]:
        """Get articles for a specific user using Supabase REST API with RLS"""
        try:
            # Build query parameters
            params = {
                "select": "*",
                "limit": str(limit),
                "offset": str(offset)
            }
            
            # Add filters
            filters = [f"user_id.eq.{user_id}"]
            
            if category:
                filters.append(f"category.eq.{category}")
            
            if min_quality is not None:
                filters.append(f"quality_score.gte.{min_quality}")
            
            if exclude_duplicates:
                filters.append("is_duplicate.eq.false")
            
            if exclude_used:
                filters.append("is_used_in_newsletter.eq.false")

            if prefer_images:
                # Prefer only articles flagged with images
                filters.append("has_images.eq.true")
            
            # Add filters to params
            if filters:
                params["user_id"] = f"eq.{user_id}"
                # Decompose supported filters explicitly for Supabase REST
                for f in filters:
                    if f.startswith("category."):
                        params["category"] = f.split(".", 1)[1]
                    elif f.startswith("quality_score."):
                        params["quality_score"] = f.split(".", 1)[1]
                    elif f.startswith("is_duplicate."):
                        params["is_duplicate"] = f.split(".", 1)[1]
                    elif f.startswith("is_used_in_newsletter."):
                        params["is_used_in_newsletter"] = f.split(".", 1)[1]
                    elif f.startswith("has_images."):
                        params["has_images"] = f.split(".", 1)[1]

            # Order: images first (via has_images), then quality, then recency
            # Supabase REST order format: order=column.desc,second.desc
            params["order"] = "has_images.desc,quality_score.desc,published_at.desc"
            
            # Make request to Supabase REST API
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.supabase_url}/rest/v1/articles",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                articles = response.json()
                
                logger.info(f"Retrieved {len(articles)} articles for user {user_id}")
                return articles
                
        except Exception as e:
            logger.error(f"Error getting articles for user via REST API: {e}")
            # Remove noisy fallback path; return empty on error
            return []

    # Removed noisy fallback SQL method
