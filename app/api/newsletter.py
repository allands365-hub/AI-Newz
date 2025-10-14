from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

from app.core.database import get_db
from app.core.supabase_auth import get_current_user_supabase
from app.models.user import User
from app.models.newsletter import Newsletter
from app.services.grok_service import GrokService
from app.services.supabase_rss_service import SupabaseRSSService
from app.services.supabase_fallback_service import supabase_fallback
from app.core.config import settings
from app.schemas.newsletter import (
    NewsletterCreate,
    NewsletterUpdate,
    NewsletterResponse,
    NewsletterGenerateRequest,
    NewsletterGenerateResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)
security = HTTPBearer()

@router.get("/test")
async def test_newsletter():
    """Test endpoint for newsletter API"""
    return {"message": "Newsletter API is working!"}

@router.get("/debug-auth")
async def debug_auth(
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
):
    """Debug authentication endpoint"""
    return {
        "message": "Authentication working!",
        "user": current_user,
        "user_id": current_user.get("id"),
        "user_email": current_user.get("email")
    }

@router.get("/test-generate")
async def test_generate_newsletter():
    """Test newsletter generation without authentication"""
    try:
        grok_service = GrokService()
        
        result = await grok_service.generate_newsletter(
            topic="AI Trends in 2024",
            style="professional",
            length="medium",
            include_trends=True,
            include_summaries=True
        )
        
        return result
    except Exception as e:
        logger.error(f"Error in test newsletter generation: {e}")
        return {"success": False, "error": str(e)}

