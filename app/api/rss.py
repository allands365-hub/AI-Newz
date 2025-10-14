from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import os
import httpx
from datetime import datetime
from dateutil import parser as date_parser

from app.core.database import get_db
from app.core.supabase_auth import get_current_user_supabase
from app.core.config import settings
from app.models.rss_source import RSSSource
from app.models.article import Article
from app.schemas.rss import (
    RSSSourceCreate, RSSSourceUpdate, RSSSourceResponse,
    ArticleResponse, RSSFetchRequest, RSSFetchResponse,
    ArticleSearchRequest, ArticleSearchResponse, RSSStatsResponse
)
from app.services.rss_service import RSSService
from app.services.supabase_rss_service import SupabaseRSSService
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rss", tags=["RSS"])

# Cache 404 favicon lookups per host to avoid repeated external requests
_FAILED_FAVICON_HOSTS: dict[str, float] = {}
_FAILED_TTL_SECONDS = 6 * 60 * 60  # 6 hours
@router.get("/favicon")
async def get_site_favicon(
    host: str = Query(..., description="Hostname or URL to derive host from"),
):
    """Proxy favicon fetching with multiple fallbacks to improve reliability.

    Usage: /api/v1/rss/favicon?host=techcrunch.com or full URL.
    """
    try:
        # Normalize to hostname
        try:
            import re
            from urllib.parse import urlparse
            parsed = urlparse(host if host.startswith("http") else f"https://{host}")
            hostname = parsed.hostname or host
            hostname = hostname.replace("www.", "")
        except Exception:
            hostname = host

        # 404 cache short-circuit
        import time
        now = time.time()
        cached_failed_at = _FAILED_FAVICON_HOSTS.get(hostname)
        if cached_failed_at and (now - cached_failed_at) < _FAILED_TTL_SECONDS:
            raise HTTPException(status_code=404, detail="Favicon not found (cached)")

        # Common direct locations (https and http)
        candidates = [
            f"https://www.google.com/s2/favicons?domain={hostname}&sz=128",
            f"https://icons.duckduckgo.com/ip3/{hostname}.ico",
            f"https://{hostname}/favicon.ico",
            f"https://{hostname}/favicon.svg",
            f"https://{hostname}/apple-touch-icon.png",
            f"https://{hostname}/apple-touch-icon-precomposed.png",
            f"https://{hostname}/apple-touch-icon-180x180.png",
            f"https://{hostname}/android-chrome-192x192.png",
            f"https://{hostname}/android-chrome-512x512.png",
            f"http://{hostname}/favicon.ico",
            f"http://{hostname}/favicon.svg",
            f"http://{hostname}/apple-touch-icon.png",
        ]

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            for url in candidates:
                try:
                    r = await client.get(url)
                    if r.status_code == 200 and r.content:
                        content_type = r.headers.get("content-type", "image/x-icon")
                        return Response(content=r.content, media_type=content_type)
                except Exception:
                    continue

        # As a last resort, download homepage and discover <link rel="icon"> tags
        try:
            from bs4 import BeautifulSoup
            homepage = f"https://{hostname}"
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client2:
                r = await client2.get(homepage)
                if r.status_code == 200 and r.text:
                    soup = BeautifulSoup(r.text, "html.parser")
                    icon_hrefs = []
                    for rel in ["icon", "shortcut icon", "apple-touch-icon", "mask-icon"]:
                        for link in soup.find_all("link", rel=lambda v: v and rel in v):
                            href = link.get("href")
                            if not href:
                                continue
                            # Make absolute
                            from urllib.parse import urljoin
                            icon_hrefs.append(urljoin(homepage, href))
                    # Try discovered icons
                    for url in icon_hrefs:
                        try:
                            rr = await client2.get(url)
                            if rr.status_code == 200 and rr.content:
                                content_type = rr.headers.get("content-type", "image/x-icon")
                                return Response(content=rr.content, media_type=content_type)
                        except Exception:
                            continue
        except Exception:
            pass

        # Record failed attempt in cache
        _FAILED_FAVICON_HOSTS[hostname] = time.time()
        raise HTTPException(status_code=404, detail="Favicon not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching favicon: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch favicon")


