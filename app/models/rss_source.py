from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class RSSSource(Base):
    """RSS feed source model"""
    __tablename__ = "rss_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    url = Column(String(500), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    language = Column(String(10), default="en")
    is_active = Column(Boolean, default=True, index=True)
    credibility_score = Column(Float, default=0.0)  # 0.0 to 1.0
    last_fetched = Column(DateTime(timezone=True), nullable=True)
    fetch_frequency = Column(Integer, default=3600)  # seconds between fetches
    
    # Visual branding
    logo_url = Column(String(1000), nullable=True)  # Source logo
    favicon_url = Column(String(1000), nullable=True)  # Source favicon
    brand_color = Column(String(7), nullable=True)  # Hex color code
    
    # Enhanced metadata
    platform = Column(String(50), nullable=True)  # reddit, hackernews, techcrunch, etc.
    verification_status = Column(String(20), default="unverified")  # verified, unverified, pending
    
    # Content preferences
    preferred_image_size = Column(String(20), default="medium")  # small, medium, large
    content_focus = Column(JSON, nullable=True)  # Focus areas like ["AI", "Tech", "Business"]
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    articles = relationship("Article", back_populates="rss_source", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "url": self.url,
            "description": self.description,
            "category": self.category,
            "language": self.language,
            "is_active": self.is_active,
            "credibility_score": self.credibility_score,
            "last_fetched": self.last_fetched.isoformat() if self.last_fetched else None,
            "fetch_frequency": self.fetch_frequency,
            "logo_url": self.logo_url,
            "favicon_url": self.favicon_url,
            "brand_color": self.brand_color,
            "platform": self.platform,
            "verification_status": self.verification_status,
            "preferred_image_size": self.preferred_image_size,
            "content_focus": self.content_focus or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
