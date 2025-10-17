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
            try:
                masked_headers = {**self.headers}
                if "Authorization" in masked_headers and isinstance(masked_headers["Authorization"], str):
                    token = masked_headers["Authorization"]
                    # keep prefix, mask token body
                    if token.lower().startswith("bearer "):
                        bearer, key = token.split(" ", 1)
                        masked_headers["Authorization"] = f"{bearer} {key[:6]}***"
                    else:
                        masked_headers["Authorization"] = "***"
                print(f"Making request to: {self.api_url}/chat/completions")
                print(f"Headers: {masked_headers}")
                print(f"Payload: {payload}")
            except Exception:
                # Never allow debug printing to break the request
                pass
            
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
            
            # Remove control characters that can break JSON parsing
            import unicodedata
            cleaned_json = ''.join(char for char in cleaned_json if unicodedata.category(char)[0] != 'C' or char in '\n\r\t')
            
            # Fix unquoted keys
            cleaned_json = re.sub(r'(\w+):', r'"\1":', cleaned_json)
            
            # Fix the specific pattern we're seeing: "subject": "AI "Revolution": ..."
            # This handles unescaped quotes within JSON string values
            def fix_unescaped_quotes_in_values(text):
                import re
                # Pattern to match: "key": "value with "quotes" inside"
                def fix_string_value(match):
                    key = match.group(1)
                    value = match.group(2)
                    # Escape any unescaped quotes within the value
                    value = value.replace('"', '\\"')
                    return f'"{key}": "{value}"'
                
                # Match JSON key-value pairs where the value contains unescaped quotes
                pattern = r'"([^"]+)":\s*"([^"]*"[^"]*)"'
                return re.sub(pattern, fix_string_value, text)
            
            cleaned_json = fix_unescaped_quotes_in_values(cleaned_json)
            
            # Additional fix for malformed JSON with escaped quotes
            # Fix the specific pattern we're seeing: "subject": "Revolutionizing "Business": The Power..."
            # This handles unescaped quotes within JSON string values
            def fix_unescaped_quotes_in_strings(text):
                import re
                # Pattern to match JSON string values that contain unescaped quotes
                # Matches: "key": "value with "quotes" inside"
                def fix_string_value(match):
                    key = match.group(1)
                    value = match.group(2)
                    # Escape any unescaped quotes within the value
                    value = value.replace('"', '\\"')
                    return f'"{key}": "{value}"'
                
                # Match JSON key-value pairs where the value contains unescaped quotes
                pattern = r'"([^"]+)":\s*"([^"]*"[^"]*)"'
                return re.sub(pattern, fix_string_value, text)
            
            cleaned_json = fix_unescaped_quotes_in_strings(cleaned_json)
            
            # Fix patterns like "subject\": \"value\"" to "subject": "value"
            # Comprehensive JSON fixing for all Grok malformed patterns
            def fix_all_grok_json_issues(text):
                import re
                
                # First, let's try a more aggressive approach based on research findings
                # Pattern to detect and fix unescaped quotes within JSON string values
                # This is based on the StackOverflow solution for malformed JSON
                
                # Step 1: Fix the most common pattern - quotes within string values
                # Pattern: "key": "value with "quotes" inside" -> "key": "value with \"quotes\" inside"
                def fix_unescaped_quotes_in_strings(text):
                    # Find all string values and fix quotes within them
                    def fix_string_value(match):
                        key = match.group(1)
                        value = match.group(2)
                        # Escape any unescaped quotes within the value
                        # But be careful not to escape already escaped quotes
                        value = re.sub(r'(?<!\\)"', r'\\"', value)
                        return f'"{key}": "{value}"'
                    
                    # Match: "key": "value with "quotes" inside"
                    pattern = r'"([^"]+)":\s*"([^"]*"[^"]*)"'
                    return re.sub(pattern, fix_string_value, text)
                
                text = fix_unescaped_quotes_in_strings(text)
                
                # Step 2: Fix escaped key patterns
                # Pattern: "key\": \"value\" -> "key": "value"
                text = re.sub(r'"([^"]+)\\\":\s*\\"([^"]*)\\"', r'"\1": "\2"', text)
                
                # Step 3: Fix the specific pattern we're seeing in logs
                # Pattern: "subject": "Revolutionizing \"Tech": AI, AR..." -> "subject": "Revolutionizing \"Tech\": AI, AR..."
                def fix_quote_colon_in_value(match):
                    key = match.group(1)
                    value = match.group(2)
                    # Fix quotes followed by colons within values
                    value = re.sub(r'"([^"]*):', r'\\"\1:', value)
                    return f'"{key}": "{value}"'
                
                text = re.sub(r'"([^"]+)":\s*"([^"]*"[^"]*:[^"]*)"', fix_quote_colon_in_value, text)
                
                # Step 4: Fix any remaining escaped quote patterns in keys
                text = re.sub(r'\\"([^"]+)\\"\s*:', r'"\1":', text)
                
                # Step 5: Fix any remaining escaped quote patterns in values
                text = re.sub(r':\s*\\"([^"]*?)\\"', r': "\1"', text)
                
                # Step 6: Final cleanup - fix any remaining unescaped quotes in values
                def final_quote_cleanup(match):
                    key = match.group(1)
                    value = match.group(2)
                    # Escape any remaining unescaped quotes
                    value = re.sub(r'(?<!\\)"', r'\\"', value)
                    return f'"{key}": "{value}"'
                
                text = re.sub(r'"([^"]+)":\s*"([^"]*"[^"]*)"', final_quote_cleanup, text)
                
                return text
            
            cleaned_json = fix_all_grok_json_issues(cleaned_json)
            
            # Keep escaped quotes intact; do not unescape already escaped quotes.
            # At this point, previous steps have attempted to escape any unescaped quotes
            # inside JSON string values. We intentionally avoid any further unescaping to
            # prevent introducing invalid JSON (e.g., AI "Revolution" remains escaped).
            
            # Fix any remaining escaped quotes in keys
            cleaned_json = re.sub(r'\\"([^"]+)\\"\s*:', r'"\1":', cleaned_json)
            
            # Fix any remaining escaped quotes in values
            cleaned_json = re.sub(r':\s*\\"([^"]*?)\\"', r': "\1"', cleaned_json)
            
            # Debug: Log the cleaned JSON for troubleshooting
            logger.info(f"Cleaned JSON content: {cleaned_json[:500]}...")
            
            # Additional validation: check for common JSON issues
            if cleaned_json.count('{') != cleaned_json.count('}'):
                logger.warning("Mismatched braces in JSON, attempting to fix")
                # Try to balance braces
                open_braces = cleaned_json.count('{')
                close_braces = cleaned_json.count('}')
                if open_braces > close_braces:
                    cleaned_json += '}' * (open_braces - close_braces)
                elif close_braces > open_braces:
                    # Remove excess closing braces from the end
                    for _ in range(close_braces - open_braces):
                        cleaned_json = cleaned_json.rstrip().rstrip('}')
            
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
                    newsletter_data = self._create_dynamic_fallback_newsletter(topic, curated_articles)
                    
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
                elif 'innovation' in title.lower():
                    themes.append('Innovation')
            
            if themes:
                unique_themes = list(set(themes))
                if len(unique_themes) == 1:
                    subject = f"This Week in {unique_themes[0]}: Key Updates and Insights"
                else:
                    subject = f"Weekly Digest: {', '.join(unique_themes[:2])} and More"
            else:
                subject = f"Weekly Update: {topic}"
        else:
            subject = f"Weekly Update: {topic}"
        
        # Generate dynamic opening based on articles
        if curated_articles and len(curated_articles) > 0:
            article_count = len(curated_articles)
            opening = f"This week brings {article_count} compelling stories from across the tech landscape. From breakthrough innovations to industry insights, we've curated the most impactful developments for you."
        else:
            opening = f"Welcome to this week's update on {topic}. Here are the latest developments and insights."
        
        # Generate dynamic sections based on articles
        sections = []
        
        # Main content section
        if curated_articles and len(curated_articles) > 0:
            main_content = f"This week's highlights include {len(curated_articles)} key stories that showcase the rapid evolution of technology and its impact on our daily lives. "
            if len(curated_articles) >= 3:
                main_content += f"From {curated_articles[0].get('title', 'latest developments')[:50]}... to {curated_articles[-1].get('title', 'emerging trends')[:50]}..., the breadth of innovation continues to amaze."
            else:
                main_content += "The stories we've selected represent the cutting edge of technological advancement."
        else:
            main_content = f"Today we're exploring the latest trends and developments in {topic}. The landscape continues to evolve rapidly, bringing new opportunities and challenges."
        
        sections.append({
            "title": "Main Content",
            "content": main_content,
            "type": "main"
        })
        
        # Add trending insights if we have articles
        if curated_articles and len(curated_articles) > 0:
            trending_content = "Key trends emerging this week include: "
            trends = []
            for article in curated_articles[:3]:
                title = article.get('title', '')
                if len(title) > 50:
                    title = title[:47] + "..."
                trends.append(f"• {title}")
            trending_content += " ".join(trends)
            
            sections.append({
                "title": "Trending Insights",
                "content": trending_content,
                "type": "trend"
            })
        
        # Generate dynamic call to action
        if curated_articles and len(curated_articles) > 0:
            cta = f"Explore these {len(curated_articles)} stories in detail and stay ahead of the curve with the latest insights."
        else:
            cta = "Stay tuned for more updates and insights!"
        
        return {
            "subject": subject,
            "topic": topic,
            "opening": opening,
            "sections": sections,
            "call_to_action": cta,
            "estimated_read_time": f"{max(3, len(curated_articles) if curated_articles else 3)} minutes",
            "tags": [topic.lower().replace(" ", "-"), "weekly-update", "tech-news"]
        }
