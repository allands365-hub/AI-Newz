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
            # Best-effort enrich articles with images before rendering
            try:
                if isinstance(newsletter, dict) and newsletter.get("articles"):
                    newsletter["articles"] = await self._enrich_articles_with_images(newsletter["articles"])
            except Exception:
                pass
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
            try:
                response = resend.Emails.send(email_data)
            except Exception as resend_error:
                # Surface common domain verification error clearly but don't throw
                msg = str(resend_error)
                if "domain is not verified" in msg.lower() or "not verified" in msg.lower():
                    logger.error("Error sending newsletter: The sending domain is not verified with Resend. Please verify the domain in Resend dashboard.")
                else:
                    logger.error(f"Resend send error: {msg}")
                return False
            
            if response and response.get("id"):
                logger.info(f"Newsletter sent successfully to {recipient_email}. Email ID: {response['id']}")
                return True
            else:
                logger.error(f"Failed to send newsletter: {response}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending newsletter: {e}")
            return False

    async def _enrich_articles_with_images(self, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Add images to articles that lack them using OpenGraph/Twitter meta tags.
        Best-effort; silently ignores failures.
        """
        if not articles:
            return articles
        try:
            import asyncio
            import httpx
            from bs4 import BeautifulSoup

            async def fetch_image(url: str) -> Optional[str]:
                if not url:
                    return None
                try:
                    async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                        resp = await client.get(url)
                        text = resp.text
                except Exception:
                    return None
                try:
                    soup = BeautifulSoup(text, "html.parser")
                    # OG image first
                    for sel in (
                        {"property": "og:image"},
                        {"property": "og:image:url"},
                        {"property": "og:image:secure_url"},
                        {"name": "og:image"},
                    ):
                        tag = soup.find("meta", sel)
                        if tag and tag.get("content"):
                            return tag["content"].strip()
                    # Twitter image
                    for sel in (
                        {"name": "twitter:image"},
                        {"name": "twitter:image:src"},
                        {"property": "twitter:image"},
                        {"property": "twitter:image:src"},
                    ):
                        tag = soup.find("meta", sel)
                        if tag and tag.get("content"):
                            return tag["content"].strip()
                    # Fallback: first reasonably large <img>
                    best = None
                    best_score = 0
                    for img in soup.find_all("img"):
                        src = img.get("src") or img.get("data-src") or img.get("data-original")
                        if not src or not isinstance(src, str) or not src.startswith("http"):
                            continue
                        w = img.get("width")
                        h = img.get("height")
                        score = 100
                        try:
                            if w and h:
                                score += min(int(w) * int(h) // 500, 400)
                        except Exception:
                            pass
                        if score > best_score:
                            best_score = score
                            best = src
                    return best
                except Exception:
                    return None

            async def enrich(a: Dict[str, Any]) -> Dict[str, Any]:
                if a.get("thumbnail_url") or a.get("image_url"):
                    return a
                img = await fetch_image(a.get("url"))
                if img:
                    a["thumbnail_url"] = a.get("thumbnail_url") or img
                    a["image_url"] = a.get("image_url") or img
                return a

            return await asyncio.gather(*[enrich(dict(a)) for a in articles])
        except Exception:
            return articles
    
    def _generate_newsletter_html(self, newsletter: Dict[str, Any], template_type: str = "modern") -> str:
        """Generate HTML content for newsletter email with template selection"""
        
        if template_type == "minimal":
            return self._generate_minimal_template(newsletter)
        elif template_type == "classic":
            return self._generate_classic_template(newsletter)
        elif template_type == "tech":
            return self._generate_tech_template(newsletter)
        else:  # modern (default)
            return self._generate_modern_template(newsletter)
    
    def _generate_modern_template(self, newsletter: Dict[str, Any]) -> str:
        """Generate modern newsletter template"""
        template_str = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="x-ua-compatible" content="ie=edge">
          <title>{{ newsletter.subject }}</title>
          <style>
            /* Client resets */
            body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
            table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
            img { -ms-interpolation-mode:bicubic; }
            img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
            table { border-collapse:collapse !important; }
            body { margin:0 !important; padding:0 !important; width:100% !important; }
            /* Responsive */
            @media screen and (max-width: 600px) {
              .container { width:100% !important; }
              .stack { display:block !important; width:100% !important; }
              .p-24 { padding:16px !important; }
            }
            /* Utilities */
            .btn { background:#2563eb; color:#ffffff !important; text-decoration:none; padding:12px 18px; border-radius:6px; display:inline-block; font-weight:600; }
            .badge { display:inline-block; padding:4px 10px; border-radius:9999px; background:#eef2ff; color:#4f46e5; font-size:12px; }
          </style>
        </head>
        <body style="background:#f5f7fb;">
          <center role="article" aria-roledescription="email" lang="en" style="width:100%; background:#f5f7fb;">
            <!-- Outer wrapper -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f7fb;">
              <tr>
                <td align="center" style="padding:24px;">
                  <!-- Card -->
                  <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                    <!-- Hero -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:28px 24px; color:#ffffff;">
                        <span class="badge">AI‑Newz</span>
                        <h1 style="margin:12px 0 8px; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:26px; line-height:1.25;">{{ newsletter.subject }}</h1>
                        <p style="margin:0; opacity:.9;">{{ newsletter.estimated_read_time or '5 minutes' }} read</p>
                        {% if newsletter.call_to_action %}
                        <div style="margin-top:16px;">
                          <a class="btn" href="#">Browse Templates</a>
                        </div>
                        {% endif %}
                      </td>
                    </tr>
                    <!-- Body: full width -->
                    <tr>
                      <td class="p-24" style="padding:24px;">
                        <!-- Opening -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
                          <tr><td style="font-family:Segoe UI,Roboto,Arial,sans-serif; color:#374151; font-size:16px; line-height:1.6;">{{ newsletter.opening }}</td></tr>
                        </table>
                        {% for section in newsletter.sections %}
                        {% if (section.content | default('') | trim) != (newsletter.opening | default('') | trim) %}
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
                          <tr>
                            <td style="font-family:Segoe UI,Roboto,Arial,sans-serif;">
                              <h2 style="margin:0 0 8px; color:#4f46e5; font-size:18px;">{{ section.title }}</h2>
                              <div style="color:#374151; font-size:15px; line-height:1.6;">{{ section.content | replace('\n', '<br>') | safe }}</div>
                            </td>
                          </tr>
                        </table>
                        {% endif %}
                        {% endfor %}

                        {% if newsletter.articles %}
                        <!-- Featured Articles grid - Full width -->
                        <h2 style="font-family:Segoe UI,Roboto,Arial,sans-serif; color:#111827; font-size:18px; margin:24px 0 12px;">Featured articles</h2>
                        {% for article in newsletter.articles %}
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px; border:1px solid #eef2f7; border-radius:8px; background:#ffffff;">
                          <tr>
                            {% set img = article.thumbnail_url or article.image_url %}
                            {% if img %}
                            <td width="120" valign="top" style="padding:16px 0 16px 16px;">
                              <a href="{{ article.url }}"><img src="{{ img }}" width="100" height="100" alt="" style="display:block; width:100px; height:100px; object-fit:cover; border-radius:8px;"></a>
                            </td>
                            {% endif %}
                            <td style="padding:16px 20px; font-family:Segoe UI,Roboto,Arial,sans-serif; {% if not img %}padding-left:20px;{% endif %}">
                              <a href="{{ article.url }}" style="color:#1d4ed8; text-decoration:none; font-weight:600; font-size:16px; line-height:1.4;">{{ article.title }}</a>
                              {% if article.summary %}
                                <div style="color:#4b5563; font-size:14px; margin-top:8px; line-height:1.5;">{{ article.summary }}</div>
                              {% endif %}
                              <div style="color:#6b7280; font-size:12px; margin-top:8px;">
                                {{ article.author or 'Unknown' }}{% if article.published_at %} • {{ article.published_at[:10] }}{% endif %}
                              </div>
                            </td>
                          </tr>
                        </table>
                        {% endfor %}
                        {% endif %}

                        <!-- Call to Action - Full width -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef2ff; border-radius:10px; margin-top:24px;">
                          <tr>
                            <td style="padding:20px; font-family:Segoe UI,Roboto,Arial,sans-serif; color:#3730a3; text-align:center;">
                              <div style="font-weight:700; margin-bottom:8px; font-size:16px;">Do more with AI‑Newz</div>
                              <div style="font-size:14px; color:#4338ca; margin-bottom:16px;">Generate, curate, and send in minutes.</div>
                              <div><a href="#" class="btn" style="background:#4338ca;">Try Pro</a></div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding:20px 24px; background:#ffffff; border-top:1px solid #eef2f7; text-align:center; color:#6b7280; font-family:Segoe UI,Roboto,Arial,sans-serif; font-size:12px;">
                        You are receiving this email because you signed up to AI‑Newz.<br>
                        Generated on {{ newsletter.generated_at or 'today' }} · {{ newsletter.tags|join(', ') if newsletter.tags else 'AI, News' }}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </center>
        </body>
        </html>
        """
        
        template = Template(template_str)
        return template.render(newsletter=newsletter)
    
    def _generate_minimal_template(self, newsletter: Dict[str, Any]) -> str:
        """Generate minimal newsletter template"""
        template_str = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>{{ newsletter.subject }}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
            .article { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
            .article:last-child { border-bottom: none; }
            .article-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .article-title a { color: #2563eb; text-decoration: none; }
            .article-summary { color: #666; margin-bottom: 10px; }
            .article-meta { font-size: 12px; color: #999; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e5e9; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>{{ newsletter.subject }}</h1>
            <p>{{ newsletter.opening }}</p>
          </div>
          
          {% for article in newsletter.articles %}
          <div class="article">
            <div class="article-title">
              <a href="{{ article.url }}">{{ article.title }}</a>
            </div>
            <div class="article-summary">{{ article.summary }}</div>
            <div class="article-meta">
              {{ article.author or 'Unknown' }}{% if article.published_at %} • {{ article.published_at[:10] }}{% endif %}
            </div>
          </div>
          {% endfor %}
          
          <div class="footer">
            <p>Generated by AI-Newz • {{ newsletter.tags|join(', ') if newsletter.tags else 'AI, News' }}</p>
          </div>
        </body>
        </html>
        """
        template = Template(template_str)
        return template.render(newsletter=newsletter)
    
    def _generate_classic_template(self, newsletter: Dict[str, Any]) -> str:
        """Generate classic newsletter template"""
        template_str = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>{{ newsletter.subject }}</title>
          <style>
            body { font-family: Georgia, serif; line-height: 1.8; color: #2c3e50; max-width: 700px; margin: 0 auto; padding: 40px 20px; background: #f8f9fa; }
            .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { font-size: 28px; color: #2c3e50; margin-bottom: 10px; }
            .header p { font-size: 16px; color: #7f8c8d; font-style: italic; }
            .section { margin-bottom: 35px; }
            .section h2 { font-size: 22px; color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
            .article { margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-left: 4px solid #3498db; }
            .article-title { font-size: 20px; font-weight: bold; margin-bottom: 12px; }
            .article-title a { color: #2c3e50; text-decoration: none; }
            .article-title a:hover { color: #3498db; }
            .article-summary { color: #555; margin-bottom: 10px; }
            .article-meta { font-size: 14px; color: #7f8c8d; }
            .footer { margin-top: 50px; padding-top: 30px; border-top: 1px solid #ecf0f1; text-align: center; font-size: 14px; color: #7f8c8d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{ newsletter.subject }}</h1>
              <p>{{ newsletter.opening }}</p>
            </div>
            
            {% for section in newsletter.sections %}
            <div class="section">
              <h2>{{ section.title }}</h2>
              <p>{{ section.content | replace('\n', '<br>') | safe }}</p>
            </div>
            {% endfor %}
            
            {% if newsletter.articles %}
            <div class="section">
              <h2>Featured Articles</h2>
              {% for article in newsletter.articles %}
              <div class="article">
                <div class="article-title">
                  <a href="{{ article.url }}">{{ article.title }}</a>
                </div>
                <div class="article-summary">{{ article.summary }}</div>
                <div class="article-meta">
                  {{ article.author or 'Unknown' }}{% if article.published_at %} • {{ article.published_at[:10] }}{% endif %}
                </div>
              </div>
              {% endfor %}
            </div>
            {% endif %}
            
            <div class="footer">
              <p>Generated by AI-Newz • {{ newsletter.tags|join(', ') if newsletter.tags else 'AI, News' }}</p>
            </div>
          </div>
        </body>
        </html>
        """
        template = Template(template_str)
        return template.render(newsletter=newsletter)
    
    def _generate_tech_template(self, newsletter: Dict[str, Any]) -> str:
        """Generate tech-focused newsletter template"""
        template_str = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>{{ newsletter.subject }}</title>
          <style>
            body { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.6; color: #f8f8f2; background: #1e1e1e; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; background: #2d2d2d; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
            .header h1 { font-size: 24px; margin: 0; color: #fff; }
            .header p { margin: 10px 0 0; color: #e0e0e0; }
            .content { padding: 30px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #50fa7b; font-size: 18px; margin-bottom: 15px; border-left: 3px solid #50fa7b; padding-left: 15px; }
            .article { background: #3c3c3c; margin-bottom: 20px; padding: 20px; border-radius: 4px; border-left: 3px solid #ff79c6; }
            .article-title { font-size: 16px; margin-bottom: 10px; }
            .article-title a { color: #8be9fd; text-decoration: none; }
            .article-title a:hover { color: #50fa7b; }
            .article-summary { color: #f8f8f2; margin-bottom: 10px; }
            .article-meta { font-size: 12px; color: #6272a4; }
            .code { background: #1e1e1e; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace; }
            .footer { background: #1e1e1e; padding: 20px; text-align: center; color: #6272a4; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{ newsletter.subject }}</h1>
              <p>{{ newsletter.opening }}</p>
            </div>
            
            <div class="content">
              {% for section in newsletter.sections %}
              <div class="section">
                <h2>{{ section.title }}</h2>
                <div class="code">{{ section.content | replace('\n', '<br>') | safe }}</div>
              </div>
              {% endfor %}
              
              {% if newsletter.articles %}
              <div class="section">
                <h2>// Latest Updates</h2>
                {% for article in newsletter.articles %}
                <div class="article">
                  <div class="article-title">
                    <a href="{{ article.url }}">{{ article.title }}</a>
                  </div>
                  <div class="article-summary">{{ article.summary }}</div>
                  <div class="article-meta">
                    {{ article.author or 'Unknown' }}{% if article.published_at %} • {{ article.published_at[:10] }}{% endif %}
                  </div>
                </div>
                {% endfor %}
              </div>
              {% endif %}
            </div>
            
            <div class="footer">
              <p>Generated by AI-Newz • {{ newsletter.tags|join(', ') if newsletter.tags else 'AI, News' }}</p>
            </div>
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