@router.get("/debug/env")
async def debug_env():
    """Debug endpoint to check environment variables"""
    return {
        "database_url": settings.DATABASE_URL[:50] + "..." if settings.DATABASE_URL else "Not set",
        "supabase_url": settings.SUPABASE_URL,
        "supabase_anon_key": settings.SUPABASE_ANON_KEY[:20] + "..." if settings.SUPABASE_ANON_KEY else "Not set",
        "debug": settings.DEBUG,
        "environment": settings.ENVIRONMENT,
        "os_env_database_url": os.getenv("DATABASE_URL", "Not set")[:50] + "..." if os.getenv("DATABASE_URL") else "Not set",
        "os_env_supabase_url": os.getenv("SUPABASE_URL", "Not set"),
        "os_env_supabase_anon_key": os.getenv("SUPABASE_ANON_KEY", "Not set")[:20] + "..." if os.getenv("SUPABASE_ANON_KEY") else "Not set",
    }


@router.get("/articles/enhanced")
async def get_enhanced_articles(
    skip: int = Query(0, ge=0, description="Number of articles to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of articles to return"),
    source_id: Optional[int] = Query(None, description="Filter by RSS source ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    has_images: Optional[bool] = Query(None, description="Filter articles with/without images"),
    quality_min: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum quality score"),
    platform: Optional[str] = Query(None, description="Filter by platform (reddit, hackernews, etc.)"),
    current_user: dict = Depends(get_current_user_supabase)
):
    """Get enhanced articles with visual snippets and metadata using Supabase REST API"""
    try:
        user_id = current_user["id"]
        
        # Use Supabase REST API for enhanced articles
        supabase_service = SupabaseService()
        
        # Use Supabase client directly
        result = supabase_service.supabase.table("articles").select(
            "id,title,url,content,summary,author,published_at,fetched_at,rss_source_id,category,tags,sentiment_score,readability_score,word_count,reading_time,image_url,thumbnail_url,image_alt_text,has_images,has_videos,has_lists,has_quotes,content_type,engagement_score,social_shares,quality_score,is_active"
        ).eq("user_id", user_id).eq("is_active", True).order(
            "published_at", desc=True
        ).range(skip, skip + limit - 1)
        
        # Apply additional filters
        if source_id:
            result = result.eq("rss_source_id", source_id)
        if category:
            result = result.eq("category", category)
        if has_images is not None:
            result = result.eq("has_images", has_images)
        if quality_min is not None:
            result = result.gte("quality_score", quality_min)
        
        response = result.execute()
        
        if response.data:
            # Transform the data to include source information
            enhanced_articles = []
            for article in response.data:
                # Get source information separately
                source_result = supabase_service.supabase.table("rss_sources").select(
                    "name,logo_url,platform,brand_color,verification_status"
                ).eq("id", article["rss_source_id"]).execute()
                
                source_info = source_result.data[0] if source_result.data else {}
                
                enhanced_article = {
                    "id": article["id"],
                    "title": article["title"],
                    "url": article["url"],
                    "summary": article["summary"],
                    "author": article["author"],
                    "published_at": article["published_at"],
                    "fetched_at": article["fetched_at"],
                    "rss_source_id": article["rss_source_id"],
                    "rss_source_name": source_info.get("name"),
                    "rss_source_logo": source_info.get("logo_url"),
                    "rss_source_platform": source_info.get("platform"),
                    "rss_source_brand_color": source_info.get("brand_color"),
                    "rss_source_verification": source_info.get("verification_status"),
                    "category": article["category"],
                    "tags": article["tags"] or [],
                    "sentiment_score": article["sentiment_score"],
                    "readability_score": article["readability_score"],
                    "word_count": article["word_count"],
                    "reading_time": article["reading_time"],
                    "image_url": article["image_url"],
                    "thumbnail_url": article["thumbnail_url"],
                    "image_alt_text": article["image_alt_text"],
                    "has_images": article["has_images"],
                    "has_videos": article["has_videos"],
                    "has_lists": article["has_lists"],
                    "has_quotes": article["has_quotes"],
                    "content_type": article["content_type"],
                    "engagement_score": article["engagement_score"],
                    "social_shares": article["social_shares"],
                    "quality_score": article["quality_score"]
                }
                enhanced_articles.append(enhanced_article)
            
            # Get total count for pagination
            count_result = supabase_service.supabase.table("articles").select(
                "id", count="exact"
            ).eq("user_id", user_id).eq("is_active", True)
            
            if source_id:
                count_result = count_result.eq("rss_source_id", source_id)
            if category:
                count_result = count_result.eq("category", category)
            if has_images is not None:
                count_result = count_result.eq("has_images", has_images)
            if quality_min is not None:
                count_result = count_result.gte("quality_score", quality_min)
            
            count_response = count_result.execute()
            total_count = count_response.count if count_response.count else 0
            
            return {
                "articles": enhanced_articles,
                "total": total_count,
                "has_more": len(enhanced_articles) == limit,
                "pagination": {
                    "skip": skip,
                    "limit": limit,
                    "total": total_count
                }
            }
        else:
            return {
                "articles": [],
                "total": 0,
                "has_more": False,
                "pagination": {
                    "skip": skip,
                    "limit": limit,
                    "total": 0
                }
            }
        
    except Exception as e:
        logger.error(f"Error getting enhanced articles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get enhanced articles: {str(e)}")


@router.get("/sources-enhanced")
async def get_enhanced_sources(
    current_user: dict = Depends(get_current_user_supabase)
):
    """Get enhanced RSS sources with branding information using Supabase REST API"""
    try:
        user_id = current_user["id"]
        
        # Use Supabase REST API for enhanced sources
        supabase_service = SupabaseRSSService()
        
        # Use httpx directly instead of supabase client
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{supabase_service.supabase_url}/rest/v1/rss_sources",
                headers=supabase_service.headers,
                params={
                    "select": "id,name,url",
                    "user_id": f"eq.{user_id}"
                }
            )
            response.raise_for_status()
            data = response.json()
        
        if data:
            enhanced_sources = []
            for source in data:
                enhanced_source = {
                    "id": source["id"],
                    "name": source["name"],
                    "url": source["url"]
                }
                enhanced_sources.append(enhanced_source)
            
            return {"sources": enhanced_sources}
        else:
            return {"sources": []}
        
    except Exception as e:
        logger.error(f"Error getting enhanced sources: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get enhanced sources: {str(e)}")


