import httpx
import json
import logging
from typing import Dict, List, Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class GrokService:
    """Service for interacting with Grok AI API for newsletter generation"""
    
    def __init__(self):
        self.api_key = settings.GROK_API_KEY
        self.api_url = settings.GROK_API_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Debug: Print API key (first 10 chars for security)
        print(f"Grok API Key: {self.api_key[:10]}...")
        print(f"Grok API URL: {self.api_url}")
    
    async def generate_newsletter(
        self,
        topic: str,
        style: str = "professional",
        length: str = "medium",
        include_trends: bool = True,
        include_summaries: bool = True,
        user_preferences: Optional[Dict] = None,
        curated_articles: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate an AI-powered newsletter using Grok
        
        Args:
            topic: Main topic for the newsletter
            style: Writing style (professional, casual, technical, creative)
            length: Newsletter length (short, medium, long)
            include_trends: Whether to include trending topics
            include_summaries: Whether to include article summaries
            user_preferences: User's content preferences
        
        Returns:
            Dictionary containing the generated newsletter content
        """
        try:
            # Build the prompt based on parameters
            prompt = self._build_newsletter_prompt(
                topic, style, length, include_trends, 
                include_summaries, user_preferences, curated_articles
            )
            
            # Prepare the request payload
            # Try without JSON mode first, as it seems to not be working properly
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert newsletter writer and content curator. Create engaging, informative newsletters that provide value to readers. CRITICAL: Return ONLY valid JSON. Never use quotes within string values - use alternatives like Revolution instead of 'Revolution'. Use single quotes for emphasis only when absolutely necessary."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 4000,
                "top_p": 0.9,
                "stream": False
                # Removed response_format as it's not working properly
            }
            
            # Make the API request
            # Debug logs with masked credentials
            masked_headers = {**self.headers}
            if "Authorization" in masked_headers:
                masked_headers["Authorization"] = f"Bearer {self.api_key[:10]}***"
            
            print(f"Making request to: {self.api_url}")
            print(f"Headers: {masked_headers}")
            print(f"Payload: {payload}")
        
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
            
            result = response.json()
            
            # Extract the generated content
            content = result["choices"][0]["message"]["content"]
            
            # Parse the newsletter content
            newsletter_data = self._parse_newsletter_content(content, topic, curated_articles)
            
            # Add curated articles to the newsletter data if available
            if curated_articles:
                newsletter_data["articles"] = curated_articles
            
            return {
                "success": True,
                "newsletter": newsletter_data,
                "raw_content": content,
                "model_used": result.get("model", "llama-3.1-70b-versatile"),
                "tokens_used": result.get("usage", {}).get("total_tokens", 0)
            }
            
        except httpx.TimeoutException:
            logger.error("Grok API request timed out")
            return {
                "success": False,
                "error": "Request timed out. Please try again.",
                "error_type": "timeout"
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"Grok API HTTP error: {e.response.status_code}")
            return {
                "success": False,
                "error": f"API request failed with status {e.response.status_code}",
                "error_type": "http_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in Grok service: {e}")
            return {
                "success": False,
                "error": "An unexpected error occurred while generating the newsletter",
                "error_type": "unknown"
            }
    
    def _build_newsletter_prompt(
        self,
        topic: str,
        style: str,
        length: str,
        include_trends: bool,
        include_summaries: bool,
        user_preferences: Optional[Dict] = None,
        curated_articles: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Build the prompt for newsletter generation"""
        
        # Style descriptions
        style_descriptions = {
            "professional": "Use a formal, business-appropriate tone",
            "casual": "Use a friendly, conversational tone",
            "technical": "Use technical language and detailed explanations",
            "creative": "Use engaging, creative language with storytelling"
        }
        
        # Length descriptions
        length_descriptions = {
            "short": "Keep it concise (300-500 words)",
            "medium": "Provide good detail (500-800 words)", 
            "long": "Be comprehensive (800-1200 words)"
        }
        
        prompt = f"""
Create a newsletter about "{topic}" with the following specifications:

**Style**: {style_descriptions.get(style, 'Use a professional tone')}
**Length**: {length_descriptions.get(length, 'Provide good detail (500-800 words)')}

**Structure**:
1. **Compelling Subject Line** - Make it engaging and click-worthy
2. **Opening Hook** - Start with an attention-grabbing introduction
3. **Main Content** - 3-5 key sections covering different aspects of the topic
4. **Trending Insights** - Include current trends and insights
5. **Article Summaries** - Include brief summaries of relevant articles
6. **Call to Action** - End with a clear next step for readers

**Content Requirements**:
- Use engaging headlines and subheadings
- Include relevant statistics, quotes, or data points
- Make it scannable with bullet points and short paragraphs
- Ensure the content is accurate and well-researched
- Add a personal touch or unique perspective
- Include actionable insights readers can use

**Format the response using this structured format**:
SUBJECT: Newsletter subject line
TOPIC: Generated topic based on article content (more specific than input)
OPENING: Opening paragraph
SECTIONS:
- TITLE: Section title
  CONTENT: Section content
  TYPE: main|trend|summary
- TITLE: Another section title
  CONTENT: Another section content
  TYPE: main|trend|summary
CALL_TO_ACTION: Call to action text
ESTIMATED_READ_TIME: X minutes
TAGS: tag1, tag2, tag3

**IMPORTANT FORMAT RULES**:
- Use the exact format above with colons and dashes
- Do NOT use quotes anywhere in the content
- Use alternatives like Revolution instead of "Revolution"
- Use single quotes for emphasis: 'Revolution' not "Revolution"
- Use italics for emphasis: *Revolution* not "Revolution"
- Use bold for emphasis: **Revolution** not "Revolution"
- Keep content on single lines when possible
- Use dashes (-) to separate multiple sections

Make sure the newsletter is engaging, informative, and provides real value to readers interested in {topic}.
"""
        
        # Add user preferences if available
        if user_preferences:
            prompt += f"\n**User Preferences**: {user_preferences}\n"
        
        # Add curated articles if available
        if curated_articles and len(curated_articles) > 0:
            prompt += "\n**Curated Articles** (use as sources, summarize succinctly with citations):\n"
            for i, article in enumerate(curated_articles[:6], 1):  # Limit to 6 articles
                title = article.get('title', 'Untitled')
                url = article.get('url', '')
                summary = article.get('summary', 'No summary available')
                author = article.get('author', 'Unknown author')
                tags = article.get('tags', [])
                
                prompt += f"- [{i}] {title} – {author}\n"
                prompt += f"  Link: {url}\n"
                prompt += f"  Summary: {summary}\n"
                if tags:
                    prompt += f"  Tags: {', '.join(tags[:5])}\n"  # Limit to 5 tags
                prompt += "\n"
            
            prompt += "Incorporate the curated articles as a short 'Highlights' or 'From around the web' section with 4-6 bullets including title and 1-2 sentence takeaways, and add inline numeric citations like [1], [2] linking to the URLs.\n"
            
            # Add specific instruction for topic generation
            prompt += "\n**IMPORTANT: Generate a compelling newsletter title based on the curated articles and main topic. The title should reflect the key themes from the RSS articles while being engaging and click-worthy. Examples: 'Weekly Tech Digest: AI Breakthroughs and Industry Insights' or 'This Week in Innovation: From Quantum Computing to Sustainable Tech'**\n"
            
            # Add specific instruction for topic generation
            prompt += "\n**TOPIC GENERATION: Based on the curated articles, generate a dynamic topic that captures the essence of the content. The topic should be more specific and engaging than the original input, incorporating themes from the actual articles. For example, if articles are about AI breakthroughs, quantum computing, and sustainable tech, generate a topic like 'AI Revolution: Quantum Leaps and Green Innovation' instead of just 'AI Trends'.**\n"

        return prompt
    
    def _parse_newsletter_content(self, content: str, topic: str, curated_articles: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Parse the generated newsletter content using structured format"""
        try:
            # Parse the structured text format
            newsletter_data = self._parse_structured_response(content)
            
            # Add articles if available
            if curated_articles:
                newsletter_data["articles"] = curated_articles
            
            return newsletter_data
            
        except Exception as e:
            logger.warning(f"Structured parsing failed: {e}")
            # Fallback: create a basic structure
            newsletter_data = {
                    "subject": f"Weekly Update: {topic}",
                    "topic": topic,  # Use original topic as fallback
                    "opening": content[:200] + "..." if len(content) > 200 else content,
                    "sections": [
                        {
                            "title": "Main Content",
                            "content": content,
                            "type": "main"
                        }
                    ],
                    "call_to_action": "Stay tuned for more updates!",
                    "estimated_read_time": "5 minutes",
                    "tags": [topic.lower().replace(" ", "-")]
                }
                
                # Add articles if available
                if curated_articles:
                    newsletter_data["articles"] = curated_articles
                
                return newsletter_data
            
    def _parse_structured_response(self, content: str) -> Dict[str, Any]:
        """Parse structured text response into newsletter data"""
                import re
                
        # Initialize the newsletter data structure
        newsletter_data = {
            "subject": "",
            "topic": "",
            "opening": "",
            "sections": [],
            "call_to_action": "",
            "estimated_read_time": "5 minutes",
            "tags": []
        }
        
        # Split content into lines
        lines = content.split('\n')
        
        current_section = None
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            # Parse SUBJECT
            if line.startswith('SUBJECT:'):
                newsletter_data["subject"] = line[8:].strip()
            
            # Parse TOPIC
            elif line.startswith('TOPIC:'):
                newsletter_data["topic"] = line[6:].strip()
            
            # Parse OPENING
            elif line.startswith('OPENING:'):
                newsletter_data["opening"] = line[8:].strip()
            
            # Parse SECTIONS
            elif line.startswith('SECTIONS:'):
                # Look for section entries starting with "- TITLE:"
                i += 1
                while i < len(lines):
                    line = lines[i].strip()
                    if line.startswith('- TITLE:'):
                        # Start of a new section
                        if current_section:
                            newsletter_data["sections"].append(current_section)
                        
                        current_section = {
                            "title": line[8:].strip(),
                            "content": "",
                            "type": "main"
                        }
                    elif line.startswith('CONTENT:'):
                        if current_section:
                            current_section["content"] = line[8:].strip()
                    elif line.startswith('TYPE:'):
                        if current_section:
                            current_section["type"] = line[5:].strip()
                    elif line.startswith('-') and not line.startswith('- TITLE:'):
                        # Another section starting
                        if current_section:
                            newsletter_data["sections"].append(current_section)
                        current_section = {
                            "title": line[1:].strip(),
                            "content": "",
                            "type": "main"
                        }
                    elif line and not line.startswith(' ') and not line.startswith('\t'):
                        # End of sections, move to next field
                        break
                    i += 1
                
                # Add the last section if it exists
                if current_section:
                    newsletter_data["sections"].append(current_section)
                continue
            
            # Parse CALL_TO_ACTION
            elif line.startswith('CALL_TO_ACTION:'):
                newsletter_data["call_to_action"] = line[15:].strip()
            
            # Parse ESTIMATED_READ_TIME
            elif line.startswith('ESTIMATED_READ_TIME:'):
                newsletter_data["estimated_read_time"] = line[20:].strip()
            
            # Parse TAGS
            elif line.startswith('TAGS:'):
                tags_str = line[5:].strip()
                if tags_str:
                    newsletter_data["tags"] = [tag.strip() for tag in tags_str.split(',')]
            
            i += 1
        
        # Ensure we have at least one section
        if not newsletter_data["sections"]:
            newsletter_data["sections"] = [{
                                "title": "Main Content",
                "content": newsletter_data["opening"] or "Content not available",
                                "type": "main"
            }]
        
        # Set defaults for missing fields
        if not newsletter_data["subject"]:
            newsletter_data["subject"] = "Weekly Newsletter Update"
        if not newsletter_data["topic"]:
            newsletter_data["topic"] = "Technology and Innovation"
        if not newsletter_data["opening"]:
            newsletter_data["opening"] = "Welcome to this week's newsletter update."
        if not newsletter_data["call_to_action"]:
            newsletter_data["call_to_action"] = "Stay tuned for more updates!"
        
        return newsletter_data
    
    def _create_dynamic_fallback_newsletter(self, topic: str, curated_articles: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Create a dynamic fallback newsletter based on actual articles and topic"""
        # Generate a dynamic subject based on articles
        if curated_articles and len(curated_articles) > 0:
            # Extract key themes from article titles
            themes = []
            for article in curated_articles[:3]:  # Use first 3 articles
                title = article.get('title', '')
                if 'AI' in title or 'artificial intelligence' in title.lower():
                    themes.append('AI')
                elif 'tech' in title.lower() or 'technology' in title.lower():
                    themes.append('Technology')
                elif 'business' in title.lower():
                    themes.append('Business')
                elif 'startup' in title.lower():
                    themes.append('Startups')
                elif 'data' in title.lower():
                    themes.append('Data')
            
            # Create subject based on themes
            if themes:
                unique_themes = list(set(themes))[:2]  # Max 2 themes
                if len(unique_themes) == 1:
                    subject = f"This Week in {unique_themes[0]}: Key Updates and Insights"
                else:
                    subject = f"This Week in {unique_themes[0]} and {unique_themes[1]}: Key Updates and Insights"
            else:
                subject = f"This Week in {topic}: Key Updates and Insights"
        else:
            subject = f"Weekly Update: {topic}"
        
        # Create dynamic opening based on articles
        if curated_articles and len(curated_articles) > 0:
            article_count = len(curated_articles)
            opening = f"This week brings {article_count} compelling stories from across the tech landscape. From breakthrough innovations to industry insights, we've curated the most impactful developments for you."
        else:
            opening = f"Welcome to this week's update on {topic}. We've gathered the most important developments and insights to keep you informed."
        
        # Create sections based on articles
        sections = []
        
        # Main content section
        if curated_articles and len(curated_articles) > 0:
            article_titles = [article.get('title', 'Untitled') for article in curated_articles[:3]]
            main_content = f"This week's highlights include {len(curated_articles)} key stories that showcase the rapid evolution of technology and its impact on our daily lives. From {article_titles[0]}... to {article_titles[-1] if len(article_titles) > 1 else 'other important developments'}, the breadth of innovation continues to amaze."
        else:
            main_content = f"Here's what's happening in the world of {topic} this week. We've identified key trends and developments that are shaping the industry."
        
        sections.append({
                        "title": "Main Content",
            "content": main_content,
                        "type": "main"
        })
        
        # Trending insights section
        if curated_articles and len(curated_articles) > 0:
            article_titles = [article.get('title', 'Untitled') for article in curated_articles[:3]]
            trends_content = f"Key trends emerging this week include: • {article_titles[0]} • {article_titles[1] if len(article_titles) > 1 else 'Continued innovation in the field'} • {article_titles[2] if len(article_titles) > 2 else 'Industry developments'}"
        else:
            trends_content = f"Key trends in {topic} continue to evolve, with new developments emerging regularly."
        
        sections.append({
            "title": "Trending Insights",
            "content": trends_content,
            "type": "trend"
        })
        
        # Call to action
        call_to_action = f"Explore these {len(curated_articles) if curated_articles else 'key'} stories in detail and stay ahead of the curve with the latest insights."
        
        # Generate tags based on content
        tags = [topic.lower().replace(" ", "-"), "weekly-update", "tech-news"]
        if curated_articles:
            # Extract tags from articles
            all_tags = []
            for article in curated_articles[:3]:
                article_tags = article.get('tags', [])
                if isinstance(article_tags, list):
                    all_tags.extend(article_tags[:2])  # Max 2 tags per article
            
            # Add unique tags
            unique_tags = list(set(all_tags))[:3]
            tags.extend(unique_tags)
        
        return {
            "subject": subject,
            "topic": topic,
            "opening": opening,
            "sections": sections,
            "call_to_action": call_to_action,
            "estimated_read_time": "5 minutes",
            "tags": tags
        }
