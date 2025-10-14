from sqlalchemy import Column, String, DateTime, Boolean, Text, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Content preferences
    preferred_sources = Column(ARRAY(String), default=list)
    content_categories = Column(ARRAY(String), default=list)
    newsletter_frequency = Column(String(50), default="daily")
    ai_style = Column(String(100), default="professional")
    
    # System preferences
    timezone = Column(String(50), default="UTC")
    email_notifications = Column(Boolean, default=True)
    
    # Newsletter preferences
    max_articles_per_newsletter = Column(String(10), default="10")
    include_trends = Column(Boolean, default=True)
    include_summaries = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    # user = relationship("User", back_populates="preferences")

    def __repr__(self):
        return f"<UserPreferences(user_id={self.user_id})>"