@router.post("/sources", response_model=RSSSourceResponse)
async def create_rss_source(
    source_data: RSSSourceCreate,
    current_user: dict = Depends(get_current_user_supabase)
):
    """Create a new RSS source using Supabase REST API"""
    try:
        # Use Supabase REST API instead of direct database connection
        supabase_service = SupabaseRSSService()
        
        # Prepare source data for REST API
        source_dict = {
            "name": source_data.name,
            "url": str(source_data.url),
            "description": source_data.description,
            "category": source_data.category.value if source_data.category else None,
            "language": source_data.language,
            "credibility_score": source_data.credibility_score,
            "fetch_frequency": source_data.fetch_frequency,
            "is_active": True,
            "user_id": current_user['id']
        }
        
        # Create source via REST API
        source = await supabase_service.create_rss_source(source_dict)
        
        logger.info(f"Created RSS source: {source['name']} ({source['url']})")
        return source
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating RSS source: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create RSS source: {str(e)}")


@router.get("/sources", response_model=List[RSSSourceResponse])
async def get_rss_sources(
    request: Request,
    current_user: dict = Depends(get_current_user_supabase),
    active_only: bool = Query(True, description="Only return active sources")
):
    """Get all RSS sources using Supabase REST API with JWT authentication"""
    try:
        # Use the authenticated user's ID
        user_id = current_user["id"]
        
        # Use Supabase REST API with user's JWT token for RLS
        import httpx
        from app.core.config import settings
        
        # Get the user's JWT token from the request
        auth_header = request.headers.get("Authorization")
        access_token = None
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header.split(" ")[1]
        
        # Create service with JWT token for RLS
        supabase_service = SupabaseRSSService(access_token=access_token)
        
        # Get sources for this user only (RLS will filter automatically)
        sources = await supabase_service.get_rss_sources_for_user(user_id, access_token)
        
        # Filter active sources if requested
        if active_only:
            sources = [s for s in sources if s.get('is_active', True)]
        
        # Sort by name
        sources.sort(key=lambda x: x.get('name', ''))
        return sources
        
    except Exception as e:
        logger.error(f"Error getting RSS sources: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get RSS sources: {str(e)}")


