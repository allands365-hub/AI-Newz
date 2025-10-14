from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class RSSSourceCategory(str, Enum):
    """RSS source categories"""
    TECHNOLOGY = "technology"
    BUSINESS = "business"
    SCIENCE = "science"
    HEALTH = "health"
    POLITICS = "politics"
    SPORTS = "sports"
    ENTERTAINMENT = "entertainment"
    WORLD = "world"
    GENERAL = "general"


class RSSSourceCreate(BaseModel):
    """Schema for creating RSS sources"""
    name: str = Field(..., min_length=1, max_length=255)
    url: HttpUrl
    description: Optional[str] = None
    category: Optional[RSSSourceCategory] = None
    language: str = Field(default="en", max_length=10)
    credibility_score: float = Field(default=0.0, ge=0.0, le=1.0)
    fetch_frequency: int = Field(default=3600, ge=300)  # minimum 5 minutes


class RSSSourceUpdate(BaseModel):
    """Schema for updating RSS sources"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[RSSSourceCategory] = None
    language: Optional[str] = Field(None, max_length=10)
    is_active: Optional[bool] = None
    credibility_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    fetch_frequency: Optional[int] = Field(None, ge=300)


class RSSSourceResponse(BaseModel):
    """Schema for RSS source responses"""
    id: int
    name: str
    url: str
    description: Optional[str]
    category: Optional[str]
    language: str
    is_active: bool
    credibility_score: float
    last_fetched: Optional[datetime]
    fetch_frequency: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ArticleResponse(BaseModel):
    """Schema for article responses"""
    id: int
    title: str
    url: str
    content: Optional[str]
    summary: Optional[str]
    author: Optional[str]
    published_at: Optional[datetime]
    fetched_at: datetime
    rss_source_id: int
    rss_source_name: Optional[str] = None
    category: Optional[str]
    tags: List[str]
    sentiment_score: Optional[float]
    readability_score: Optional[float]
    word_count: int
    is_used_in_newsletter: bool
    newsletter_id: Optional[int]
    quality_score: float
    is_duplicate: bool
    duplicate_of: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class RSSFetchRequest(BaseModel):
    """Schema for RSS fetch requests"""
    source_ids: Optional[List[int]] = None  # If None, fetch all active sources
    force_refresh: bool = Field(default=False)


class RSSFetchResponse(BaseModel):
    """Schema for RSS fetch responses"""
    success: bool
    message: str
    sources_processed: int
    articles_fetched: int
    articles_processed: int
    duplicates_found: int
    errors: List[str] = []


class ContentFilter(BaseModel):
    """Schema for content filtering"""
    categories: Optional[List[str]] = None
    min_quality_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    min_word_count: Optional[int] = Field(None, ge=0)
    max_word_count: Optional[int] = Field(None, ge=0)
    sentiment_range: Optional[tuple] = Field(None, description="Tuple of (min, max) sentiment scores")
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    exclude_duplicates: bool = Field(default=True)
    exclude_used: bool = Field(default=False)


class ArticleSearchRequest(BaseModel):
    """Schema for article search requests"""
    query: Optional[str] = None
    filters: Optional[ContentFilter] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    sort_by: str = Field(default="published_at", description="published_at, quality_score, word_count")
    sort_order: str = Field(default="desc", description="asc, desc")


class ArticleSearchResponse(BaseModel):
    """Schema for article search responses"""
    articles: List[ArticleResponse]
    total_count: int
    has_more: bool
    filters_applied: ContentFilter


class RSSStatsResponse(BaseModel):
    """Schema for RSS statistics responses"""
    total_sources: int
    active_sources: int
    total_articles: int
    articles_today: int
    articles_this_week: int
    top_categories: List[Dict[str, Any]]
    recent_sources: List[RSSSourceResponse]
    quality_distribution: Dict[str, int]
