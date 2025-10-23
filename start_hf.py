#!/usr/bin/env python3
"""
Hugging Face Spaces startup script
Supports both FastAPI and Gradio deployment modes
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Start the application based on environment variables"""
    
    # Get configuration from environment
    mode = os.getenv("HF_MODE", "gradio")  # "fastapi" or "gradio"
    port = int(os.getenv("PORT", 7860))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 Starting AI-Newz in {mode.upper()} mode")
    print(f"📡 Host: {host}")
    print(f"🔌 Port: {port}")
    
    # Set PYTHONPATH
    project_root = Path(__file__).parent.absolute()
    os.environ["PYTHONPATH"] = str(project_root)
    
    try:
        if mode.lower() == "fastapi":
            # Start FastAPI backend
            print("🔧 Starting FastAPI backend...")
            subprocess.run([
                sys.executable, "-m", "uvicorn",
                "app.main:app",
                "--host", host,
                "--port", str(port),
                "--workers", "1"
            ], check=True)
            
        elif mode.lower() == "gradio":
            # Start Gradio interface
            print("🎨 Starting Gradio interface...")
            subprocess.run([
                sys.executable, "gradio_app.py"
            ], check=True)
            
        else:
            print(f"❌ Unknown mode: {mode}")
            print("Available modes: 'fastapi', 'gradio'")
            sys.exit(1)
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start application: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        sys.exit(0)

if __name__ == "__main__":
    main()
