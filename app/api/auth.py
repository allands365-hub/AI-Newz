from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.google_auth_service import GoogleAuthService
from app.services.user_service import UserService
from app.services.jwt_service import JWTService
from app.schemas.auth import (
    GoogleAuthRequest, 
    GoogleAuthResponse, 
    GoogleTokenVerifyRequest,
    EmailLoginRequest,
    EmailRegisterRequest,
    AuthResponse,
    UserResponse,
    Token
)
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/google", response_model=GoogleAuthResponse)
async def google_auth(
    request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth authentication"""
    try:
        # Exchange code for tokens
        google_auth_service = GoogleAuthService()
        tokens = await google_auth_service.exchange_code_for_tokens(request.code)
        
        # Get user info from Google
        user_info = await google_auth_service.get_user_info(tokens["access_token"])
        
        # Check if user exists
        user_service = UserService(db)
        user = user_service.get_user_by_google_id(user_info.id)
        is_new_user = False
        
        if not user:
            # Create new user
            user = user_service.create_google_user(
                google_id=user_info.id,
                email=user_info.email,
                name=user_info.name,
                profile_picture=user_info.picture
            )
            is_new_user = True
            logger.info(f"Created new Google user: {user.email}")
        else:
            # Update last login
            user_service.update_last_login(user.id)
            logger.info(f"Google user logged in: {user.email}")
        
        # Generate JWT token
        jwt_service = JWTService()
        token_response = jwt_service.create_token_response(str(user.id))
        
        return GoogleAuthResponse(
            user=UserResponse.from_orm(user),
            access_token=token_response["access_token"],
            token_type=token_response["token_type"],
            expires_in=token_response["expires_in"],
            is_new_user=is_new_user,
            message="Authentication successful"
        )
        
    except Exception as e:
        logger.error(f"Google authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(e)}"
        )


@router.post("/google/verify", response_model=GoogleAuthResponse)
async def verify_google_token(
    request: GoogleTokenVerifyRequest,
    db: Session = Depends(get_db)
):
    """Verify Google ID token"""
    try:
        google_auth_service = GoogleAuthService()
        user_info = google_auth_service.verify_id_token(request.id_token)
        
        # Check if user exists
        user_service = UserService(db)
        user = user_service.get_user_by_google_id(user_info.id)
        is_new_user = False
        
        if not user:
            # Create new user
            user = user_service.create_google_user(
                google_id=user_info.id,
                email=user_info.email,
                name=user_info.name,
                profile_picture=user_info.picture
            )
            is_new_user = True
            logger.info(f"Created new Google user via ID token: {user.email}")
        else:
            # Update last login
            user_service.update_last_login(user.id)
            logger.info(f"Google user logged in via ID token: {user.email}")
        
        # Generate JWT token
        jwt_service = JWTService()
        token_response = jwt_service.create_token_response(str(user.id))
        
        return GoogleAuthResponse(
            user=UserResponse.from_orm(user),
            access_token=token_response["access_token"],
            token_type=token_response["token_type"],
            expires_in=token_response["expires_in"],
            is_new_user=is_new_user,
            message="Token verification successful"
        )
        
    except Exception as e:
        logger.error(f"Google token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Token verification failed: {str(e)}"
        )


@router.post("/email/login", response_model=AuthResponse)
async def email_login(
    request: EmailLoginRequest,
    db: Session = Depends(get_db)
):
    """Email/password login (fallback authentication)"""
    try:
        user_service = UserService(db)
        user = user_service.authenticate_user(request.email, request.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Update last login
        user_service.update_last_login(user.id)
        
        # Generate JWT token
        jwt_service = JWTService()
        token_response = jwt_service.create_token_response(str(user.id))
        
        logger.info(f"Email user logged in: {user.email}")
        
        return AuthResponse(
            user=UserResponse.from_orm(user),
            access_token=token_response["access_token"],
            token_type=token_response["token_type"],
            expires_in=token_response["expires_in"],
            is_new_user=False,
            message="Login successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/email/register", response_model=AuthResponse)
async def email_register(
    request: EmailRegisterRequest,
    db: Session = Depends(get_db)
):
    """Email/password registration (fallback authentication)"""
    try:
        user_service = UserService(db)
        
        # Check if user already exists
        existing_user = user_service.get_user_by_email(request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        from app.schemas.auth import UserCreate
        from app.models.user import AuthProvider
        
        user_data = UserCreate(
            email=request.email,
            name=request.name,
            password=request.password,
            auth_provider=AuthProvider.EMAIL
        )
        
        user = user_service.create_user(user_data)
        
        # Generate JWT token
        jwt_service = JWTService()
        token_response = jwt_service.create_token_response(str(user.id))
        
        logger.info(f"Email user registered: {user.email}")
        
        return AuthResponse(
            user=UserResponse.from_orm(user),
            access_token=token_response["access_token"],
            token_type=token_response["token_type"],
            expires_in=token_response["expires_in"],
            is_new_user=True,
            message="Registration successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email registration failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse.from_orm(current_user)


@router.post("/logout", response_model=dict)
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Logout successful"}
