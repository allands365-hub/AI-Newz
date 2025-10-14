from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel
from app.core.supabase_auth import get_current_user_supabase
from app.services.email_service import EmailService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/send-newsletter")
async def send_newsletter(
    newsletter_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
):
    """Send a newsletter immediately via email"""
    try:
        email_service = EmailService()
        
        # Get newsletter from database
        from app.services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        result = supabase.table("newsletters").select("*").eq("id", newsletter_id).eq("user_id", current_user["id"]).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Newsletter not found")
        
        newsletter = result.data
        
        # Parse content
        import json
        content = json.loads(newsletter["content"]) if isinstance(newsletter["content"], str) else newsletter["content"]
        
        # Send email
        success = await email_service.send_daily_digest(
            user_id=current_user["id"],
            newsletter=content
        )
        
        if success:
            # Update status
            supabase.table("newsletters").update({
                "status": "sent",
                "sent_at": datetime.utcnow().isoformat()
            }).eq("id", newsletter_id).execute()
            
            return {"message": "Newsletter sent successfully", "status": "sent"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send newsletter")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending newsletter: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule-newsletter")
async def schedule_newsletter(
    newsletter_id: str,
    delivery_time: str,  # ISO format datetime
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
):
    """Schedule a newsletter for delivery at specific time"""
    try:
        email_service = EmailService()
        
        # Parse delivery time
        delivery_datetime = datetime.fromisoformat(delivery_time.replace('Z', '+00:00'))
        
        # Schedule newsletter
        success = await email_service.schedule_newsletter_delivery(
            newsletter_id=newsletter_id,
            delivery_time=delivery_datetime,
            user_id=current_user["id"]
        )
        
        if success:
            return {"message": "Newsletter scheduled successfully", "delivery_time": delivery_time}
        else:
            raise HTTPException(status_code=500, detail="Failed to schedule newsletter")
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid delivery time format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling newsletter: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/delivery-status/{newsletter_id}")
async def get_delivery_status(
    newsletter_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
):
    """Get delivery status of a newsletter"""
    try:
        from app.services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        result = supabase.table("newsletters").select("status, scheduled_at, sent_at").eq("id", newsletter_id).eq("user_id", current_user["id"]).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Newsletter not found")
        
        newsletter = result.data
        
        return {
            "newsletter_id": newsletter_id,
            "status": newsletter["status"],
            "scheduled_at": newsletter.get("scheduled_at"),
            "sent_at": newsletter.get("sent_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting delivery status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-email")
async def test_email(
    current_user: Dict[str, Any] = Depends(get_current_user_supabase)
):
    """Send a test email to verify email configuration"""
    try:
        email_service = EmailService()
        
        # Create test newsletter
        test_newsletter = {
            "subject": "Test Newsletter from AI-Newz",
            "opening": "This is a test newsletter to verify your email configuration is working correctly.",
            "sections": [
                {
                    "title": "Test Section",
                    "content": "If you're receiving this email, your AI-Newz email delivery system is working perfectly!",
                    "type": "main"
                }
            ],
            "call_to_action": "Visit your dashboard to start creating newsletters!",
            "estimated_read_time": "1 minute",
            "tags": ["test", "email-verification"]
        }
        
        success = await email_service.send_daily_digest(
            user_id=current_user["id"],
            newsletter=test_newsletter
        )
        
        if success:
            return {"message": "Test email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class TestNewsletterRequest(BaseModel):
    to: str
    subject: str
    content: str

@router.post("/send-test-newsletter")
async def send_test_newsletter(
    request: TestNewsletterRequest
):
    """Send a test newsletter without authentication (for testing purposes)"""
    try:
        email_service = EmailService()
        
        # Create test newsletter
        test_newsletter = {
            "subject": request.subject,
            "opening": request.content,
            "sections": [
                {
                    "title": "AI and Technology Trends",
                    "content": "This newsletter was generated with RSS content from MIT Technology Review, including articles about planet hunting and e-scooters. The AI has curated the latest technology trends for you.",
                    "type": "main"
                },
                {
                    "title": "From Around the Web",
                    "content": "• The Download: planet hunting, and India's e-scooters - This daily newsletter provides a dose of what's going on in the world of technology.\n• An Earthling's guide to planet hunting - Rebecca Jensen-Clem's work at the Keck Observatory is helping us better understand the atmosphere of exoplanets.",
                    "type": "summary"
                }
            ],
            "call_to_action": "Visit AI-Newz to create your own newsletters!",
            "estimated_read_time": "5 minutes",
            "tags": ["AI", "Technology", "RSS", "Newsletter"]
        }
        
        # Send email directly to the specified address
        success = await email_service.send_email_to_address(
            to=request.to,
            newsletter=test_newsletter
        )
        
        if success:
            return {"message": f"Test newsletter sent successfully to {request.to}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test newsletter")
            
    except Exception as e:
        logger.error(f"Error sending test newsletter: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Import required modules
import uuid
import json