@router.get("/sources/{source_id}", response_model=RSSSourceResponse)
async def get_rss_source(
    source_id: int,
    current_user: dict = Depends(get_current_user_supabase)
):
    """Get a specific RSS source using Supabase REST API"""
    try:
        # Use Supabase REST API instead of direct database connection
        supabase_service = SupabaseRSSService()
        sources = await supabase_service.get_rss_sources()
        
        # Find the specific source
        source = next((s for s in sources if s['id'] == source_id), None)
        if not source:
            raise HTTPException(status_code=404, detail="RSS source not found")
        
        return source
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting RSS source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get RSS source: {str(e)}")


@router.put("/sources/{source_id}", response_model=RSSSourceResponse)
async def update_rss_source(
    source_id: int,
    source_data: RSSSourceUpdate,
    current_user: dict = Depends(get_current_user_supabase)
):
    """Update an RSS source using Supabase REST API"""
    try:
        # Use Supabase REST API instead of direct database connection
        supabase_service = SupabaseRSSService()
        
        # Prepare update data
        update_dict = {}
        if source_data.name is not None:
            update_dict['name'] = source_data.name
        if source_data.description is not None:
            update_dict['description'] = source_data.description
        if source_data.category is not None:
            update_dict['category'] = source_data.category.value
        if source_data.language is not None:
            update_dict['language'] = source_data.language
        if source_data.is_active is not None:
            update_dict['is_active'] = source_data.is_active
        if source_data.credibility_score is not None:
            update_dict['credibility_score'] = source_data.credibility_score
        if source_data.fetch_frequency is not None:
            update_dict['fetch_frequency'] = source_data.fetch_frequency
        
        # Update source via REST API
        updated_source = await supabase_service.update_rss_source(source_id, update_dict)
        
        logger.info(f"Updated RSS source: {updated_source['name']}")
        return updated_source
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating RSS source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update RSS source: {str(e)}")