async def get_current_user(
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
) -> Dict[str, Any]:
    """Get current user from Supabase token - temporarily without database access"""
    try:
        logger.info(f"get_current_user called with user: {current_user}")
        
        if not current_user or not current_user.get("id"):
            logger.error("No user data received from Supabase")
            raise HTTPException(status_code=401, detail="Invalid user data")
        
        # For now, just return the user data from Supabase without database access
        logger.info("Returning user data from Supabase (database access temporarily disabled)")
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.post("/generate", response_model=NewsletterGenerateResponse)
async def generate_newsletter(
    request: NewsletterGenerateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Generate a new AI-powered newsletter using Grok"""
    try:
        grok_service = GrokService()
        
        # Get user preferences for personalized content (temporarily disabled)
        user_preferences = None
        # if hasattr(current_user, 'preferences') and current_user.preferences:
        #     user_preferences = {
        #         "preferred_sources": current_user.preferences.preferred_sources or [],
        #         "content_categories": current_user.preferences.content_categories or [],
        #         "ai_style": current_user.preferences.ai_style or "professional"
        #     }
        
        # Optionally fetch curated RSS articles via Supabase REST
        curated_articles: List[Dict[str, Any]] = []
        if getattr(request, "use_rss", False):
            try:
                supa_rss = SupabaseRSSService()
                params = {
                    "select": "id,title,url,summary,author,published_at,rss_source_id,quality_score,word_count,tags,image_url,category",
                    "is_active": "eq.true",
                    "order": "published_at.desc",
                    "limit": request.rss_limit,
                }
                # Filters
                filters = []
                if request.source_ids:
                    # Supabase REST supports in syntax: id=in.(1,2)
                    params["rss_source_id"] = f"in.({','.join(map(str, request.source_ids))})"
                if request.categories:
                    params["category"] = f"in.({','.join(request.categories)})"
                if request.platforms:
                    # platforms live on rss_sources; skip for now unless denormalized
                    pass
                if request.min_quality is not None:
                    params["quality_score"] = f"gte.{request.min_quality}"
                if request.min_word_count:
                    params["word_count"] = f"gte.{request.min_word_count}"
                if request.require_image:
                    params["image_url"] = "not.is.null"
                # Date filter
                if request.since_days and request.since_days > 0:
                    from datetime import datetime, timedelta, timezone
                    since_dt = datetime.now(timezone.utc) - timedelta(days=request.since_days)
                    params["published_at"] = f"gte.{since_dt.isoformat()}"

                # Query articles
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{supa_rss.supabase_url}/rest/v1/articles",
                        headers=supa_rss.headers,
                        params=params
                    )
                    response.raise_for_status()
                    articles = response.json()

                # Optional: enforce per-source cap
                if request.per_source_cap:
                    by_source: Dict[int, int] = {}
                    filtered: List[Dict[str, Any]] = []
                    for a in articles:
                        sid = a.get("rss_source_id")
                        count = by_source.get(sid, 0)
                        if count < request.per_source_cap:
                            filtered.append(a)
                            by_source[sid] = count + 1
                    articles = filtered

                # Optional: dedupe by title similarity (simple Jaccard over lowercase tokens)
                def title_sim(t1: str, t2: str) -> float:
                    if not t1 or not t2:
                        return 0.0
                    w1 = set(t1.lower().split())
                    w2 = set(t2.lower().split())
                    if not w1 or not w2:
                        return 0.0
                    inter = w1.intersection(w2)
                    union = w1.union(w2)
                    return len(inter) / len(union) if union else 0.0

                deduped: List[Dict[str, Any]] = []
                for a in articles:
                    if any(title_sim(a.get("title", ""), b.get("title", "")) >= request.dedupe_title_similarity for b in deduped):
                        continue
                    deduped.append(a)

                # Sort: images first (has_images or image_url), then quality, then recency
                def has_image(a: Dict[str, Any]) -> int:
                    if a.get("has_images") is True:
                        return 1
                    return 1 if a.get("image_url") else 0
                deduped.sort(
                    key=lambda x: (
                        has_image(x),
                        (x.get("quality_score") or 0),
                        (x.get("published_at") or "")
                    ),
                    reverse=True
                )

                # Reduce to include_fields
                include_set = set(request.include_fields or ["title","summary","url","tags"])
                curated_articles = [
                    {k: v for k, v in a.items() if k in include_set or k in ("id","rss_source_id","published_at")}
                    for a in deduped[: request.rss_limit]
                ]
            except Exception as e:
                logger.warning(f"RSS curation skipped due to error: {e}")
                curated_articles = []

        # Generate the newsletter
        result = await grok_service.generate_newsletter(
            topic=request.topic,
            style=request.style or "professional",
            length=request.length,
            include_trends=request.include_trends,
            include_summaries=request.include_summaries,
            user_preferences=user_preferences,
            curated_articles=curated_articles if curated_articles else None
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate newsletter: {result.get('error', 'Unknown error')}"
            )
        
        # If user wants to save the newsletter, create it in Supabase
        newsletter_data = None
        if request.save_newsletter:
            try:
                from app.services.supabase_service import get_supabase_client
                import uuid
                import json
                
                supabase = get_supabase_client()
                
                newsletter_data = {
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["id"],
                    "title": result["newsletter"].get("subject", request.topic),
                    "topic": request.topic,
                    "content": json.dumps(result["newsletter"]),
                    "status": "draft",
                    "ai_model": result.get("model_used", "llama-3.1-70b-versatile"),
                    "ai_parameters": {
                        "style": request.style or "professional",
                        "length": request.length,
                        "include_trending_topics": request.include_trends,
                        "include_article_summaries": request.include_summaries
                    },
                    "read_time_minutes": result["newsletter"].get("estimated_read_time", "5 minutes"),
                    "tags": result["newsletter"].get("tags", []),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                # Insert into Supabase
                result_db = supabase.table("newsletters").insert(newsletter_data).execute()
                
                if not result_db.data:
                    logger.error("Failed to save newsletter to database (empty data)")
                    newsletter_data = None
            except Exception as save_err:
                logger.error(f"Save to Supabase failed: {save_err}")
                newsletter_data = None
        
        # Optionally mark included articles as used
        try:
            if curated_articles and newsletter_data and newsletter_data.get("id"):
                supa_rss = SupabaseRSSService()
                # Update in batches
                updates = []
                for a in curated_articles:
                    aid = a.get("id")
                    if aid is None:
                        continue
                    updates.append(aid)
                # Perform updates one by one to keep it simple and reliable
                from datetime import datetime as _dt
                for aid in updates:
                    patch = {
                        "is_used_in_newsletter": True,
                        "newsletter_id": newsletter_data.get("id"),
                        "updated_at": _dt.utcnow().isoformat()
                    }
                    async with httpx.AsyncClient() as client:
                        await client.patch(
                            f"{supa_rss.supabase_url}/rest/v1/articles?id=eq.{aid}",
                            headers=supa_rss.headers,
                            json=patch
                        )
        except Exception as e:
            logger.warning(f"Failed to mark included articles as used: {e}")

        return NewsletterGenerateResponse(
            success=True,
            newsletter=result["newsletter"],
            newsletter_id=newsletter_data.get("id") if newsletter_data else None,
            model_used=result.get("model_used", "llama-3.1-70b-versatile"),
            tokens_used=result.get("tokens_used", 0),
            raw_content=result.get("raw_content", ""),
            included_articles=curated_articles or None
        )
        
    except Exception as e:
        logger.error(f"Error generating newsletter: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating the newsletter"
        )

@router.post("/generate-variations")
async def generate_newsletter_variations(
    topic: str = Query(..., description="Newsletter topic"),
    num_variations: int = Query(3, ge=1, le=5, description="Number of variations to generate"),
    current_user: User = Depends(get_current_user)
):
    """Generate multiple variations of a newsletter for A/B testing"""
    try:
        grok_service = GrokService()
        
        variations = await grok_service.generate_newsletter_variations(
            topic=topic,
            num_variations=num_variations
        )
        
        return {
            "success": True,
            "variations": variations,
            "topic": topic
        }
        
    except Exception as e:
        logger.error(f"Error generating newsletter variations: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating newsletter variations"
        )

@router.get("/", response_model=List[NewsletterResponse])
async def get_newsletters(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get user's newsletters with pagination and filtering via Supabase REST (RLS)."""
    try:
        # Always use Supabase REST with user token (RLS)
        logger.info("Using Supabase REST (JWT) to list newsletters")
        access_token = credentials.credentials if credentials else None
        if not access_token:
            raise HTTPException(status_code=401, detail="Missing bearer token")

        # Call Supabase REST directly with the user's JWT for RLS
        supabase_url = settings.SUPABASE_URL
        headers = {
            "apikey": settings.SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {access_token}",
        }
        params = {
            "user_id": f"eq.{current_user['id']}",
            "order": "created_at.desc",
        }
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    f"{supabase_url}/rest/v1/newsletters",
                    headers=headers,
                    params={**params, "select": "*"},
                )
                response.raise_for_status()
                items = response.json()
        except httpx.HTTPError as e:
            logger.error(f"Supabase REST error listing newsletters (JWT path): {e}")
            # Fallback to anon-key path (may return empty due to RLS)
            fb = await supabase_fallback.get_user_newsletters(current_user["id"])
            items = fb.get("data", []) if isinstance(fb, dict) else []

        # Optional status filter
        if status:
            items = [n for n in items if (n.get("status") or "").lower() == status.lower()]

        # Pagination
        paged = items[skip: skip + limit]
        return paged

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching newsletters")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching newsletters: {str(e)}"
        )

