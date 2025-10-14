from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_

from app.core.supabase_auth import get_current_user_supabase
from app.core.database import get_db
from app.models.newsletter import Newsletter
from app.models.user import User
from app.services.supabase_fallback_service import supabase_fallback

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/overview")
async def get_analytics_overview(
    current_user: Dict[str, Any] = Depends(get_current_user_supabase),
    db: Session = Depends(get_db)
):
    """Get analytics overview for the current user"""
    try:
        user_id = current_user["id"]
        
        # Use Supabase REST API directly to avoid DNS issues
        logger.info("Using Supabase REST API for analytics overview")
        
        # Get newsletters from Supabase
        newsletters_result = await supabase_fallback.get_user_newsletters(user_id)
        if "error" in newsletters_result:
            raise HTTPException(status_code=500, detail=newsletters_result["error"])
        
        newsletters = newsletters_result.get("data", [])
        total_newsletters = len(newsletters)
        
        published_newsletters = len([n for n in newsletters if n.get("status") == "published"])
        
        # Calculate averages
        published_newsletters_list = [n for n in newsletters if n.get("status") == "published"]
        avg_open_rate = sum(n.get("open_rate", 0) for n in published_newsletters_list) / len(published_newsletters_list) if published_newsletters_list else 0.0
        avg_click_rate = sum(n.get("click_rate", 0) for n in published_newsletters_list) / len(published_newsletters_list) if published_newsletters_list else 0.0
        
        total_subscribers = sum(n.get("subscribers_count", 0) for n in published_newsletters_list)
        total_views = sum(n.get("views_count", 0) for n in published_newsletters_list)
        
        # Calculate growth rates (simplified - in real app, you'd compare with previous period)
        growth_newsletters = 0  # Placeholder - would calculate from previous period
        growth_open_rate = 0    # Placeholder
        growth_click_rate = 0   # Placeholder
        growth_subscribers = 0  # Placeholder
        
        return {
            "total_newsletters": total_newsletters,
            "published_newsletters": published_newsletters,
            "draft_newsletters": total_newsletters - published_newsletters,
            "avg_open_rate": round(avg_open_rate, 1),
            "avg_click_rate": round(avg_click_rate, 1),
            "total_subscribers": total_subscribers,
            "total_views": total_views,
            "growth": {
                "newsletters": f"+{growth_newsletters}%",
                "open_rate": f"+{growth_open_rate}%",
                "click_rate": f"+{growth_click_rate}%",
                "subscribers": f"+{growth_subscribers}%"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting analytics overview: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")

@router.get("/recent-performance")
async def get_recent_performance(
    current_user: Dict[str, Any] = Depends(get_current_user_supabase),
    db: Session = Depends(get_db)
):
    """Get recent newsletter performance"""
    try:
        user_id = current_user["id"]
        
        # Use Supabase REST API directly to avoid DNS issues
        logger.info("Using Supabase REST API for recent performance")
        
        newsletters_result = await supabase_fallback.get_user_newsletters(user_id)
        if "error" in newsletters_result:
            raise HTTPException(status_code=500, detail=newsletters_result["error"])
        
        newsletters = newsletters_result.get("data", [])
        published_newsletters = [n for n in newsletters if n.get("status") == "published"]
        
        # Sort by published_at and limit to 10
        published_newsletters.sort(key=lambda x: x.get("published_at", ""), reverse=True)
        recent_newsletters = published_newsletters[:10]
        
        performance_data = []
        for newsletter in recent_newsletters:
            performance_data.append({
                "id": newsletter.get("id"),
                "title": newsletter.get("title"),
                "published_at": newsletter.get("published_at"),
                "open_rate": newsletter.get("open_rate", 0),
                "click_rate": newsletter.get("click_rate", 0),
                "subscribers_count": newsletter.get("subscribers_count", 0),
                "views_count": newsletter.get("views_count", 0)
            })
        
        return {"recent_performance": performance_data}
        
    except Exception as e:
        logger.error(f"Error getting recent performance: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting recent performance: {str(e)}")

@router.get("/top-content")
async def get_top_content(
    current_user: Dict[str, Any] = Depends(get_current_user_supabase),
    db: Session = Depends(get_db)
):
    """Get top performing content"""
    try:
        user_id = current_user["id"]
        
        # Use Supabase REST API directly to avoid DNS issues
        logger.info("Using Supabase REST API for top content")
        
        newsletters_result = await supabase_fallback.get_user_newsletters(user_id)
        if "error" in newsletters_result:
            raise HTTPException(status_code=500, detail=newsletters_result["error"])
        
        newsletters = newsletters_result.get("data", [])
        published_newsletters = [n for n in newsletters if n.get("status") == "published"]
        
        # Sort by views_count and limit to 10
        published_newsletters.sort(key=lambda x: x.get("views_count", 0), reverse=True)
        top_newsletters = published_newsletters[:10]
        
        top_content = []
        for newsletter in top_newsletters:
            views = newsletter.get("views_count", 0)
            open_rate = newsletter.get("open_rate", 0)
            click_rate = newsletter.get("click_rate", 0)
            engagement = (open_rate * click_rate) / 100
            
            top_content.append({
                "id": newsletter.get("id"),
                "title": newsletter.get("title"),
                "views": views,
                "engagement": round(engagement, 1),
                "open_rate": open_rate,
                "click_rate": click_rate
            })
        
        return {"top_content": top_content}
        
    except Exception as e:
        logger.error(f"Error getting top content: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting top content: {str(e)}")

@router.get("/growth-trends")
async def get_growth_trends(
    current_user: Dict[str, Any] = Depends(get_current_user_supabase),
    db: Session = Depends(get_db)
):
    """Get growth trends over time"""
    try:
        user_id = current_user["id"]
        
        # Use Supabase REST API directly to avoid DNS issues
        logger.info("Using Supabase REST API for growth trends")
        
        newsletters_result = await supabase_fallback.get_user_newsletters(user_id)
        if "error" in newsletters_result:
            raise HTTPException(status_code=500, detail=newsletters_result["error"])
        
        newsletters = newsletters_result.get("data", [])
        published_newsletters = [n for n in newsletters if n.get("status") == "published"]
        
        # Group by week for trends
        weekly_data = {}
        for newsletter in published_newsletters:
            published_at = newsletter.get("published_at")
            if published_at:
                try:
                    newsletter_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    week_start = newsletter_date - timedelta(days=newsletter_date.weekday())
                    week_key = week_start.strftime("%Y-%m-%d")
                    
                    if week_key not in weekly_data:
                        weekly_data[week_key] = {
                            "week": week_key,
                            "newsletters": 0,
                            "total_views": 0,
                            "total_subscribers": 0,
                            "avg_open_rate": 0,
                            "avg_click_rate": 0
                        }
                    
                    weekly_data[week_key]["newsletters"] += 1
                    weekly_data[week_key]["total_views"] += newsletter.get("views_count", 0)
                    weekly_data[week_key]["total_subscribers"] += newsletter.get("subscribers_count", 0)
                    weekly_data[week_key]["avg_open_rate"] += newsletter.get("open_rate", 0)
                    weekly_data[week_key]["avg_click_rate"] += newsletter.get("click_rate", 0)
                except (ValueError, TypeError):
                    # Skip invalid dates
                    continue
        
        # Calculate averages
        for week_data in weekly_data.values():
            if week_data["newsletters"] > 0:
                week_data["avg_open_rate"] = round(week_data["avg_open_rate"] / week_data["newsletters"], 1)
                week_data["avg_click_rate"] = round(week_data["avg_click_rate"] / week_data["newsletters"], 1)
        
        trends = list(weekly_data.values())
        
        return {"growth_trends": trends}
        
    except Exception as e:
        logger.error(f"Error getting growth trends: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting growth trends: {str(e)}")
