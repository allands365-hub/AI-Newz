# AI-Newz Quick Start Guide

Get AI-Newz up and running in minutes!

## 🚀 Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Google Cloud Console account

## ⚡ Quick Setup

### 1. Backend Setup (5 minutes)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp env.local .env
# Edit .env with your Google OAuth credentials

# Setup database
createdb ai_newz
alembic upgrade head

# Start backend
python start.py
```

Backend will be running at `http://localhost:8000`

### 2. Frontend Setup (3 minutes)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (already done!)
# Your .env.local is already configured with Google Client ID

# Start frontend
npm run dev
```

Frontend will be running at `http://localhost:3000`

### 3. Google OAuth Setup (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:3000` (frontend)
   - `http://localhost:8000` (backend)
6. Copy Client ID to your `.env` files

## 🎯 Test the App

1. Open `http://localhost:3000`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Get redirected to dashboard
5. Success! 🎉

## 📚 API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔧 Environment Files

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/ai_newz
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET_KEY=your_jwt_secret_key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_APP_NAME=AI-Newz
```

## 🐛 Troubleshooting

### Backend Issues
- **Database connection**: Check PostgreSQL is running
- **Google OAuth**: Verify Client ID and Secret
- **Port conflicts**: Change port in `start.py`

### Frontend Issues
- **API connection**: Check backend is running
- **Google Sign-In**: Verify Client ID in `.env.local`
- **Build errors**: Run `npm run type-check`

## 📞 Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review API docs at `http://localhost:8000/docs`
- Check console logs for error messages

---

**AI-Newz** - Turn hours of research into minutes of content! 🚀
