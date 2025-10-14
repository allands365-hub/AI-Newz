from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import httpx
import logging
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)

async def get_fallback_avatar():
    """
    Generate a fallback avatar using UI Avatars service.
    """
    try:
        # Use a generic fallback avatar
        fallback_url = "https://ui-avatars.com/api/?name=User&size=96&background=random&color=fff&format=png"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(fallback_url)
            response.raise_for_status()
            
            return Response(
                content=response.content,
                media_type="image/png",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "*",
                    "Cache-Control": "public, max-age=3600",
                    "Content-Length": str(len(response.content))
                }
            )
    except Exception as e:
        logger.error(f"Error generating fallback avatar: {e}")
        # Return a simple 1x1 transparent pixel as last resort
        transparent_pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        return Response(
            content=transparent_pixel,
            media_type="image/png",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
                "Cache-Control": "public, max-age=3600",
                "Content-Length": str(len(transparent_pixel))
            }
        )

@router.get("/proxy-profile-picture")
async def proxy_profile_picture(url: str = Query(..., description="Google profile picture URL")):
    """
    Proxy endpoint for Google profile pictures to avoid CORB issues.
    This endpoint fetches the image from Google and serves it with proper CORS headers.
    """
    try:
        # Validate that it's a valid URL
        if not url or not (url.startswith("https://") or url.startswith("http://")):
            raise HTTPException(status_code=400, detail="Invalid profile picture URL")
        
        # Fetch the image from the provided URL
        logger.info(f"Fetching profile picture from: {url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            try:
                response = await client.get(url)
                logger.info(f"Response status: {response.status_code}, content-type: {response.headers.get('content-type')}")
                response.raise_for_status()
                
                # Get the content type from the response
                content_type = response.headers.get("content-type", "image/jpeg")
                
                # Return the image with proper CORS headers
                return Response(
                    content=response.content,
                    media_type=content_type,
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET",
                        "Access-Control-Allow-Headers": "*",
                        "Cache-Control": "public, max-age=3600",
                        "Content-Length": str(len(response.content))
                    }
                )
                
            except httpx.TimeoutException:
                logger.error(f"Timeout fetching profile picture from: {url}")
                # Fallback to UI Avatars for Google URLs
                if url.startswith("https://lh3.googleusercontent.com/"):
                    return await get_fallback_avatar()
                raise HTTPException(status_code=504, detail="Timeout fetching image")
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error fetching profile picture: {e.response.status_code}")
                # Fallback to UI Avatars for Google URLs
                if url.startswith("https://lh3.googleusercontent.com/"):
                    return await get_fallback_avatar()
                raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch image")
            except httpx.RequestError as e:
                logger.error(f"Request error fetching profile picture: {e}")
                # Fallback to UI Avatars for Google URLs
                if url.startswith("https://lh3.googleusercontent.com/"):
                    return await get_fallback_avatar()
                raise HTTPException(status_code=502, detail="Failed to fetch image")
                
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error with profile picture: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")