@router.get("/{newsletter_id}", response_model=NewsletterResponse)
async def get_newsletter(
    newsletter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific newsletter by ID"""
    try:
        newsletter = db.query(Newsletter).filter(
            Newsletter.id == newsletter_id,
            Newsletter.user_id == current_user["id"]
        ).first()
        
        if not newsletter:
            raise HTTPException(
                status_code=404,
                detail="Newsletter not found"
            )
        
        return newsletter.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching newsletter {newsletter_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching the newsletter"
        )

@router.put("/{newsletter_id}", response_model=NewsletterResponse)
async def update_newsletter(
    newsletter_id: str,
    newsletter_update: NewsletterUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a newsletter"""
    try:
        # Check if we have a real database connection
        if hasattr(db, 'query') and hasattr(db, 'commit'):
            # Use regular database connection
            newsletter = db.query(Newsletter).filter(
                Newsletter.id == newsletter_id,
                Newsletter.user_id == current_user["id"]
            ).first()
            
            if not newsletter:
                raise HTTPException(
                    status_code=404,
                    detail="Newsletter not found"
                )
            
            # Update fields
            update_data = newsletter_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(newsletter, field, value)
            
            newsletter.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(newsletter)
            
            return newsletter.to_dict()
        else:
            # Use Supabase fallback service
            logger.info(f"Using Supabase fallback service for newsletter update {newsletter_id}")
            
            # Prepare update data for Supabase
            update_data = newsletter_update.dict(exclude_unset=True)
            if update_data:
                update_data["updated_at"] = datetime.utcnow().isoformat()
                
                result = await supabase_fallback.update_newsletter(newsletter_id, update_data)
                
                if "error" in result:
                    raise HTTPException(status_code=500, detail=result["error"])
                
                logger.info(f"Newsletter {newsletter_id} updated successfully via Supabase fallback")
                return result
            else:
                raise HTTPException(
                    status_code=400,
                    detail="No update data provided"
                )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating newsletter {newsletter_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while updating the newsletter: {str(e)}"
        )

@router.delete("/{newsletter_id}")
async def delete_newsletter(
    newsletter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a newsletter"""
    try:
        newsletter = db.query(Newsletter).filter(
            Newsletter.id == newsletter_id,
            Newsletter.user_id == current_user["id"]
        ).first()
        
        if not newsletter:
            raise HTTPException(
                status_code=404,
                detail="Newsletter not found"
            )
        
        db.delete(newsletter)
        db.commit()
        
        return {"success": True, "message": "Newsletter deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting newsletter {newsletter_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while deleting the newsletter"
        )

@router.post("/{newsletter_id}/publish")
async def publish_newsletter(
    newsletter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publish a newsletter"""
    try:
        newsletter = db.query(Newsletter).filter(
            Newsletter.id == newsletter_id,
            Newsletter.user_id == current_user["id"]
        ).first()
        
        if not newsletter:
            raise HTTPException(
                status_code=404,
                detail="Newsletter not found"
            )
        
        newsletter.status = "published"
        newsletter.published_at = datetime.utcnow()
        newsletter.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(newsletter)
        
        return {
            "success": True,
            "message": "Newsletter published successfully",
            "newsletter": newsletter.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing newsletter {newsletter_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while publishing the newsletter"
        )

@router.post("/", response_model=NewsletterResponse)
async def create_newsletter(
    newsletter_data: NewsletterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new newsletter"""
    try:
        # Debug logging
        logger.info(f"Creating newsletter with data: title={newsletter_data.title}, subject={newsletter_data.subject}")
        logger.info(f"Content type: {type(newsletter_data.content)}, length: {len(newsletter_data.content) if newsletter_data.content else 0}")
        
        # Validate required fields
        if not newsletter_data.title or not newsletter_data.title.strip():
            raise HTTPException(status_code=422, detail="Title is required and cannot be empty")
        
        if not newsletter_data.subject or not newsletter_data.subject.strip():
            raise HTTPException(status_code=422, detail="Subject is required and cannot be empty")
        
        if not newsletter_data.content or not newsletter_data.content.strip():
            raise HTTPException(status_code=422, detail="Content is required and cannot be empty")
        
        # Try to parse content as JSON to validate it
        try:
            import json
            import re
            
            # Clean the content to extract JSON from markdown code blocks
            content_to_parse = newsletter_data.content.strip()
            
            # Remove markdown code blocks if present
            if content_to_parse.startswith('```json'):
                # Extract JSON from markdown code block
                json_match = re.search(r'```json\s*(.*?)\s*```', content_to_parse, re.DOTALL)
                if json_match:
                    content_to_parse = json_match.group(1).strip()
            elif content_to_parse.startswith('```'):
                # Extract JSON from generic code block
                json_match = re.search(r'```\s*(.*?)\s*```', content_to_parse, re.DOTALL)
                if json_match:
                    content_to_parse = json_match.group(1).strip()
            
            parsed_content = json.loads(content_to_parse)
            logger.info(f"Content parsed successfully: {type(parsed_content)}")
            
            # Update the content with the cleaned JSON
            newsletter_data.content = content_to_parse
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON content: {e}")
            raise HTTPException(status_code=422, detail=f"Content must be valid JSON: {str(e)}")
        
        # Check if we have a real database connection
        if hasattr(db, 'add') and hasattr(db, 'commit'):
            # Use regular database connection
            newsletter = Newsletter(
                user_id=current_user["id"],
                title=newsletter_data.title.strip(),
                subject=newsletter_data.subject.strip(),  # Use subject field directly
                content=newsletter_data.content,  # Already a dict, will be converted to jsonb
                status=newsletter_data.status or "draft",
                style=newsletter_data.style or "professional",
                length=newsletter_data.length or "medium",
                ai_model_used=newsletter_data.ai_model_used or "llama-3.1-70b-versatile",
                tokens_used=0,  # Default value
                subscribers_count=newsletter_data.subscribers_count or 0,
                views_count=newsletter_data.views_count or 0,
                open_rate=newsletter_data.open_rate or 0.0,
                click_rate=newsletter_data.click_rate or 0.0,
                estimated_read_time=newsletter_data.estimated_read_time or "5 minutes",
                tags=newsletter_data.tags or []
            )
            
            db.add(newsletter)
            db.commit()
            db.refresh(newsletter)
            
            logger.info(f"Newsletter created successfully with ID: {newsletter.id}")
            return newsletter.to_dict()
        else:
            # Use Supabase fallback service
            logger.info("Using Supabase fallback service for newsletter creation")
            
            newsletter_data_dict = {
                "user_id": current_user["id"],
                "title": newsletter_data.title.strip(),
                "subject": newsletter_data.subject.strip(),
                "content": newsletter_data.content,
                "status": newsletter_data.status or "draft",
                "style": newsletter_data.style or "professional",
                "length": newsletter_data.length or "medium",
                "ai_model_used": newsletter_data.ai_model_used or "llama-3.1-70b-versatile",
                "tokens_used": 0,
                "subscribers_count": newsletter_data.subscribers_count or 0,
                "views_count": newsletter_data.views_count or 0,
                "open_rate": newsletter_data.open_rate or 0.0,
                "click_rate": newsletter_data.click_rate or 0.0,
                "estimated_read_time": newsletter_data.estimated_read_time or "5 minutes",
                "tags": newsletter_data.tags or []
            }
            
            result = await supabase_fallback.create_newsletter(newsletter_data_dict)
            
            if "error" in result:
                raise HTTPException(status_code=500, detail=result["error"])
            
            logger.info(f"Newsletter created successfully via Supabase fallback with ID: {result['id']}")
            return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error creating newsletter: {e}")
        # Only rollback if we have a real database connection
        if hasattr(db, 'rollback'):
            db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while creating the newsletter: {str(e)}"
        )

@router.get("/analytics/summary")
async def get_newsletter_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get newsletter analytics summary for the user"""
    try:
        newsletters = db.query(Newsletter).filter(Newsletter.user_id == current_user["id"]).all()
        
        total_newsletters = len(newsletters)
        published_newsletters = len([n for n in newsletters if n.status == "published"])
        draft_newsletters = len([n for n in newsletters if n.status == "draft"])
        
        total_views = sum(n.views_count for n in newsletters)
        total_subscribers = sum(n.subscribers_count for n in newsletters)
        
        avg_open_rate = sum(n.open_rate for n in newsletters) / total_newsletters if total_newsletters > 0 else 0
        avg_click_rate = sum(n.click_rate for n in newsletters) / total_newsletters if total_newsletters > 0 else 0
        
        return {
            "total_newsletters": total_newsletters,
            "published_newsletters": published_newsletters,
            "draft_newsletters": draft_newsletters,
            "total_views": total_views,
            "total_subscribers": total_subscribers,
            "average_open_rate": round(avg_open_rate, 2),
            "average_click_rate": round(avg_click_rate, 2)
        }
        
    except Exception as e:
        logger.error(f"Error fetching newsletter analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching newsletter analytics"
        )
