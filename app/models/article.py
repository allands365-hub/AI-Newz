from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Article(Base):
    """Article model for RSS feed content"""
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    url = Column(String(1000), nullable=False, unique=True, index=True)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    author = Column(String(255), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Source relationship
    rss_source_id = Column(Integer, ForeignKey("rss_sources.id"), nullable=False, index=True)
    rss_source = relationship("RSSSource", back_populates="articles")
    
    # Visual content
    image_url = Column(String(1000), nullable=True)  # Main article image
    thumbnail_url = Column(String(1000), nullable=True)  # Small thumbnail
    image_alt_text = Column(String(500), nullable=True)  # Alt text for accessibility
    
    # Content analysis
    category = Column(String(100), nullable=True, index=True)
    tags = Column(JSON, nullable=True)  # List of tags
    sentiment_score = Column(Float, nullable=True)  # -1.0 to 1.0
    readability_score = Column(Float, nullable=True)  # 0.0 to 100.0
    word_count = Column(Integer, default=0)
    reading_time = Column(Integer, nullable=True)  # Estimated reading time in minutes
    
    # Content metadata
    has_images = Column(Boolean, default=False)  # Whether article has images
    has_videos = Column(Boolean, default=False)  # Whether article has videos
    has_lists = Column(Boolean, default=False)  # Whether article has lists
    has_quotes = Column(Boolean, default=False)  # Whether article has quotes
    content_type = Column(String(50), nullable=True)  # article, video, podcast, etc.
    
    # Engagement metrics (for future use)
    engagement_score = Column(Float, default=0.0)  # Calculated engagement
    social_shares = Column(Integer, default=0)  # Social media shares
    
    # Newsletter integration
    is_used_in_newsletter = Column(Boolean, default=False, index=True)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id"), nullable=True, index=True)
    # newsletter = relationship("Newsletter", back_populates="articles", lazy="select")
    
    # Quality metrics
    quality_score = Column(Float, default=0.0)  # 0.0 to 1.0
    is_duplicate = Column(Boolean, default=False, index=True)
    duplicate_of = Column(Integer, ForeignKey("articles.id"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "url": self.url,
            "content": self.content,
            "summary": self.summary,
            "author": self.author,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
            "rss_source_id": self.rss_source_id,
            "rss_source_name": self.rss_source.name if self.rss_source else None,
            "rss_source_logo": self.rss_source.logo_url if self.rss_source else None,
            "category": self.category,
            "tags": self.tags or [],
            "sentiment_score": self.sentiment_score,
            "readability_score": self.readability_score,
            "word_count": self.word_count,
            "reading_time": self.reading_time,
            "image_url": self.image_url,
            "thumbnail_url": self.thumbnail_url,
            "image_alt_text": self.image_alt_text,
            "has_images": self.has_images,
            "has_videos": self.has_videos,
            "has_lists": self.has_lists,
            "has_quotes": self.has_quotes,
            "content_type": self.content_type,
            "engagement_score": self.engagement_score,
            "social_shares": self.social_shares,
            "is_used_in_newsletter": self.is_used_in_newsletter,
            "newsletter_id": self.newsletter_id,
            "quality_score": self.quality_score,
            "is_duplicate": self.is_duplicate,
            "duplicate_of": self.duplicate_of,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
