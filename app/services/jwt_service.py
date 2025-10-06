from datetime import datetime, timedelta
from typing import Optional
from app.core.config import settings
from app.core.security import create_access_token, verify_token
import logging

logger = logging.getLogger(__name__)


class JWTService:
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.expire_minutes = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    
    def create_access_token(self, user_id: str, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token for a user"""
        data = {"sub": user_id}
        return create_access_token(data, expires_delta)
    
    def verify_access_token(self, token: str) -> Optional[str]:
        """Verify JWT access token and return user ID"""
        payload = verify_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                return user_id
        return None
    
    def create_token_response(self, user_id: str) -> dict:
        """Create a complete token response"""
        access_token = self.create_access_token(user_id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": self.expire_minutes * 60
        }
