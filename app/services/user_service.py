from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from app.models.user import User, AuthProvider
from app.models.user_preferences import UserPreferences
from app.schemas.auth import UserCreate, UserUpdate, GoogleUserInfo
from app.core.security import get_password_hash, verify_password
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_google_id(self, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        return self.db.query(User).filter(User.google_id == google_id).first()
    
    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        # Hash password if provided
        password_hash = None
        if user_data.password:
            password_hash = get_password_hash(user_data.password)
        
        db_user = User(
            email=user_data.email,
            name=user_data.name,
            profile_picture=user_data.profile_picture,
            google_id=user_data.google_id,
            password_hash=password_hash,
            subscription_tier=user_data.subscription_tier,
            auth_provider=user_data.auth_provider,
            is_verified=user_data.auth_provider == AuthProvider.GOOGLE
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        # Create default user preferences
        self._create_default_preferences(db_user.id)
        
        logger.info(f"Created new user: {db_user.email}")
        return db_user
    
    def create_google_user(self, google_id: str, email: str, name: str, profile_picture: Optional[str] = None) -> User:
        """Create a new user from Google OAuth data"""
        user_data = UserCreate(
            email=email,
            name=name,
            profile_picture=profile_picture,
            google_id=google_id,
            auth_provider=AuthProvider.GOOGLE
        )
        return self.create_user(user_data)
    
    def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[User]:
        """Update user information"""
        db_user = self.get_user_by_id(user_id)
        if not db_user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db_user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_user)
        
        logger.info(f"Updated user: {db_user.email}")
        return db_user
    
    def update_last_login(self, user_id: str) -> Optional[User]:
        """Update user's last login timestamp"""
        db_user = self.get_user_by_id(user_id)
        if not db_user:
            return None
        
        db_user.last_login = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_user)
        
        return db_user
    
    def verify_password(self, user: User, password: str) -> bool:
        """Verify user password"""
        if not user.password_hash:
            return False
        return verify_password(password, user.password_hash)
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.get_user_by_email(email)
        if not user or not user.is_active:
            return None
        
        if not self.verify_password(user, password):
            return None
        
        return user
    
    def _create_default_preferences(self, user_id: str) -> UserPreferences:
        """Create default user preferences"""
        preferences = UserPreferences(
            user_id=user_id,
            preferred_sources=[],
            content_categories=[],
            newsletter_frequency="daily",
            ai_style="professional",
            timezone="UTC",
            email_notifications=True,
            max_articles_per_newsletter="10",
            include_trends=True,
            include_summaries=True
        )
        
        self.db.add(preferences)
        self.db.commit()
        self.db.refresh(preferences)
        
        return preferences
    
    def get_user_preferences(self, user_id: str) -> Optional[UserPreferences]:
        """Get user preferences"""
        return self.db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    
    def update_user_preferences(self, user_id: str, preferences_data: dict) -> Optional[UserPreferences]:
        """Update user preferences"""
        preferences = self.get_user_preferences(user_id)
        if not preferences:
            return None
        
        for field, value in preferences_data.items():
            if hasattr(preferences, field):
                setattr(preferences, field, value)
        
        preferences.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(preferences)
        
        return preferences
