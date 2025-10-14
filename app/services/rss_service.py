import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import feedparser
import httpx
from bs4 import BeautifulSoup
import textstat
from dateutil import parser as date_parser
import re
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func

from app.models.rss_source import RSSSource
from app.models.article import Article
from app.schemas.rss import RSSSourceCreate, ContentFilter, ArticleSearchRequest
from app.core.config import settings

logger = logging.getLogger(__name__)


class RSSService:
    """Service for RSS feed parsing and content processing"""
    
    def __init__(self):
        self.session = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,  # Automatically follow redirects
            max_redirects=10  # Allow up to 10 redirects
        )
        self.user_agent = "AI-Newz RSS Parser/1.0"
    
    async def fetch_rss_feed(self, url: str) -> Optional[Dict[str, Any]]:
        """Fetch and parse RSS feed from URL"""
        try:
            headers = {"User-Agent": self.user_agent}
            logger.info(f"Fetching RSS feed: {url}")
            
            response = await self.session.get(url, headers=headers)
            response.raise_for_status()
            
            # Log if redirects were followed
            if response.history:
                redirect_urls = [r.url for r in response.history]
                logger.info(f"Followed redirects for {url}: {redirect_urls}")
            
            # Parse RSS feed
            feed = feedparser.parse(response.content)
            
            if feed.bozo:
                logger.warning(f"RSS feed parsing warnings for {url}: {feed.bozo_exception}")
            
            entries_count = len(feed.entries) if feed.entries else 0
            logger.info(f"Successfully parsed {url}: {entries_count} entries found")
            
            return {
                "title": feed.feed.get("title", ""),
                "description": feed.feed.get("description", ""),
                "language": feed.feed.get("language", "en"),
                "entries": feed.entries,
                "status": "success"
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching RSS feed {url}: {e.response.status_code} - {e.response.text}")
            return {
                "status": "error",
                "error": f"HTTP {e.response.status_code}: {e.response.text}"
            }
        except httpx.RequestError as e:
            logger.error(f"Request error fetching RSS feed {url}: {str(e)}")
            return {
                "status": "error",
                "error": f"Request error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error fetching RSS feed {url}: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def process_article_content(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process article content for analysis"""
        try:
            import html
            content = article_data.get("content", [])
            if not content:
                content = article_data.get("summary", "")
            else:
                # Extract text from HTML content
                soup = BeautifulSoup(str(content), "html.parser")
                content = soup.get_text()
            
            # Clean and process content
            content = self._clean_text(content)

            # Decode entities and strip HTML in summary/description
            if isinstance(article_data.get("summary"), str):
                raw_summary = article_data["summary"] or ""
                # First unescape entities
                unescaped = html.unescape(raw_summary)
                # Then strip any HTML tags to plain text
                try:
                    soup_sum = BeautifulSoup(unescaped, "html.parser")
                    cleaned_summary = soup_sum.get_text(separator=" ", strip=True)
                except Exception:
                    cleaned_summary = unescaped
                article_data["summary"] = cleaned_summary
            
            # Extract images and visual content
            original_content = article_data.get("content", [])
            if isinstance(original_content, list):
                original_content = " ".join(str(item) for item in original_content)
            
            # Get article URL for image extraction
            article_url = article_data.get("url", "")
            rss_images = article_data.get("rss_images", {})
            image_data = await self.extract_images_from_content(original_content, article_url, rss_images)
            content_metadata = self.extract_content_metadata(original_content)
            content_type = self.detect_content_type(original_content, article_data.get("title", ""))
            
            # Calculate metrics
            word_count = len(content.split())
            readability_score = textstat.flesch_reading_ease(content) if content else 0
            sentiment_score = self._calculate_sentiment(content)
            quality_score = self._calculate_quality_score(content, word_count, readability_score)
            
            # Extract tags and category
            tags = self._extract_tags(article_data)
            category = self._categorize_content(content, tags)
            
            return {
                "content": content,
                "word_count": word_count,
                "readability_score": readability_score,
                "sentiment_score": sentiment_score,
                "quality_score": quality_score,
                "tags": tags,
                "category": category,
                # New visual and metadata fields
                "image_url": image_data["image_url"],
                "thumbnail_url": image_data["thumbnail_url"],
                "image_alt_text": image_data["image_alt_text"],
                "reading_time": content_metadata["reading_time"],
                "has_images": content_metadata["has_images"],
                "has_videos": content_metadata["has_videos"],
                "has_lists": content_metadata["has_lists"],
                "has_quotes": content_metadata["has_quotes"],
                "content_type": content_type
            }
            
        except Exception as e:
            logger.error(f"Error processing article content: {str(e)}")
            return {
                "content": "",
                "word_count": 0,
                "readability_score": 0,
                "sentiment_score": 0,
                "quality_score": 0,
                "tags": [],
                "category": "general",
                # Default values for new fields
                "image_url": None,
                "thumbnail_url": None,
                "image_alt_text": None,
                "reading_time": 1,
                "has_images": False,
                "has_videos": False,
                "has_lists": False,
                "has_quotes": False,
                "content_type": "article"
            }
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        
        # Remove HTML tags
        soup = BeautifulSoup(text, "html.parser")
        text = soup.get_text()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,!?;:()\-]', '', text)
        
        return text.strip()
    
    def _calculate_sentiment(self, text: str) -> float:
        """Calculate sentiment score (-1.0 to 1.0)"""
        if not text:
            return 0.0
        
        # Simple sentiment analysis based on word patterns
        positive_words = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "positive", "success", "win", "best"]
        negative_words = ["bad", "terrible", "awful", "horrible", "negative", "fail", "lose", "worst", "problem", "issue"]
        
        words = text.lower().split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        total_words = len(words)
        if total_words == 0:
            return 0.0
        
        sentiment = (positive_count - negative_count) / total_words
        return max(-1.0, min(1.0, sentiment))
    
    def _calculate_quality_score(self, content: str, word_count: int, readability_score: float) -> float:
        """Calculate overall quality score (0.0 to 1.0)"""
        if not content or word_count == 0:
            return 0.0
        
        # Factors for quality score
        length_score = min(1.0, word_count / 500)  # Optimal around 500 words
        readability_score_norm = max(0, min(1.0, readability_score / 100))
        
        # Penalize very short or very long articles
        if word_count < 100:
            length_score *= 0.5
        elif word_count > 2000:
            length_score *= 0.8
        
        # Combine scores
        quality_score = (length_score * 0.4 + readability_score_norm * 0.6)
        return max(0.0, min(1.0, quality_score))
    
    def _extract_tags(self, article_data: Dict[str, Any]) -> List[str]:
        """Extract tags from article data"""
        tags = []
        
        # Extract from tags field
        if "tags" in article_data:
            for tag in article_data["tags"]:
                if isinstance(tag, dict) and "term" in tag:
                    tags.append(tag["term"].lower())
                elif isinstance(tag, str):
                    tags.append(tag.lower())
        
        # Extract from categories
        if "categories" in article_data:
            for category in article_data["categories"]:
                if isinstance(category, dict) and "term" in category:
                    tags.append(category["term"].lower())
                elif isinstance(category, str):
                    tags.append(category.lower())
        
        # Remove duplicates and limit
        return list(set(tags))[:10]
    
    def _categorize_content(self, content: str, tags: List[str]) -> str:
        """Categorize content based on text and tags"""
        content_lower = content.lower()
        tags_lower = [tag.lower() for tag in tags]
        
        # Technology keywords
        tech_keywords = ["technology", "tech", "software", "ai", "artificial intelligence", "machine learning", "programming", "code", "app", "digital"]
        if any(keyword in content_lower or keyword in tags_lower for keyword in tech_keywords):
            return "technology"
        
        # Business keywords
        business_keywords = ["business", "finance", "economy", "market", "investment", "company", "corporate", "startup", "revenue", "profit"]
        if any(keyword in content_lower or keyword in tags_lower for keyword in business_keywords):
            return "business"
        
        # Science keywords
        science_keywords = ["science", "research", "study", "scientific", "discovery", "experiment", "data", "analysis", "study", "research"]
        if any(keyword in content_lower or keyword in tags_lower for keyword in science_keywords):
            return "science"
        
        # Health keywords
        health_keywords = ["health", "medical", "medicine", "healthcare", "disease", "treatment", "patient", "doctor", "hospital", "wellness"]
        if any(keyword in content_lower or keyword in tags_lower for keyword in health_keywords):
            return "health"
        
        return "general"
    
    async def detect_duplicates(self, db: Session, article_url: str, title: str, content: str) -> Optional[int]:
        """Detect if article is a duplicate"""
        try:
            # Check for exact URL match
            existing = db.query(Article).filter(Article.url == article_url).first()
            if existing:
                return existing.id
            
            # Check for similar titles (simple similarity)
            similar_articles = db.query(Article).filter(
                and_(
                    Article.title.ilike(f"%{title[:50]}%"),
                    Article.is_active == True
                )
            ).all()
            
            for article in similar_articles:
                # Simple similarity check
                if self._calculate_similarity(title, article.title) > 0.8:
                    return article.id
            
            return None
            
        except Exception as e:
            logger.error(f"Error detecting duplicates: {str(e)}")
            return None
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple text similarity (0.0 to 1.0)"""
        if not text1 or not text2:
            return 0.0
        
        # Simple word overlap similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    async def fetch_and_process_source(self, db: Session, source: RSSSource) -> Dict[str, Any]:
        """Fetch and process articles from a single RSS source"""
        try:
            logger.info(f"Fetching RSS feed: {source.name} ({source.url})")
            
            # Fetch RSS feed
            feed_data = await self.fetch_rss_feed(source.url)
            if feed_data["status"] != "success":
                return {
                    "source_id": source.id,
                    "status": "error",
                    "error": feed_data.get("error", "Unknown error"),
                    "articles_processed": 0
                }
            
            articles_processed = 0
            articles_fetched = 0
            duplicates_found = 0
            
            for entry in feed_data["entries"]:
                try:
                    articles_fetched += 1
                    
                    # Parse published date
                    published_at = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        published_at = datetime(*entry.published_parsed[:6])
                    elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
                        published_at = datetime(*entry.updated_parsed[:6])
                    
                    # Check if article already exists
                    duplicate_id = await self.detect_duplicates(
                        db, 
                        entry.get("link", ""), 
                        entry.get("title", ""), 
                        entry.get("content", [])
                    )
                    
                    if duplicate_id:
                        duplicates_found += 1
                        continue
                    
                    # Extract RSS-specific images first
                    rss_images = self._extract_rss_images(entry)
                    
                    # Process article content
                    article_data = {
                        "title": entry.get("title", ""),
                        "url": entry.get("link", ""),
                        "content": entry.get("content", []),
                        "summary": entry.get("summary", ""),
                        "author": entry.get("author", ""),
                        "tags": entry.get("tags", []),
                        "categories": entry.get("categories", []),
                        "rss_images": rss_images  # Add RSS images to article data
                    }
                    
                    processed = await self.process_article_content(article_data)
                    
                    # Create article record
                    article = Article(
                        title=article_data["title"],
                        url=article_data["url"],
                        content=processed["content"],
                        summary=article_data["summary"],
                        author=article_data["author"],
                        published_at=published_at,
                        rss_source_id=source.id,
                        category=processed["category"],
                        tags=processed["tags"],
                        sentiment_score=processed["sentiment_score"],
                        readability_score=processed["readability_score"],
                        word_count=processed["word_count"],
                        quality_score=processed["quality_score"],
                        is_duplicate=duplicate_id is not None,
                        duplicate_of=duplicate_id,
                        # New visual and metadata fields
                        image_url=processed["image_url"],
                        thumbnail_url=processed["thumbnail_url"],
                        image_alt_text=processed["image_alt_text"],
                        reading_time=processed["reading_time"],
                        has_images=processed["has_images"],
                        has_videos=processed["has_videos"],
                        has_lists=processed["has_lists"],
                        has_quotes=processed["has_quotes"],
                        content_type=processed["content_type"]
                    )
                    
                    db.add(article)
                    articles_processed += 1
                    
                except Exception as e:
                    logger.error(f"Error processing article from {source.name}: {str(e)}")
                    continue
            
            # Update source last_fetched
            source.last_fetched = datetime.utcnow()
            db.commit()
            
            return {
                "source_id": source.id,
                "status": "success",
                "articles_fetched": articles_fetched,
                "articles_processed": articles_processed,
                "duplicates_found": duplicates_found
            }
            
        except Exception as e:
            logger.error(f"Error processing RSS source {source.name}: {str(e)}")
            return {
                "source_id": source.id,
                "status": "error",
                "error": str(e),
                "articles_processed": 0
            }
    
    async def fetch_all_sources(self, db: Session, source_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """Fetch and process all active RSS sources"""
        try:
            # Get sources to process
            query = db.query(RSSSource).filter(RSSSource.is_active == True)
            if source_ids:
                query = query.filter(RSSSource.id.in_(source_ids))
            
            sources = query.all()
            
            if not sources:
                return {
                    "success": False,
                    "message": "No active RSS sources found",
                    "sources_processed": 0,
                    "articles_fetched": 0,
                    "articles_processed": 0,
                    "duplicates_found": 0,
                    "errors": []
                }
            
            # Process sources concurrently
            tasks = [self.fetch_and_process_source(db, source) for source in sources]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Aggregate results
            total_articles_fetched = 0
            total_articles_processed = 0
            total_duplicates_found = 0
            errors = []
            
            for result in results:
                if isinstance(result, Exception):
                    errors.append(str(result))
                else:
                    total_articles_fetched += result.get("articles_fetched", 0)
                    total_articles_processed += result.get("articles_processed", 0)
                    total_duplicates_found += result.get("duplicates_found", 0)
                    if result.get("status") == "error":
                        errors.append(f"Source {result.get('source_id')}: {result.get('error', 'Unknown error')}")
            
            return {
                "success": True,
                "message": f"Processed {len(sources)} sources",
                "sources_processed": len(sources),
                "articles_fetched": total_articles_fetched,
                "articles_processed": total_articles_processed,
                "duplicates_found": total_duplicates_found,
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"Error fetching all RSS sources: {str(e)}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "sources_processed": 0,
                "articles_fetched": 0,
                "articles_processed": 0,
                "duplicates_found": 0,
                "errors": [str(e)]
            }
    
    async def search_articles(self, db: Session, search_request: ArticleSearchRequest) -> Dict[str, Any]:
        """Search articles with filters and pagination"""
        try:
            query = db.query(Article).filter(Article.is_active == True)
            
            # Apply filters
            if search_request.filters:
                filters = search_request.filters
                
                if filters.categories:
                    query = query.filter(Article.category.in_(filters.categories))
                
                if filters.min_quality_score is not None:
                    query = query.filter(Article.quality_score >= filters.min_quality_score)
                
                if filters.min_word_count is not None:
                    query = query.filter(Article.word_count >= filters.min_word_count)
                
                if filters.max_word_count is not None:
                    query = query.filter(Article.word_count <= filters.max_word_count)
                
                if filters.sentiment_range:
                    min_sentiment, max_sentiment = filters.sentiment_range
                    query = query.filter(
                        and_(
                            Article.sentiment_score >= min_sentiment,
                            Article.sentiment_score <= max_sentiment
                        )
                    )
                
                if filters.date_from:
                    query = query.filter(Article.published_at >= filters.date_from)
                
                if filters.date_to:
                    query = query.filter(Article.published_at <= filters.date_to)
                
                if filters.exclude_duplicates:
                    query = query.filter(Article.is_duplicate == False)
                
                if filters.exclude_used:
                    query = query.filter(Article.is_used_in_newsletter == False)
            
            # Apply text search
            if search_request.query:
                search_term = f"%{search_request.query}%"
                query = query.filter(
                    or_(
                        Article.title.ilike(search_term),
                        Article.content.ilike(search_term),
                        Article.summary.ilike(search_term)
                    )
                )
            
            # Get total count
            total_count = query.count()
            
            # Apply sorting
            if search_request.sort_by == "published_at":
                order_column = Article.published_at
            elif search_request.sort_by == "quality_score":
                order_column = Article.quality_score
            elif search_request.sort_by == "word_count":
                order_column = Article.word_count
            else:
                order_column = Article.published_at
            
            if search_request.sort_order == "asc":
                query = query.order_by(order_column.asc())
            else:
                query = query.order_by(order_column.desc())
            
            # Apply pagination
            articles = query.offset(search_request.offset).limit(search_request.limit).all()
            
            return {
                "articles": [article.to_dict() for article in articles],
                "total_count": total_count,
                "has_more": (search_request.offset + search_request.limit) < total_count,
                "filters_applied": search_request.filters
            }
            
        except Exception as e:
            logger.error(f"Error searching articles: {str(e)}")
            return {
                "articles": [],
                "total_count": 0,
                "has_more": False,
                "filters_applied": search_request.filters,
                "error": str(e)
            }
    
    async def get_rss_stats(self, db: Session) -> Dict[str, Any]:
        """Get RSS statistics"""
        try:
            # Basic counts
            total_sources = db.query(RSSSource).count()
            active_sources = db.query(RSSSource).filter(RSSSource.is_active == True).count()
            total_articles = db.query(Article).filter(Article.is_active == True).count()
            
            # Time-based counts
            today = datetime.utcnow().date()
            week_ago = today - timedelta(days=7)
            
            articles_today = db.query(Article).filter(
                and_(
                    Article.is_active == True,
                    func.date(Article.fetched_at) == today
                )
            ).count()
            
            articles_this_week = db.query(Article).filter(
                and_(
                    Article.is_active == True,
                    func.date(Article.fetched_at) >= week_ago
                )
            ).count()
            
            # Top categories
            top_categories = db.query(
                Article.category,
                func.count(Article.id).label("count")
            ).filter(
                and_(
                    Article.is_active == True,
                    Article.category.isnot(None)
                )
            ).group_by(Article.category).order_by(desc("count")).limit(10).all()
            
            # Recent sources
            recent_sources = db.query(RSSSource).filter(
                RSSSource.is_active == True
            ).order_by(desc(RSSSource.last_fetched)).limit(5).all()
            
            # Quality distribution
            quality_ranges = [
                (0.0, 0.2, "Poor"),
                (0.2, 0.4, "Fair"),
                (0.4, 0.6, "Good"),
                (0.6, 0.8, "Very Good"),
                (0.8, 1.0, "Excellent")
            ]
            
            quality_distribution = {}
            for min_score, max_score, label in quality_ranges:
                count = db.query(Article).filter(
                    and_(
                        Article.is_active == True,
                        Article.quality_score >= min_score,
                        Article.quality_score < max_score
                    )
                ).count()
                quality_distribution[label] = count
            
            return {
                "total_sources": total_sources,
                "active_sources": active_sources,
                "total_articles": total_articles,
                "articles_today": articles_today,
                "articles_this_week": articles_this_week,
                "top_categories": [{"category": cat, "count": count} for cat, count in top_categories],
                "recent_sources": [source.to_dict() for source in recent_sources],
                "quality_distribution": quality_distribution
            }
            
        except Exception as e:
            logger.error(f"Error getting RSS stats: {str(e)}")
            return {
                "total_sources": 0,
                "active_sources": 0,
                "total_articles": 0,
                "articles_today": 0,
                "articles_this_week": 0,
                "top_categories": [],
                "recent_sources": [],
                "quality_distribution": {}
            }
    
    async def extract_images_from_content(self, content: str, article_url: str = None, rss_images: Dict[str, str] = None) -> Dict[str, str]:
        """Extract images from RSS content, RSS fields, and article URL"""
        logger.info(f"🔍 Starting image extraction for URL: {article_url}")
        logger.info(f"📊 RSS images provided: {rss_images}")
        logger.info(f"📝 Content length: {len(content) if content else 0}")
        
        image_data = {
            'image_url': None,
            'thumbnail_url': None,
            'image_alt_text': None
        }
        
        # 1. First priority: RSS-specific images (media:content, enclosure, etc.)
        if rss_images:
            if rss_images.get('image_url'):
                image_data['image_url'] = rss_images['image_url']
            if rss_images.get('thumbnail_url'):
                image_data['thumbnail_url'] = rss_images['thumbnail_url']
            if rss_images.get('image_alt_text'):
                image_data['image_alt_text'] = rss_images['image_alt_text']
        
        # 2. Second priority: Extract from RSS content HTML
        if not image_data['image_url'] and content:
            soup = BeautifulSoup(content, 'html.parser')
            images = soup.find_all('img')
            
            if images:
                # Get the first/largest image
                main_image = images[0]
                # Support lazy-loading attributes and srcset
                image_url = (
                    main_image.get('src') or
                    main_image.get('data-src') or
                    main_image.get('data-original') or
                    main_image.get('data-lazy') or
                    main_image.get('data-thumbnail')
                )
                # Handle srcset - pick the largest candidate
                if (not image_url) and main_image.get('srcset'):
                    try:
                        candidates = [c.strip() for c in main_image.get('srcset').split(',')]
                        def parse_pair(p):
                            parts = p.split()
                            if len(parts) == 1:
                                return (parts[0], 0)
                            size = parts[1]
                            try:
                                if size.endswith('w'):
                                    return (parts[0], int(size[:-1]))
                                if size.endswith('x'):
                                    return (parts[0], int(float(size[:-1]) * 1000))
                            except Exception:
                                return (parts[0], 0)
                            return (parts[0], 0)
                        parsed = [parse_pair(p) for p in candidates]
                        parsed.sort(key=lambda x: x[1], reverse=True)
                        if parsed:
                            image_url = parsed[0][0]
                    except Exception:
                        pass
                
                # Handle relative URLs
                if image_url and not image_url.startswith('http'):
                    if image_url.startswith('//'):
                        image_url = 'https:' + image_url
                    elif image_url.startswith('/') and article_url:
                        # Try to construct absolute URL using article URL
                        from urllib.parse import urljoin
                        image_url = urljoin(article_url, image_url)
                
                if image_url and image_url.startswith('http'):
                    image_data['image_url'] = image_url
                    image_data['image_alt_text'] = main_image.get('alt', '')
                
                # Try to find a smaller version for thumbnail
                if not image_data['thumbnail_url']:
                    for img in images:
                        src = (
                            img.get('src') or
                            img.get('data-src') or
                            img.get('data-original') or
                            img.get('data-lazy') or ''
                        ).lower()
                        if any(keyword in src for keyword in ['thumbnail', 'thumb', 'small', 'preview']):
                            thumbnail_url = img.get('src')
                            if thumbnail_url and not thumbnail_url.startswith('http'):
                                if thumbnail_url.startswith('//'):
                                    thumbnail_url = 'https:' + thumbnail_url
                                elif thumbnail_url.startswith('/') and article_url:
                                    from urllib.parse import urljoin
                                    thumbnail_url = urljoin(article_url, thumbnail_url)
                            if thumbnail_url and thumbnail_url.startswith('http'):
                                image_data['thumbnail_url'] = thumbnail_url
                                break
        
        # 3. Third priority: Fetch from article URL (most expensive)
        if not image_data['image_url'] and article_url:
            try:
                article_image = await self._fetch_article_image(article_url)
                if article_image:
                    image_data['image_url'] = article_image
                    if not image_data['thumbnail_url']:
                        image_data['thumbnail_url'] = article_image  # Use same image for thumbnail
            except Exception as e:
                logger.warning(f"Failed to fetch image from article URL {article_url}: {e}")
        
        # 4. Fallback: Use thumbnail as main image if no main image found
        if not image_data['image_url'] and image_data['thumbnail_url']:
            image_data['image_url'] = image_data['thumbnail_url']
        
        return image_data
    
    async def _fetch_article_image(self, article_url: str) -> str:
        """Fetch the main image from an article URL"""
        logger.info(f"🌐 Fetching image from article URL: {article_url}")
        try:
            import httpx
            import re
            
            # Set a reasonable timeout
            timeout = httpx.Timeout(10.0)
            
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(article_url, follow_redirects=True)
                response.raise_for_status()
                
                # Parse HTML content
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for common image patterns
                image_candidates = []
                
                # 1. Look for Open Graph images
                og_image = soup.find('meta', property='og:image')
                if og_image and og_image.get('content'):
                    image_candidates.append(og_image['content'])
                    logger.info(f"✅ Found Open Graph image: {og_image['content']}")
                
                # 2. Look for Twitter card images
                twitter_image = soup.find('meta', {'name': 'twitter:image'})
                if twitter_image and twitter_image.get('content'):
                    image_candidates.append(twitter_image['content'])
                    logger.info(f"✅ Found Twitter card image: {twitter_image['content']}")
                
                # 3. Look for images in article content (with lazy attrs/srcset)
                article_content = soup.find('article') or soup.find('main') or soup.find('div', class_=re.compile(r'content|article|post'))
                if article_content:
                    images = article_content.find_all('img')
                    for img in images:
                        # Prefer explicit src, then lazy attrs
                        src = img.get('src') or img.get('data-src') or img.get('data-original') or img.get('data-lazy')
                        if (not src) and img.get('srcset'):
                            try:
                                candidates = [c.strip() for c in img.get('srcset').split(',')]
                                sizes = []
                                for c in candidates:
                                    parts = c.split()
                                    url = parts[0]
                                    score = 0
                                    if len(parts) > 1:
                                        s = parts[1]
                                        try:
                                            if s.endswith('w'):
                                                score = int(s[:-1])
                                            elif s.endswith('x'):
                                                score = int(float(s[:-1]) * 1000)
                                        except Exception:
                                            score = 0
                                    sizes.append((url, score))
                                sizes.sort(key=lambda x: x[1], reverse=True)
                                if sizes:
                                    src = sizes[0][0]
                            except Exception:
                                pass
                        if src and self._is_valid_image_url(src):
                            # Prefer larger images
                            width = img.get('width')
                            height = img.get('height')
                            if width and height:
                                size_score = int(width) * int(height)
                                image_candidates.append((src, size_score))
                            else:
                                image_candidates.append((src, 0))
                
                # 4. Look for any large images on the page
                all_images = soup.find_all('img')
                for img in all_images:
                    src = img.get('src')
                    if src and self._is_valid_image_url(src):
                        width = img.get('width')
                        height = img.get('height')
                        if width and height:
                            size_score = int(width) * int(height)
                            if size_score > 50000:  # Only consider reasonably large images
                                image_candidates.append((src, size_score))
                
                # Return the best candidate
                if image_candidates:
                    # Sort by size score (largest first)
                    image_candidates.sort(key=lambda x: x[1] if isinstance(x, tuple) else 0, reverse=True)
                    best_image = image_candidates[0]
                    result = best_image[0] if isinstance(best_image, tuple) else best_image
                    logger.info(f"✅ Selected best image: {result}")
                    return result
                else:
                    logger.warning(f"❌ No valid images found in article: {article_url}")
                
        except Exception as e:
            logger.warning(f"Error fetching article image from {article_url}: {e}")
        
        return None
    
    def _is_valid_image_url(self, url: str) -> bool:
        """Check if URL is a valid image"""
        if not url or not url.startswith('http'):
            return False
        
        # Check for common image extensions
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
        url_lower = url.lower()
        
        # Check extension
        if any(ext in url_lower for ext in image_extensions):
            return True
        
        # Check for common image hosting patterns
        image_patterns = ['imgur', 'flickr', 'unsplash', 'pexels', 'pixabay']
        if any(pattern in url_lower for pattern in image_patterns):
            return True
        
        return False
    
    def _extract_rss_images(self, entry: Dict[str, Any]) -> Dict[str, str]:
        """Extract images from RSS entry fields like media:content, enclosure, etc."""
        rss_images = {
            'image_url': None,
            'thumbnail_url': None,
            'image_alt_text': None
        }
        
        try:
            # 1. Check for media:content (RSS 2.0 with Media RSS)
            if 'media_content' in entry:
                media_content = entry['media_content']
                if isinstance(media_content, list) and media_content:
                    # Look for image type media
                    for media in media_content:
                        if isinstance(media, dict):
                            media_type = media.get('type', '').lower()
                            if media_type.startswith('image/'):
                                rss_images['image_url'] = media.get('url')
                                break
            
            # 2. Check for enclosure (RSS 2.0)
            if 'enclosures' in entry:
                enclosures = entry['enclosures']
                if isinstance(enclosures, list) and enclosures:
                    for enclosure in enclosures:
                        if isinstance(enclosure, dict):
                            enclosure_type = enclosure.get('type', '').lower()
                            if enclosure_type.startswith('image/'):
                                rss_images['image_url'] = enclosure.get('href')
                                break
            
            # 3. Check for media:thumbnail (Media RSS)
            if 'media_thumbnail' in entry:
                media_thumbnail = entry['media_thumbnail']
                if isinstance(media_thumbnail, list) and media_thumbnail:
                    thumbnail = media_thumbnail[0]
                    if isinstance(thumbnail, dict):
                        rss_images['thumbnail_url'] = thumbnail.get('url')
                        if not rss_images['image_url']:
                            rss_images['image_url'] = thumbnail.get('url')
            
            # 4. Check for media:group (Media RSS)
            if 'media_group' in entry:
                media_group = entry['media_group']
                if isinstance(media_group, list) and media_group:
                    group = media_group[0]
                    if isinstance(group, dict):
                        # Look for media:content in group
                        if 'media_content' in group:
                            content = group['media_content']
                            if isinstance(content, list) and content:
                                for media in content:
                                    if isinstance(media, dict):
                                        media_type = media.get('type', '').lower()
                                        if media_type.startswith('image/'):
                                            rss_images['image_url'] = media.get('url')
                                            break
                        
                        # Look for media:thumbnail in group
                        if 'media_thumbnail' in group and not rss_images['thumbnail_url']:
                            thumbnail = group['media_thumbnail']
                            if isinstance(thumbnail, list) and thumbnail:
                                thumb = thumbnail[0]
                                if isinstance(thumb, dict):
                                    rss_images['thumbnail_url'] = thumb.get('url')
            
            # 5. Check for iTunes:image (Podcast RSS)
            if 'itunes_image' in entry:
                itunes_image = entry['itunes_image']
                if isinstance(itunes_image, dict):
                    rss_images['image_url'] = itunes_image.get('href')

            # 6. Check content:encoded / content HTML for <img> when RSS lacks media fields
            if (not rss_images['image_url']) and 'content' in entry:
                try:
                    from bs4 import BeautifulSoup
                    from urllib.parse import urljoin
                    base_url = entry.get('link') or ''
                    contents = entry.get('content') or []
                    # feedparser gives a list of dicts with 'value'
                    html_parts = []
                    for c in contents:
                        if isinstance(c, dict):
                            val = c.get('value') or c.get('content')
                            if isinstance(val, str):
                                html_parts.append(val)
                        elif isinstance(c, str):
                            html_parts.append(c)
                    if html_parts:
                        soup = BeautifulSoup(' '.join(html_parts), 'html.parser')
                        img = soup.find('img')
                        if img:
                            # Support lazy attrs and srcset
                            src = img.get('src') or img.get('data-src') or img.get('data-original') or img.get('data-lazy') or img.get('data-thumbnail')
                            if (not src) and img.get('srcset'):
                                try:
                                    candidates = [p.strip() for p in img['srcset'].split(',')]
                                    def parse_pair(p):
                                        parts = p.split()
                                        if len(parts) == 1:
                                            return (parts[0], 0)
                                        size = parts[1]
                                        try:
                                            if size.endswith('w'):
                                                return (parts[0], int(size[:-1]))
                                            if size.endswith('x'):
                                                return (parts[0], int(float(size[:-1]) * 1000))
                                        except Exception:
                                            return (parts[0], 0)
                                        return (parts[0], 0)
                                    parsed = [parse_pair(p) for p in candidates]
                                    parsed.sort(key=lambda x: x[1], reverse=True)
                                    if parsed:
                                        src = parsed[0][0]
                                except Exception:
                                    pass
                            if src:
                                if src.startswith('//'):
                                    src = 'https:' + src
                                elif src.startswith('/') and base_url:
                                    src = urljoin(base_url, src)
                                if isinstance(src, str) and src.startswith('http'):
                                    rss_images['image_url'] = src
                                    if not rss_images['thumbnail_url']:
                                        rss_images['thumbnail_url'] = src
                                    rss_images['image_alt_text'] = img.get('alt') or rss_images['image_alt_text']
                except Exception:
                    pass
            
            # Clean up URLs
            for key in ['image_url', 'thumbnail_url']:
                url = rss_images[key]
                if url and not url.startswith('http'):
                    if url.startswith('//'):
                        rss_images[key] = 'https:' + url
                    elif url.startswith('/'):
                        # Skip relative URLs for now
                        rss_images[key] = None
            
        except Exception as e:
            logger.warning(f"Error extracting RSS images: {e}")
        
        return rss_images
    
    def calculate_reading_time(self, content: str) -> int:
        """Calculate estimated reading time in minutes"""
        if not content:
            return 1
        
        # Remove HTML tags for accurate word count
        soup = BeautifulSoup(content, 'html.parser')
        text_content = soup.get_text()
        word_count = len(text_content.split())
        
        # Assume 200 words per minute average reading speed
        reading_time = max(1, word_count // 200)
        return min(reading_time, 60)  # Cap at 60 minutes
    
    def extract_content_metadata(self, content: str) -> Dict[str, Any]:
        """Extract additional content metadata"""
        if not content:
            return {
                'has_images': False,
                'has_videos': False,
                'has_lists': False,
                'has_quotes': False,
                'word_count': 0,
                'reading_time': 1
            }
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Count different content types
        has_images = len(soup.find_all('img')) > 0
        has_videos = len(soup.find_all(['video', 'iframe'])) > 0
        has_lists = len(soup.find_all(['ul', 'ol'])) > 0
        has_quotes = len(soup.find_all('blockquote')) > 0
        
        # Calculate word count
        text_content = soup.get_text()
        word_count = len(text_content.split())
        
        # Calculate reading time
        reading_time = self.calculate_reading_time(content)
        
        return {
            'has_images': has_images,
            'has_videos': has_videos,
            'has_lists': has_lists,
            'has_quotes': has_quotes,
            'word_count': word_count,
            'reading_time': reading_time
        }
    
    def detect_content_type(self, content: str, title: str) -> str:
        """Detect the type of content based on content and title"""
        if not content:
            return "article"
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Check for video content
        if soup.find_all(['video', 'iframe']):
            return "video"
        
        # Check for podcast/audio content
        if soup.find_all('audio') or any(keyword in title.lower() for keyword in ['podcast', 'audio', 'episode']):
            return "podcast"
        
        # Check for image-heavy content
        images = soup.find_all('img')
        if len(images) > 3:
            return "gallery"
        
        # Default to article
        return "article"
    
    async def close(self):
        """Close the HTTP session"""
        await self.session.aclose()
