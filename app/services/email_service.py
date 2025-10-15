import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import resend
from jinja2 import Template
from app.core.config import settings
from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending newsletters via email"""
    
    def __init__(self):
        resend.api_key = settings.RESEND_API_KEY
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME
    
    async def send_newsletter(
        self, 
        newsletter: Dict[str, Any], 
        recipient_email: str,
        recipient_name: str = "Subscriber"
    ) -> bool:
        """Send a newsletter via email"""
        try:
            # Generate HTML content
            html_content = self._generate_newsletter_html(newsletter)
            
            # Prepare email data
            subject = newsletter.get("subject", "Your AI-Generated Newsletter")
            
            email_data = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [recipient_email],
                "subject": subject,
                "html": html_content,
                "headers": {
                    "X-Newsletter-Source": "AI-Newz",
                    "X-Newsletter-Type": "generated"
                }
            }
            
            # Send email using Resend
            response = resend.Emails.send(email_data)
            
            if response and response.get("id"):
                logger.info(f"Newsletter sent successfully to {recipient_email}. Email ID: {response['id']}")
                return True
            else:
                logger.error(f"Failed to send newsletter: {response}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending newsletter: {e}")
            return False
    
    def _generate_newsletter_html(self, newsletter: Dict[str, Any]) -> str:
        """Generate HTML content for newsletter"""
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{ newsletter.subject }}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                .header p { margin: 10px 0 0 0; opacity: 0.9; }
                .content { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .opening { font-size: 18px; margin-bottom: 30px; color: #555; }
                .section { margin-bottom: 30px; }
                .section h2 { color: #667eea; font-size: 22px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
                .section p { margin-bottom: 15px; }
                .section ul { margin: 15px 0; padding-left: 20px; }
                .section li { margin-bottom: 8px; }
                .cta { background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center; }
                .cta h3 { color: #667eea; margin: 0 0 10px 0; }
                .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
                .tags { margin: 20px 0; }
                .tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-right: 8px; margin-bottom: 8px; }
                .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{{ newsletter.subject }}</h1>
                <p>AI-Generated Newsletter • {{ newsletter.estimated_read_time or '5 minutes' }} read</p>
            </div>
            
            <div class="content">
                <div class="opening">{{ newsletter.opening }}</div>
                
                {% for section in newsletter.sections %}
                <div class="section">
                    <h2>{{ section.title }}</h2>
                    <div>{{ section.content | replace('\n', '<br>') | safe }}</div>
                </div>
                {% endfor %}
                
                {% if newsletter.articles %}
                <div class="section">
                    <h2>📰 Featured Articles</h2>
                    <div class="articles">
                        {% for article in newsletter.articles %}
                        <div class="article-item" style="margin-bottom: 20px; padding: 15px; border-left: 3px solid #667eea; background: #f8f9ff;">
                            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">
                                <a href="{{ article.url }}" style="color: #667eea; text-decoration: none;">{{ article.title }}</a>
                            </h3>
                            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">{{ article.summary }}</p>
                            <div style="font-size: 12px; color: #888;">
                                <span>By {{ article.author or 'Unknown' }}</span>
                                {% if article.published_at %}
                                <span> • {{ article.published_at[:10] }}</span>
                                {% endif %}
                            </div>
                        </div>
                        {% endfor %}
                    </div>
                </div>
                {% endif %}
                
                {% if newsletter.call_to_action %}
                <div class="cta">
                    <h3>Call to Action</h3>
                    <p>{{ newsletter.call_to_action }}</p>
                </div>
                {% endif %}
                
                {% if newsletter.tags %}
                <div class="tags">
                    {% for tag in newsletter.tags %}
                    <span class="tag">{{ tag }}</span>
                    {% endfor %}
                </div>
                {% endif %}
            </div>
            
            <div class="footer">
                <p>This newsletter was generated by AI-Newz</p>
                <p>Generated on {{ newsletter.generated_at or 'today' }}</p>
            </div>
        </body>
        </html>
        """
        
        template = Template(template_str)
        return template.render(newsletter=newsletter)
    
    async def send_daily_digest(
        self, 
        user_id: str, 
        newsletter: Dict[str, Any]
    ) -> bool:
        """Send daily digest to user"""
        try:
            supabase = get_supabase_client()
            
            # Get user info
            user_response = supabase.table("users").select("email, name").eq("id", user_id).single().execute()
            if not user_response.data:
                logger.error(f"User {user_id} not found")
                return False
            
            user = user_response.data
            return await self.send_newsletter(
                newsletter=newsletter,
                recipient_email=user["email"],
                recipient_name=user["name"] or "Subscriber"
            )
            
        except Exception as e:
            logger.error(f"Error sending daily digest: {e}")
            return False
    
    async def send_email_to_address(
        self, 
        to: str, 
        newsletter: Dict[str, Any]
    ) -> bool:
        """Send newsletter directly to specified email address"""
        try:
            return await self.send_newsletter(
                newsletter=newsletter,
                recipient_email=to,
                recipient_name="Subscriber"
            )
            
        except Exception as e:
            logger.error(f"Error sending email to {to}: {e}")
            return False
    
    async def schedule_newsletter_delivery(
        self, 
        newsletter_id: str, 
        delivery_time: datetime,
        user_id: str
    ) -> bool:
        """Schedule newsletter for delivery at specific time"""
        try:
            supabase = get_supabase_client()
            
            # Update newsletter with scheduled time
            result = supabase.table("newsletters").update({
                "scheduled_at": delivery_time.isoformat(),
                "status": "scheduled"
            }).eq("id", newsletter_id).execute()
            
            if result.data:
                logger.info(f"Newsletter {newsletter_id} scheduled for {delivery_time}")
                return True
            else:
                logger.error(f"Failed to schedule newsletter {newsletter_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error scheduling newsletter: {e}")
            return False
    
    async def get_scheduled_newsletters(self) -> List[Dict[str, Any]]:
        """Get newsletters scheduled for delivery"""
        try:
            supabase = get_supabase_client()
            now = datetime.utcnow().isoformat()
            
            result = supabase.table("newsletters").select("*").eq("status", "scheduled").lte("scheduled_at", now).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting scheduled newsletters: {e}")
            return []
    
    async def process_scheduled_deliveries(self) -> int:
        """Process all scheduled newsletters for delivery"""
        try:
            scheduled_newsletters = await self.get_scheduled_newsletters()
            sent_count = 0
            
            for newsletter in scheduled_newsletters:
                # Parse newsletter content
                import json
                content = json.loads(newsletter["content"]) if isinstance(newsletter["content"], str) else newsletter["content"]
                
                # Send newsletter
                success = await self.send_daily_digest(
                    user_id=newsletter["user_id"],
                    newsletter=content
                )
                
                if success:
                    # Update status to sent
                    supabase = get_supabase_client()
                    supabase.table("newsletters").update({
                        "status": "sent",
                        "sent_at": datetime.utcnow().isoformat()
                    }).eq("id", newsletter["id"]).execute()
                    
                    sent_count += 1
            
            logger.info(f"Processed {sent_count} scheduled newsletters")
            return sent_count
            
        except Exception as e:
            logger.error(f"Error processing scheduled deliveries: {e}")
            return 0
