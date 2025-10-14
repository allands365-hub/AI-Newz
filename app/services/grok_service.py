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
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert newsletter writer and content curator. Create engaging, informative newsletters that provide value to readers."
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
            }
            
            # Make the API request
            print(f"Making request to: {self.api_url}/chat/completions")
            print(f"Headers: {self.headers}")
            print(f"Payload: {payload}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                
                result = response.json()
                
                # Extract the generated content
                content = result["choices"][0]["message"]["content"]
                
                # Parse the newsletter content
                newsletter_data = self._parse_newsletter_content(content, topic)
                
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
        user_preferences: Optional[Dict],
        curated_articles: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Build a comprehensive prompt for newsletter generation"""
        
        # Length guidelines
        length_guidelines = {
            "short": "Keep it concise (300-500 words)",
            "medium": "Provide good detail (500-800 words)", 
            "long": "Be comprehensive (800-1200 words)"
        }
        
        # Style guidelines
        style_guidelines = {
            "professional": "Use a formal, business-appropriate tone",
            "casual": "Use a friendly, conversational tone",
            "technical": "Use technical language and detailed explanations",
            "creative": "Use engaging, creative language with storytelling elements"
        }
        
        prompt = f"""
Create a newsletter about "{topic}" with the following specifications:

**Style**: {style_guidelines.get(style, 'professional')}
**Length**: {length_guidelines.get(length, 'medium')}

**Structure**:
1. **Compelling Subject Line** - Make it engaging and click-worthy
2. **Opening Hook** - Start with an attention-grabbing introduction
3. **Main Content** - 3-5 key sections covering different aspects of the topic
4. **Trending Insights** - {"Include current trends and insights" if include_trends else "Skip trending content"}
5. **Article Summaries** - {"Include brief summaries of relevant articles" if include_summaries else "Skip article summaries"}
6. **Call to Action** - End with a clear next step for readers

**Content Requirements**:
- Use engaging headlines and subheadings
- Include relevant statistics, quotes, or data points
- Make it scannable with bullet points and short paragraphs
- Ensure the content is accurate and well-researched
- Add a personal touch or unique perspective
- Include actionable insights readers can use

**Format the response as JSON with this structure**:
{{
    "subject": "Newsletter subject line",
    "opening": "Opening paragraph",
    "sections": [
        {{
            "title": "Section title",
            "content": "Section content",
            "type": "main|trend|summary"
        }}
    ],
    "call_to_action": "Call to action text",
    "estimated_read_time": "X minutes",
    "tags": ["tag1", "tag2", "tag3"]
}}

Make sure the newsletter is engaging, informative, and provides real value to readers interested in {topic}.
"""
        
        # Add user preferences if available
        if user_preferences:
            preferred_sources = user_preferences.get('preferred_sources', [])
            content_categories = user_preferences.get('content_categories', [])
            
            if preferred_sources:
                prompt += f"\n**Preferred Sources**: Focus on content from {', '.join(preferred_sources)}"
            if content_categories:
                prompt += f"\n**Content Focus**: Emphasize {', '.join(content_categories)} topics"
        
        # Add curated RSS articles if provided
        if curated_articles:
            prompt += "\n**Curated Articles** (use as sources, summarize succinctly with citations):\n"
            for idx, a in enumerate(curated_articles, start=1):
                title = a.get("title", "")
                url = a.get("url", "")
                summary = a.get("summary", "")
                author = a.get("author", "")
                tags = a.get("tags", [])
                prompt += f"- [{idx}] {title} — {author or 'Unknown author'}\n  Link: {url}\n  Summary: {summary[:300]}{'...' if len(summary) > 300 else ''}\n  Tags: {', '.join(tags) if isinstance(tags, list) else tags}\n"

            prompt += "\nIncorporate the curated articles as a short 'Highlights' or 'From around the web' section with 4-6 bullets including title and 1-2 sentence takeaways, and add inline numeric citations like [1], [2] linking to the URLs.\n"
            
            # Generate title based on RSS content
            prompt += "\n**IMPORTANT: Generate a compelling newsletter title based on the curated articles and main topic. The title should reflect the key themes from the RSS articles while being engaging and click-worthy. Examples: 'Weekly Tech Digest: AI Breakthroughs and Industry Insights' or 'This Week in Innovation: From Quantum Computing to Sustainable Tech'**\n"

        return prompt
    
    def _parse_newsletter_content(self, content: str, topic: str) -> Dict[str, Any]:
        """Parse the generated newsletter content"""
        try:
            # Try to extract JSON from the content
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                json_content = content[json_start:json_end].strip()
            elif "{" in content and "}" in content:
                json_start = content.find("{")
                json_end = content.rfind("}") + 1
                json_content = content[json_start:json_end]
            else:
                # Fallback: create a basic structure
                return {
                    "subject": f"Weekly Update: {topic}",
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
            
            # Clean the JSON content to remove invalid control characters
            import re
            # Remove control characters except newlines and tabs, and fix common issues
            cleaned_json = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', json_content)
            
            # Fix common JSON issues
            # Don't escape newlines/tabs in JSON strings, but clean up the structure
            cleaned_json = cleaned_json.strip()
            
            # Fix single quotes to double quotes
            cleaned_json = re.sub(r"'([^']*)':", r'"\1":', cleaned_json)
            cleaned_json = re.sub(r":\s*'([^']*)'", r': "\1"', cleaned_json)
            
            # Fix various quote and escape issues in JSON
            def fix_json_quotes_and_escapes(text):
                import re
                
                # Step 1: Fix the most common issue - unescaped quotes in string values
                # Pattern to match "key": "value with "quotes" inside"
                def fix_quoted_strings(match):
                    key = match.group(1)
                    value = match.group(2)
                    
                    # Remove any trailing backslashes
                    value = value.rstrip('\\')
                    
                    # Escape all unescaped quotes within the value
                    # Use a more careful approach to avoid double-escaping
                    if '"' in value and not value.startswith('\\"'):
                        # Only escape quotes that aren't already escaped
                        value = re.sub(r'(?<!\\)"', r'\\"', value)
                    
                    return f'"{key}": "{value}"'
                
                # Pattern to match "key": "value" where value might contain unescaped quotes
                # This uses a more specific pattern to catch the exact issue we're seeing
                pattern = r'"([^"]+)":\s*"([^"]*(?:"[^"]*)*)"'
                text = re.sub(pattern, fix_quoted_strings, text)
                
                # Step 2: Fix any remaining issues with the JSON structure
                # Fix cases where quotes appear in the middle of values
                text = re.sub(r'([^\\])"([^":,}])', r'\1\\"\2', text)
                
                # Step 3: Clean up any double-escaped quotes
                text = re.sub(r'\\\\"', r'\\"', text)
                
                # Step 4: Remove trailing backslashes before closing quotes
                text = re.sub(r'\\"$', '"', text)
                text = re.sub(r'\\"(\s*[,}])', r'"\1', text)
                
                return text
            
            cleaned_json = fix_json_quotes_and_escapes(cleaned_json)
            
            # Remove any trailing commas before closing braces/brackets
            cleaned_json = re.sub(r',(\s*[}\]])', r'\1', cleaned_json)
            
            # Fix unquoted keys
            cleaned_json = re.sub(r'(\w+):', r'"\1":', cleaned_json)
            
            # Debug: Log the cleaned JSON for troubleshooting
            logger.info(f"Cleaned JSON content: {cleaned_json[:500]}...")
            
            # Try to parse the JSON
            try:
                newsletter_data = json.loads(cleaned_json)
            except json.JSONDecodeError as e:
                logger.warning(f"JSON parsing failed, trying alternative approach: {e}")
                logger.warning(f"Problematic JSON: {cleaned_json[:200]}...")
                
                # Try to fix common JSON issues
                # First, try to extract just the JSON part if it's wrapped in text
                if '"subject"' in cleaned_json and '"opening"' in cleaned_json:
                    # Find the start and end of the JSON object
                    start_idx = cleaned_json.find('{"subject"')
                    if start_idx != -1:
                        # Find the matching closing brace
                        brace_count = 0
                        end_idx = start_idx
                        for i, char in enumerate(cleaned_json[start_idx:], start_idx):
                            if char == '{':
                                brace_count += 1
                            elif char == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    end_idx = i + 1
                                    break
                        cleaned_json = cleaned_json[start_idx:end_idx]
                
                # Try parsing again
                try:
                    newsletter_data = json.loads(cleaned_json)
                except json.JSONDecodeError:
                    # Last resort: create a fallback structure
                    raise json.JSONDecodeError("Unable to parse JSON", cleaned_json, 0)
            
            # Validate and clean the data
            return {
                "subject": newsletter_data.get("subject", f"Weekly Update: {topic}"),
                "opening": newsletter_data.get("opening", ""),
                "sections": newsletter_data.get("sections", []),
                "call_to_action": newsletter_data.get("call_to_action", ""),
                "estimated_read_time": newsletter_data.get("estimated_read_time", "5 minutes"),
                "tags": newsletter_data.get("tags", [topic.lower().replace(" ", "-")])
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Grok response: {e}")
            # Return a fallback structure
            return {
                "subject": f"Weekly Update: {topic}",
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
        except Exception as e:
            logger.error(f"Error parsing newsletter content: {e}")
            return {
                "subject": f"Weekly Update: {topic}",
                "opening": "An error occurred while generating the newsletter content.",
                "sections": [],
                "call_to_action": "Please try again later.",
                "estimated_read_time": "1 minute",
                "tags": ["error"]
            }
    
    async def generate_newsletter_variations(
        self,
        topic: str,
        num_variations: int = 3
    ) -> List[Dict[str, Any]]:
        """Generate multiple variations of a newsletter for A/B testing"""
        variations = []
        
        styles = ["professional", "casual", "creative"]
        lengths = ["short", "medium", "long"]
        
        for i in range(min(num_variations, 3)):
            style = styles[i % len(styles)]
            length = lengths[i % len(lengths)]
            
            result = await self.generate_newsletter(
                topic=topic,
                style=style,
                length=length,
                include_trends=True,
                include_summaries=True
            )
            
            if result["success"]:
                result["variation_id"] = i + 1
                result["style"] = style
                result["length"] = length
                variations.append(result)
        
        return variations
