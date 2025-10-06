#!/bin/bash

# AI-Newz Frontend Setup Script

echo "🚀 Setting up AI-Newz Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found. Creating from template..."
    cp env.local.example .env.local
    echo "✅ Created .env.local from template"
    echo "📝 Please edit .env.local with your configuration:"
    echo "   - NEXT_PUBLIC_API_URL: Backend API URL"
    echo "   - NEXT_PUBLIC_GOOGLE_CLIENT_ID: Google OAuth Client ID"
else
    echo "✅ .env.local file found"
fi

# Type check
echo "🔍 Running type check..."
if npm run type-check; then
    echo "✅ Type check passed"
else
    echo "⚠️  Type check failed. Please fix TypeScript errors."
fi

echo ""
echo "🎉 Frontend setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure your .env.local file with API URL and Google OAuth credentials"
echo "2. Start the development server: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Available scripts:"
echo "  npm run dev        - Start development server"
echo "  npm run build      - Build for production"
echo "  npm run start      - Start production server"
echo "  npm run lint       - Run ESLint"
echo "  npm run type-check - Run TypeScript type check"