@router.delete("/sources/{source_id}")
async def delete_rss_source(
    source_id: int,
    current_user: dict = Depends(get_current_user_supabase)
):
    """Delete an RSS source using Supabase REST API"""
    try:
        # Use Supabase REST API instead of direct database connection
        supabase_service = SupabaseRSSService()
        
        # Soft delete - mark as inactive
        success = await supabase_service.update_rss_source(source_id, {"is_active": False})
        
        if success:
            logger.info(f"Deleted RSS source: {source_id}")
            return {"message": "RSS source deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="RSS source not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting RSS source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete RSS source: {str(e)}")


@router.post("/fetch", response_model=RSSFetchResponse)
async def fetch_rss_feeds(
    fetch_request: RSSFetchRequest,
    current_user: dict = Depends(get_current_user_supabase)
):
    """Fetch articles from RSS feeds using Supabase REST API"""
    try:
        # Use Supabase REST API instead of direct database connection
        supabase_service = SupabaseRSSService()
        
        # Get RSS sources
        sources = await supabase_service.get_rss_sources()
        
        # Filter by source_ids if provided
        if fetch_request.source_ids:
            sources = [s for s in sources if s['id'] in fetch_request.source_ids]
        
        # Filter active sources only
        sources = [s for s in sources if s.get('is_active', True)]
        
        if not sources:
            return RSSFetchResponse(
                success=False,
                message="No active RSS sources found",
                sources_processed=0,
                articles_fetched=0,
                articles_processed=0,
                duplicates_found=0,
                errors=["No active RSS sources available"]
            )
        
        # Initialize RSS service for parsing
        rss_service = RSSService()
        
        sources_processed = 0
        articles_fetched = 0
        articles_processed = 0
        duplicates_found = 0
        errors = []
        
        # Process each source
        for source in sources:
            try:
                logger.info(f"Fetching RSS feed: {source['name']} ({source['url']})")
                
                # Fetch RSS feed
                feed_data = await rss_service.fetch_rss_feed(source['url'])
                
                if feed_data and feed_data.get('status') == 'success':
                    entries = feed_data.get('entries', [])
                    articles_fetched += len(entries)
                    
                    # Process articles (simplified for now)
                    for entry in entries[:10]:  # Limit to 10 articles per source
                        try:
                            # Process article content for enhanced data
                            processed_content = await rss_service.process_article_content(entry)
                            
                            # Parse published date
                            published_at = None
                            if entry.get('published'):
                                try:
                                    published_at = date_parser.parse(entry['published']).isoformat()
                                except:
                                    published_at = datetime.utcnow().isoformat()
                            
                            # Create comprehensive article data
                            article_data = {
                                'title': entry.get('title', '')[:500],  # Limit to 500 chars
                                'url': entry.get('link', ''),
                                'content': processed_content.get('content', ''),
                                'summary': entry.get('summary', ''),
                                'author': entry.get('author', ''),
                                'published_at': published_at,
                                'rss_source_id': source['id'],
                                'user_id': current_user['id'],
                                
                                # Enhanced visual content
                                'image_url': processed_content.get('image_url'),
                                'thumbnail_url': processed_content.get('thumbnail_url'),
                                'image_alt_text': processed_content.get('image_alt_text'),
                                
                                # Content analysis
                                'category': processed_content.get('category', source.get('category', 'general')),
                                'tags': processed_content.get('tags', []),
                                'sentiment_score': processed_content.get('sentiment_score'),
                                'readability_score': processed_content.get('readability_score'),
                                'word_count': processed_content.get('word_count', 0),
                                'reading_time': processed_content.get('reading_time'),
                                
                                # Content metadata
                                'has_images': processed_content.get('has_images', False),
                                'has_videos': processed_content.get('has_videos', False),
                                'has_lists': processed_content.get('has_lists', False),
                                'has_quotes': processed_content.get('has_quotes', False),
                                'content_type': processed_content.get('content_type', 'article'),
                                
                                # Quality and engagement
                                'quality_score': processed_content.get('quality_score', 0.8),
                                'engagement_score': 0.0,
                                'social_shares': 0,
                                
                                # Status
                                'is_active': True,
                                'is_used_in_newsletter': False,
                                'is_duplicate': False
                            }
                            
                            # Save article to database via Supabase REST API
                            try:
                                await supabase_service.save_article(article_data)
                                articles_processed += 1
                            except Exception as save_error:
                                logger.error(f"Error saving article: {save_error}")
                                errors.append(f"Error saving article: {str(save_error)}")
                            
                        except Exception as e:
                            logger.error(f"Error processing article from {source['name']}: {e}")
                            errors.append(f"Error processing article from {source['name']}: {str(e)}")
                    
                    sources_processed += 1
                    logger.info(f"Successfully processed {source['name']}: {len(entries)} articles")
                    
                else:
                    error_msg = f"Failed to fetch {source['name']}: {feed_data.get('error', 'Unknown error')}"
                    logger.error(error_msg)
                    errors.append(error_msg)
                    
            except Exception as e:
                error_msg = f"Error processing {source['name']}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        await rss_service.close()
        
        success = sources_processed > 0
        message = f"Processed {sources_processed} sources, fetched {articles_fetched} articles"
        
        return RSSFetchResponse(
            success=success,
            message=message,
            sources_processed=sources_processed,
            articles_fetched=articles_fetched,
            articles_processed=articles_processed,
            duplicates_found=duplicates_found,
            errors=errors
        )
        
    except Exception as e:
        logger.error(f"Error fetching RSS feeds: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch RSS feeds: {str(e)}")


@router.post("/articles/search", response_model=ArticleSearchResponse)
async def search_articles(
    search_request: ArticleSearchRequest,
    current_user: dict = Depends(get_current_user_supabase)
):
    """Search articles with filters and pagination using Supabase REST API"""
    try:
        # Use Supabase REST API instead of direct database connection
        supabase_service = SupabaseRSSService()
        
        # For now, return a simplified response
        # In a full implementation, you would query articles via REST API
        return ArticleSearchResponse(
            articles=[],
            total_count=0,
            has_more=False,
            filters_applied={}
        )
        
    except Exception as e:
        logger.error(f"Error searching articles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search articles: {str(e)}")


@router.get("/articles", response_model=List[ArticleResponse])
async def get_articles(
    request: Request,
    current_user: dict = Depends(get_current_user_supabase),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_quality: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum quality score"),
    exclude_duplicates: bool = Query(True, description="Exclude duplicate articles"),
    exclude_used: bool = Query(False, description="Exclude articles already used in newsletters")
):
    """Get articles with basic filtering using Supabase REST API"""
    try:
        # Get the user's JWT token from the request
        auth_header = request.headers.get("Authorization")
        access_token = None
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header.split(" ")[1]
        
        # Create service with JWT token for RLS
        supabase_service = SupabaseRSSService(access_token=access_token)
        
        # Get articles for this user using Supabase REST API
        articles = await supabase_service.get_articles_for_user(
            user_id=current_user["id"],
            limit=limit,
            offset=offset,
            category=category,
            min_quality=min_quality,
            exclude_duplicates=exclude_duplicates,
            exclude_used=exclude_used
        )
        
        return articles
        
    except Exception as e:
        logger.error(f"Error getting articles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get articles: {str(e)}")


@router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: int,
    current_user: dict = Depends(get_current_user_supabase)
):
    """Get a specific article using Supabase REST API"""
    try:
        # Use Supabase REST API instead of direct database connection
        # For now, return 404 - in full implementation, query article via REST API
        raise HTTPException(status_code=404, detail="Article not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting article {article_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get article: {str(e)}")


