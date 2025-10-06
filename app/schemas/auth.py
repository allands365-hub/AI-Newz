from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import AuthProvider, SubscriptionTier


class UserBase(BaseModel):
    email: EmailStr
    name: str
    profile_picture: Optional[str] = None
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    auth_provider: AuthProvider = AuthProvider.GOOGLE


class UserCreate(UserBase):
    google_id: Optional[str] = None
    password: Optional[str] = None  # Only for email auth fallback


class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    subscription_tier: Optional[SubscriptionTier] = None


class UserResponse(UserBase):
    id: str
    google_id: Optional[str] = None
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Google OAuth specific models
class GoogleAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None


class GoogleTokenVerifyRequest(BaseModel):
    id_token: str


class GoogleUserInfo(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    verified_email: bool = True


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    is_new_user: bool = False
    message: str


class GoogleAuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    is_new_user: bool = False
    message: str


# Fallback email/password models
class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str


class EmailRegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    user_id: Optional[str] = None
