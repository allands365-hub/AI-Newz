from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class NewsletterStyle(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    TECHNICAL = "technical"
    CREATIVE = "creative"

class NewsletterLength(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"

class NewsletterTemplate(str, Enum):
    MODERN = "modern"
    MINIMAL = "minimal"
    CLASSIC = "classic"
    TECH = "tech"

class NewsletterStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"
    ARCHIVED = "archived"

class NewsletterSection(BaseModel):
    title: str
    content: str
    type: str  # main, trend, summary

class NewsletterContent(BaseModel):
    subject: str
    opening: str
    sections: List[NewsletterSection]
    call_to_action: str
    estimated_read_time: str
    tags: List[str]

class NewsletterGenerateRequest(BaseModel):
    topic: str = Field(..., description="Main topic for the newsletter")
    style: Optional[NewsletterStyle] = Field(None, description="Writing style")
    length: Optional[NewsletterLength] = Field(NewsletterLength.MEDIUM, description="Newsletter length")
    template: Optional[NewsletterTemplate] = Field(NewsletterTemplate.MODERN, description="Email template style")
    include_trends: bool = Field(True, description="Include trending topics")
    include_summaries: bool = Field(True, description="Include article summaries")
    save_newsletter: bool = Field(False, description="Save the generated newsletter to database")
    # RSS integration controls
    use_rss: bool = Field(True, description="Include curated RSS articles in the newsletter")
    since_days: int = Field(3, ge=0, le=90, description="How many days back to look for articles")
    rss_limit: int = Field(6, ge=1, le=20, description="Maximum number of articles to include")
    min_quality: float = Field(0.1, ge=0.0, le=1.0, description="Minimum quality score threshold")
    source_ids: Optional[List[int]] = Field(default_factory=list, description="Restrict to specific source IDs")
    categories: Optional[List[str]] = Field(default_factory=list, description="Filter by categories")
    require_image: bool = Field(False, description="Only include articles that have images")
    min_word_count: int = Field(10, ge=0, le=5000, description="Exclude very short items")
    platforms: Optional[List[str]] = Field(default_factory=list, description="Filter by platform")
    dedupe_title_similarity: float = Field(0.85, ge=0.0, le=1.0, description="Drop near-duplicate titles above similarity")
    sort_by: str = Field("recency_then_quality", description="Sort: published_at | quality_score | recency_then_quality")
    include_fields: List[str] = Field(default_factory=lambda: ["title","summary","url","tags"], description="Fields to include in prompt")
    per_source_cap: int = Field(3, ge=1, le=10, description="Cap articles per source")

class NewsletterGenerateResponse(BaseModel):
    success: bool
    newsletter: NewsletterContent
    newsletter_id: Optional[str] = None
    model_used: str
    tokens_used: int
    raw_content: str
    included_articles: Optional[List[Dict[str, Any]]] = Field(default=None, description="Articles that were included in generation")

class NewsletterCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1, max_length=255)  # Changed back to subject to match DB
    content: str = Field(..., description="Newsletter content as JSON string")
    status: Optional[str] = Field("draft", description="Newsletter status")
    ai_model_used: Optional[str] = Field(None, description="AI model used")
    style: Optional[str] = Field("professional", description="Newsletter style")
    length: Optional[str] = Field("medium", description="Newsletter length")
    estimated_read_time: Optional[str] = Field("5 minutes", description="Estimated read time")
    tags: Optional[List[str]] = Field(default_factory=list, description="Newsletter tags")
    subscribers_count: Optional[int] = Field(0, description="Number of subscribers")
    views_count: Optional[int] = Field(0, description="Number of views")
    open_rate: Optional[float] = Field(0.0, description="Open rate percentage")
    click_rate: Optional[float] = Field(0.0, description="Click rate percentage")

class NewsletterUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, description="Newsletter content as JSON string")
    status: Optional[NewsletterStatus] = None
    style: Optional[NewsletterStyle] = None
    length: Optional[NewsletterLength] = None
    tags: Optional[List[str]] = None

class NewsletterResponse(BaseModel):
    id: str
    user_id: str
    title: str
    subject: str
    content: NewsletterContent
    status: NewsletterStatus
    style: NewsletterStyle
    length: NewsletterLength
    estimated_read_time: str
    tags: List[str]
    ai_model_used: str
    tokens_used: int
    open_rate: int
    click_rate: int
    subscribers_count: int
    views_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NewsletterAnalytics(BaseModel):
    total_newsletters: int
    published_newsletters: int
    draft_newsletters: int
    total_views: int
    total_subscribers: int
    average_open_rate: float
    average_click_rate: float