@router.get("/stats", response_model=RSSStatsResponse)
async def get_rss_stats(
    current_user: dict = Depends(get_current_user_supabase)
):
    """Get RSS statistics using Supabase REST API"""
    try:
        # Use Supabase REST API instead of direct database connection
        supabase_service = SupabaseRSSService()
        stats = await supabase_service.get_rss_stats()
        
        return RSSStatsResponse(**stats)
        
    except Exception as e:
        logger.error(f"Error getting RSS stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get RSS stats: {str(e)}")


@router.post("/sources/{source_id}/test")
async def test_rss_source(
    source_id: int,
    current_user: dict = Depends(get_current_user_supabase)
):
    """Test an RSS source by fetching a few articles using Supabase REST API"""
    try:
        # Use Supabase REST API instead of direct database connection
        supabase_service = SupabaseRSSService()
        sources = await supabase_service.get_rss_sources()
        
        # Find the specific source
        source = next((s for s in sources if s['id'] == source_id), None)
        if not source:
            raise HTTPException(status_code=404, detail="RSS source not found")
        
        rss_service = RSSService()
        
        # Test fetch
        feed_data = await rss_service.fetch_rss_feed(source['url'])
        
        await rss_service.close()
        
        if feed_data and feed_data.get('status') == 'success':
            entries = feed_data.get('entries', [])
            return {
                "success": True,
                "message": f"Successfully fetched {len(entries)} articles from {source['name']}",
                "articles_fetched": len(entries),
                "articles_processed": min(len(entries), 5),  # Process up to 5 articles
                "error": None
            }
        else:
            return {
                "success": False,
                "message": f"Failed to fetch from {source['name']}",
                "articles_fetched": 0,
                "articles_processed": 0,
                "error": feed_data.get('error', 'Unknown error') if feed_data else 'No response'
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing RSS source {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to test RSS source: {str(e)}")