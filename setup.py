#!/usr/bin/env python3
"""
CreatorPulse Backend Setup Script
"""
import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def main():
    """Main setup function"""
    print("🚀 Setting up AI-Newz Backend...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} detected")
    
    # Install dependencies
    if not run_command("pip install -r requirements.txt", "Installing dependencies"):
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Check if .env exists
    if not os.path.exists(".env"):
        print("⚠️  .env file not found. Please copy env.example to .env and configure it.")
        print("   cp env.example .env")
        print("   nano .env")
        return
    
    print("✅ .env file found")
    
    # Initialize Alembic
    if not run_command("alembic init alembic", "Initializing Alembic"):
        print("⚠️  Alembic already initialized or failed to initialize")
    
    # Create initial migration
    if not run_command("alembic revision --autogenerate -m 'Initial migration'", "Creating initial migration"):
        print("⚠️  Failed to create initial migration")
    
    print("\n🎉 Setup completed!")
    print("\nNext steps:")
    print("1. Configure your .env file with database and Google OAuth credentials")
    print("2. Create your database: createdb creatorpulse")
    print("3. Run migrations: alembic upgrade head")
    print("4. Start the server: python start.py")
    print("\nAPI will be available at: http://localhost:8000")
    print("API docs at: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
