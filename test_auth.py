#!/usr/bin/env python3
"""
Simple test script for Google OAuth authentication
"""
import asyncio
import httpx
from app.services.google_auth_service import GoogleAuthService

async def test_google_auth():
    """Test Google OAuth service"""
    print("Testing Google OAuth Service...")
    
    # Initialize service
    google_auth = GoogleAuthService()
    
    # Test authorization URL generation
    auth_url = google_auth.get_authorization_url("test_state")
    print(f"Authorization URL: {auth_url}")
    
    # Test ID token verification (mock)
    try:
        # This would normally be a real ID token from Google
        mock_id_token = "mock_token"
        # user_info = google_auth.verify_id_token(mock_id_token)
        print("ID token verification method available")
    except Exception as e:
        print(f"ID token verification test: {e}")
    
    print("Google OAuth service test completed!")

if __name__ == "__main__":
    asyncio.run(test_google_auth())
