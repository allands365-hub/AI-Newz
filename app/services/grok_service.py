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
    "topic": "Generated topic based on article content (more specific than input)",
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
            
            # Add specific instruction for topic generation
            prompt += "\n**TOPIC GENERATION: Based on the curated articles, generate a dynamic topic that captures the essence of the content. The topic should be more specific and engaging than the original input, incorporating themes from the actual articles. For example, if articles are about AI breakthroughs, quantum computing, and sustainable tech, generate a topic like 'AI Revolution: Quantum Leaps and Green Innovation' instead of just 'AI Trends'.**\n"

        return prompt
    
    def _parse_newsletter_content(self, content: str, topic: str, curated_articles: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
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
                
                # Step 1: Use a more robust approach to fix JSON with unescaped quotes
                # We'll manually parse and fix the JSON structure
                
                # First, let's try to find the start and end of the JSON object
                start_idx = text.find('{')
                if start_idx == -1:
                    return text
                
                # Find the matching closing brace
                brace_count = 0
                end_idx = start_idx
                for i, char in enumerate(text[start_idx:], start_idx):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end_idx = i + 1
                            break
                
                json_part = text[start_idx:end_idx]
                
                # Now let's fix the quotes in the JSON part using a more sophisticated approach
                # We'll use a simple state machine to parse and fix the JSON
                
                # Simple approach: find all quoted strings and fix them
                def fix_quoted_strings(match):
                    full_match = match.group(0)
                    # Extract the content between quotes
                    content = full_match[1:-1]  # Remove the outer quotes
                    
                    # Escape all unescaped quotes within the content
                    if '"' in content:
                        # Only escape quotes that aren't already escaped
                        content = re.sub(r'(?<!\\)"', r'\\"', content)
                    
                    return f'"{content}"'
                
                # Pattern to match quoted strings
                pattern = r'"[^"]*(?:"[^"]*)*"'
                json_part = re.sub(pattern, fix_quoted_strings, json_part)
                
                # Replace the original JSON part with the fixed one
                return text[:start_idx] + json_part + text[end_idx:]
            
            cleaned_json = fix_json_quotes_and_escapes(cleaned_json)
            
            # Remove any trailing commas before closing braces/brackets
            cleaned_json = re.sub(r',(\s*[}\]])', r'\1', cleaned_json)
            
            # Remove control characters that can break JSON parsing
            import unicodedata
            cleaned_json = ''.join(char for char in cleaned_json if unicodedata.category(char)[0] != 'C' or char in '\n\r\t')
            
            # Fix unquoted keys
            cleaned_json = re.sub(r'(\w+):', r'"\1":', cleaned_json)
            
            # Additional fix for malformed JSON with escaped quotes
            # Fix patterns like "subject\": \"value\"" to "subject": "value"
            cleaned_json = re.sub(r'"([^"]+)\\\":\s*\\"([^"]+)\\"', r'"\1": "\2"', cleaned_json)
            
            # Fix any remaining escaped quotes in values
            cleaned_json = re.sub(r'\\"([^"]+)\\"', r'"\1"', cleaned_json)
            
            # More comprehensive fix for the specific pattern we're seeing
            # Fix "key\": \"value\"" patterns
            cleaned_json = re.sub(r'"([^"]+)\\\":\s*\\"([^"]*?)\\"', r'"\1": "\2"', cleaned_json)
            
            # Fix patterns like "subject\": \"Tech "Trends": AI" -> "subject": "Tech Trends: AI"
            cleaned_json = re.sub(r'"([^"]+)\\\":\s*\\"([^"]*?)\\"([^"]*?)\\"', r'"\1": "\2\3"', cleaned_json)
            
            # Fix any remaining \" patterns
            cleaned_json = cleaned_json.replace('\\"', '"')
            
            # Fix any remaining escaped quotes in keys
            cleaned_json = re.sub(r'\\"([^"]+)\\"\s*:', r'"\1":', cleaned_json)
            
            # Fix any remaining escaped quotes in values
            cleaned_json = re.sub(r':\s*\\"([^"]*?)\\"', r': "\1"', cleaned_json)
            
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
                    # Last resort: create a fallback structure with articles
                    logger.warning("Creating fallback newsletter structure due to JSON parsing failure")
                    newsletter_data = {
                        "subject": "Weekly Update:",
                        "topic": "Technology Trends",
                        "opening": "As we navigate the ever-changing landscape of technology, it's clear that artificial intelligence (AI) is revolutionizing industries and redefining the way we work.",
                        "sections": [
                            {
                                "title": "Main Content",
                                "content": "As we navigate the ever-changing landscape of technology, it's clear that artificial intelligence (AI) is revolutionizing industries and redefining the way we work.",
                                "type": "main"
                            }
                        ],
                        "call_to_action": "Stay tuned for more updates!",
                        "estimated_read_time": "5 minutes",
                        "tags": [""]
                    }
                    
                    # Add articles if available
                    if curated_articles:
                        newsletter_data["articles"] = curated_articles
            
            # Check if any fields are themselves JSON strings (nested JSON)
            # This can happen if the API double-encodes the response
            logger.info(f"Checking for nested JSON in newsletter_data: {type(newsletter_data)}")
            
            for field in ["opening", "call_to_action", "subject"]:
                if isinstance(newsletter_data.get(field), str):
                    field_value = newsletter_data[field].strip()
                    logger.info(f"Field {field} value: {field_value[:100]}...")
                    if field_value.startswith('{') and field_value.endswith('}'):
                        try:
                            # Try to parse it as JSON
                            parsed = json.loads(field_value)
                            logger.info(f"Successfully parsed {field} as JSON: {type(parsed)}")
                            # If it's a dict with the same structure, use the nested value
                            if isinstance(parsed, dict) and "opening" in parsed and "sections" in parsed:
                                logger.warning(f"Detected nested JSON in {field}, extracting correct value")
                                newsletter_data = parsed
                                break
                        except Exception as e:
                            logger.warning(f"Failed to parse {field} as JSON: {e}")
                            pass  # Not nested JSON, keep as is
            
            # Additional check: if the entire response is a JSON string, parse it
            if isinstance(newsletter_data, str):
                try:
                    parsed = json.loads(newsletter_data)
                    if isinstance(parsed, dict) and "opening" in parsed and "sections" in parsed:
                        logger.warning("Detected entire response as JSON string, parsing it")
                        newsletter_data = parsed
                except Exception as e:
                    logger.warning(f"Failed to parse entire response as JSON: {e}")
                    pass  # Not JSON, keep as is
            
            # Final check: if opening field contains the entire newsletter as JSON string
            if isinstance(newsletter_data.get("opening"), str):
                opening_value = newsletter_data["opening"].strip()
                if opening_value.startswith('{') and '"sections"' in opening_value:
                    try:
                        # Try to parse the opening field as JSON
                        parsed = json.loads(opening_value)
                        if isinstance(parsed, dict) and "opening" in parsed and "sections" in parsed:
                            logger.warning("Detected entire newsletter in opening field, extracting correct structure")
                            newsletter_data = parsed
                    except Exception as e:
                        logger.warning(f"Failed to parse opening field as newsletter JSON: {e}")
                        # Try to clean and parse again
                        try:
                            # Apply the same cleaning logic to the opening field
                            cleaned_opening = fix_json_quotes_and_escapes(opening_value)
                            parsed = json.loads(cleaned_opening)
                            if isinstance(parsed, dict) and "opening" in parsed and "sections" in parsed:
                                logger.warning("Successfully parsed opening field after cleaning")
                                newsletter_data = parsed
                        except Exception as e2:
                            logger.warning(f"Failed to parse opening field even after cleaning: {e2}")
                            pass
            
            # Validate and clean the data
            return {
                "subject": newsletter_data.get("subject", f"Weekly Update: {topic}"),
                "topic": newsletter_data.get("topic", topic),  # Generated topic based on articles
                "opening": newsletter_data.get("opening", ""),
                "sections": newsletter_data.get("sections", []),
                "call_to_action": newsletter_data.get("call_to_action", ""),
                "estimated_read_time": newsletter_data.get("estimated_read_time", "5 minutes"),
                "tags": newsletter_data.get("tags", [topic.lower().replace(" ", "-")])
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Grok response: {e}")
            # Try to extract meaningful content from the raw response
            # Look for common patterns in the content
            opening_text = ""
            if "opening" in content.lower():
                # Try to extract text after "opening"
                import re
                opening_match = re.search(r'"opening":\s*"([^"]*)"', content, re.IGNORECASE)
                if opening_match:
                    opening_text = opening_match.group(1)
            
            if not opening_text:
                # Fallback to first 200 characters, but clean them
                opening_text = content[:200].replace('"', '').replace('{', '').replace('}', '')
                if len(content) > 200:
                    opening_text += "..."
            
            newsletter_data = {
                "subject": f"Weekly Update: {topic}",
                "topic": topic,  # Use original topic as fallback
                "opening": opening_text,
                "sections": [
                    {
                        "title": "Main Content",
                        "content": opening_text,
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
        except Exception as e:
            logger.error(f"Error parsing newsletter content: {e}")
            newsletter_data = {
                "subject": f"Weekly Update: {topic}",
                "topic": topic,  # Use original topic as fallback
                "opening": "An error occurred while generating the newsletter content.",
                "sections": [
                    {
                        "title": "Error",
                        "content": "An error occurred while generating the newsletter content. Please try again later.",
                        "type": "main"
                    }
                ],
                "call_to_action": "Please try again later.",
                "estimated_read_time": "1 minute",
                "tags": ["error"]
            }
            
            # Add articles if available
            if curated_articles:
                newsletter_data["articles"] = curated_articles
            
            return newsletter_data
    
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
