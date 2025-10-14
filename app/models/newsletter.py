from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Newsletter(Base):
    __tablename__ = "newsletters"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(JSON, nullable=False)  # Store the structured newsletter content
    status = Column(String(50), default="draft")  # draft, published, scheduled, archived
    style = Column(String(50), default="professional")  # professional, casual, technical, creative
    length = Column(String(50), default="medium")  # short, medium, long
    estimated_read_time = Column(String(20), default="5 minutes")
    tags = Column(JSON, default=list)  # Array of tags
    ai_model_used = Column(String(100), default="llama-3.1-70b-versatile")
    tokens_used = Column(Integer, default=0)
    
    # Analytics fields
    open_rate = Column(Integer, default=0)  # Percentage
    click_rate = Column(Integer, default=0)  # Percentage
    subscribers_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="newsletters")
    # articles = relationship("Article", back_populates="newsletter", lazy="select")
    
    def __repr__(self):
        return f"<Newsletter(id={self.id}, title='{self.title}', status='{self.status}')>"
    
    def to_dict(self):
        """Convert newsletter to dictionary for API responses"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "subject": self.subject,
            "content": self.content,
            "status": self.status,
            "style": self.style,
            "length": self.length,
            "estimated_read_time": self.estimated_read_time,
            "tags": self.tags or [],
            "ai_model_used": self.ai_model_used,
            "tokens_used": self.tokens_used,
            "open_rate": self.open_rate,
            "click_rate": self.click_rate,
            "subscribers_count": self.subscribers_count,
            "views_count": self.views_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
        }
