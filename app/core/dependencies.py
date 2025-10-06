from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.user_service import UserService
from app.services.jwt_service import JWTService
from app.models.user import User
from typing import Optional

# HTTP Bearer token scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    jwt_service = JWTService()
    user_id = jwt_service.verify_access_token(credentials.credentials)
    
    if user_id is None:
        raise credentials_exception
    
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    if not credentials:
        return None
    
    try:
        jwt_service = JWTService()
        user_id = jwt_service.verify_access_token(credentials.credentials)
        
        if user_id is None:
            return None
        
        user_service = UserService(db)
        user = user_service.get_user_by_id(user_id)
        
        if user is None or not user.is_active:
            return None
        
        return user
    except Exception:
        return None
