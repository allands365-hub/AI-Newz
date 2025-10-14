from sqlalchemy import Column, String, DateTime, Boolean, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
import enum


class AuthProvider(str, enum.Enum):
    GOOGLE = "google"
    EMAIL = "email"


class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    profile_picture = Column(Text, nullable=True)
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)  # For email auth fallback
    subscription_tier = Column(Enum(SubscriptionTier), default=SubscriptionTier.FREE)
    auth_provider = Column(Enum(AuthProvider), default=AuthProvider.GOOGLE)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)  # Google users are pre-verified
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    # preferences = relationship("UserPreferences", back_populates="user", uselist=False, lazy="select")
    newsletters = relationship("Newsletter", back_populates="user", lazy="select")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"
