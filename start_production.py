#!/usr/bin/env python3
"""
AI-Newz Production Startup Script
Starts only the backend server for production deployment
"""

import subprocess
import sys
import os
import platform
from pathlib import Path

def main():
    """Start the backend server for production"""
    print("🚀 Starting AI-Newz Backend Server (Production Mode)")
    
    # Get project directory
    project_root = Path(__file__).parent.absolute()
    os.chdir(project_root)
    
    # Set PYTHONPATH
    env = os.environ.copy()
    env['PYTHONPATH'] = str(project_root)
    
    try:
        # Start uvicorn directly for production
        print("📦 Starting FastAPI backend with Uvicorn...")
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", os.getenv("PORT", "8000"),
            "--workers", "1"
        ], env=env, cwd=project_root, check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start backend: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down backend server...")
        sys.exit(0)

if __name__ == "__main__":
    main()
