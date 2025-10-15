from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.supabase_auth import router as supabase_auth_router
from app.api.profile_picture import router as profile_picture_router
from app.api.newsletter import router as newsletter_router
from app.api.email import router as email_router
from app.api.rss import router as rss_router
from app.api.analytics import router as analytics_router
# Import models to ensure they are loaded
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.models.newsletter import Newsletter
from app.models.rss_source import RSSSource
from app.models.article import Article
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered newsletter creation platform - AI-Newz",
    debug=settings.DEBUG
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(supabase_auth_router, prefix="/api/v1")
app.include_router(profile_picture_router, prefix="/api/v1")
app.include_router(newsletter_router, prefix="/api/v1/newsletters")
app.include_router(email_router, prefix="/api/v1/email")
app.include_router(rss_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1/analytics")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

@app.get("/debug/env")
async def debug_env():
    """Debug endpoint to check environment variables"""
    import os
    from app.core.config import settings
    
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


@app.post("/api/v1/test-newsletter-generate")
async def test_newsletter_generate(request: dict):
    """Test newsletter generation without authentication - for development"""
    try:
        from app.services.grok_service import GrokService
        
        grok_service = GrokService()
        
        result = await grok_service.generate_newsletter(
            topic=request.get('topic', 'Test Newsletter'),
            style=request.get('style', 'professional'),
            length=request.get('length', 'medium'),
            include_trends=request.get('include_trending_topics', True),
            include_summaries=request.get('include_article_summaries', True)
        )
        
        return result
    except Exception as e:
        logger.error(f"Error in test newsletter generation: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/v1/test-save-draft")
async def test_save_draft(request: dict):
    """Test saving a draft newsletter without authentication - for testing"""
    try:
        from app.services.supabase_fallback_service import supabase_fallback
        
        newsletter_data = {
            "user_id": request.get('user_id', 'test-user-id'),
            "title": request.get('title', 'Test Newsletter'),
            "subject": request.get('subject', 'Test Subject'),
            "content": request.get('content', '{"test": "content"}'),
            "status": "draft"
        }
        
        result = await supabase_fallback.create_newsletter(newsletter_data)
        
        return result
        
    except Exception as e:
        logger.error(f"Error testing save draft: {e}")
        return {"error": str(e)}

@app.post("/api/v1/send-newsletter-email")
async def send_newsletter_email(request: dict):
    """Send newsletter via email without authentication - for testing"""
    try:
        from app.services.email_service import EmailService
        
        email_service = EmailService()
        
        # Create newsletter content
        newsletter = {
            "subject": request.get('subject', 'Weekly Update: AI and Technology Trends'),
            "opening": request.get('content', 'This newsletter was generated with RSS content from MIT Technology Review, including articles about planet hunting and e-scooters. The AI has curated the latest technology trends for you.'),
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
        
        # Send email
        success = await email_service.send_email_to_address(
            to=request.get('to', 'allands365@gmail.com'),
            newsletter=newsletter
        )
        
        if success:
            return {"message": f"Newsletter sent successfully to {request.get('to', 'allands365@gmail.com')}"}
        else:
            return {"error": "Failed to send newsletter"}
            
    except Exception as e:
        logger.error(f"Error sending newsletter email: {e}")
        return {"error": str(e)}


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
