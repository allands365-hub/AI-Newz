#!/usr/bin/env python3
"""
Test script to debug JWT verification issues
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.supabase_service import SupabaseService
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_jwt_verification():
    """Test JWT verification with a sample token"""
    
    # Sample JWT token from the browser logs
    test_token = "eyJhbGciOiJIUzI1NiIsImtpZCI6Ill2OGpZdDN1YmQvcmpnYz…xzZX0.eN7f8CYO1EgYa-oOJ7sLpH8EXbiqdT7nsp4t2JIB9No"
    
    print(f"Testing JWT verification with token: {test_token[:50]}...")
    
    # Create Supabase service
    supabase_service = SupabaseService()
    
    try:
        # Test get_user method
        print("Testing get_user method...")
        user = supabase_service.get_user(test_token)
        print(f"get_user result: {user}")
        
        # Test verify_token method
        print("Testing verify_token method...")
        is_valid = supabase_service.verify_token(test_token)
        print(f"verify_token result: {is_valid}")
        
    except Exception as e:
        print(f"Error during JWT verification: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_jwt_verification()
