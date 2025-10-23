#!/usr/bin/env python3
"""
AI-Newz Hugging Face Spaces Deployment
Main application entry point for Hugging Face Spaces
"""

import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

# Set environment variables for Hugging Face Spaces
os.environ.setdefault("PYTHONPATH", str(project_root))

# Import and run the FastAPI app
from app.main import app

# For Hugging Face Spaces, we need to expose the app directly
if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment (Hugging Face provides this)
    port = int(os.environ.get("PORT", 7860))
    
    # Run the app
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False  # Disable reload in production
    )
