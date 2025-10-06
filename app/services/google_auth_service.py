import httpx
from google.auth.transport import requests
from google.oauth2 import id_token
from typing import Optional, Dict, Any
from app.core.config import settings
from app.schemas.auth import GoogleUserInfo
import logging

logger = logging.getLogger(__name__)


class GoogleAuthService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and ID tokens"""
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(token_url, data=data)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to exchange code for tokens: {e}")
            raise ValueError(f"Failed to exchange authorization code: {str(e)}")
    
    async def get_user_info(self, access_token: str) -> GoogleUserInfo:
        """Get user information from Google API"""
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(user_info_url, headers=headers)
                response.raise_for_status()
                user_data = response.json()
                
                return GoogleUserInfo(
                    id=user_data["id"],
                    email=user_data["email"],
                    name=user_data["name"],
                    picture=user_data.get("picture"),
                    verified_email=user_data.get("verified_email", True)
                )
        except httpx.HTTPError as e:
            logger.error(f"Failed to get user info from Google: {e}")
            raise ValueError(f"Failed to get user information: {str(e)}")
    
    def verify_id_token(self, id_token_str: str) -> GoogleUserInfo:
        """Verify and decode Google ID token"""
        try:
            idinfo = id_token.verify_oauth2_token(
                id_token_str, 
                requests.Request(), 
                self.client_id
            )
            
            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            return GoogleUserInfo(
                id=idinfo["sub"],
                email=idinfo["email"],
                name=idinfo["name"],
                picture=idinfo.get("picture"),
                verified_email=idinfo.get("email_verified", True)
            )
        except ValueError as e:
            logger.error(f"Invalid Google ID token: {e}")
            raise ValueError(f"Invalid token: {str(e)}")
    
    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """Generate Google OAuth authorization URL"""
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        if state:
            params["state"] = state
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{query_string}"
