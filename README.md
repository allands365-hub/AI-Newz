# AI-Newz

AI-powered newsletter creation platform that aggregates trusted sources, detects trends, and generates ready-to-send content in under 20 minutes.

## 🚀 Features

- **Google OAuth 2.0** - Seamless one-click authentication
- **AI-Powered Generation** - OpenAI GPT-4 integration for content creation
- **Smart Aggregation** - Automatic content collection from trusted sources
- **Trend Detection** - Real-time trend analysis and insights
- **Time Saving** - Reduce newsletter creation from 2-3 hours to <20 minutes
- **High Engagement** - Achieve 70%+ draft acceptance rate
- **Modern UI/UX** - Beautiful, responsive interface

## 🏗️ Architecture

### Backend (FastAPI + Python)
- **Authentication**: Google OAuth 2.0 + JWT
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Caching**: Redis for performance
- **AI Integration**: OpenAI GPT-4 API
- **Content Sources**: RSS feeds, APIs, web scraping

### Frontend (Next.js + React)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand for global state management
- **Authentication**: Google Sign-In + JWT tokens
- **Type Safety**: Full TypeScript support

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Google Cloud Console account

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp env.example .env
# Edit .env with your configuration

# Setup database
createdb ai_newz
alembic upgrade head

# Start backend
python start.py
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
cp env.local.example .env.local
# Edit .env.local with your configuration

# Start frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Backend Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_newz
REDIS_URL=redis://localhost:6379

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# JWT
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Frontend Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## 📚 API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

- `POST /api/v1/auth/google` - Google OAuth authentication
- `POST /api/v1/auth/google/verify` - Verify Google ID token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/newsletters/generate` - Generate newsletter
- `GET /api/v1/content/articles` - Get content feed

## 🎨 UI Components

### Google Sign-In
```tsx
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';

<GoogleSignIn
  onSuccess={(user) => console.log('Success:', user)}
  onError={(error) => console.error('Error:', error)}
/>
```

### Authentication Hook
```tsx
import { useAuth } from '@/hooks/useAuth';

const { user, isAuthenticated, handleGoogleAuth, handleLogout } = useAuth();
```

## 🗄️ Database Schema

### Users Table
- `id` - UUID primary key
- `email` - User email (unique)
- `name` - User display name
- `google_id` - Google OAuth ID
- `auth_provider` - 'google' or 'email'
- `subscription_tier` - 'free', 'premium', 'enterprise'

### User Preferences
- `user_id` - Foreign key to users
- `preferred_sources` - Array of source IDs
- `content_categories` - Array of categories
- `newsletter_frequency` - 'daily', 'weekly', 'monthly'
- `ai_style` - 'professional', 'casual', 'technical'

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for email auth
- **CORS Protection** - Configured origins
- **Rate Limiting** - API request limits
- **Input Validation** - Pydantic schemas
- **SQL Injection Protection** - SQLAlchemy ORM

## 📊 Performance

- **Caching**: Redis for API responses
- **Database Indexing**: Optimized queries
- **CDN**: Static asset delivery
- **Code Splitting**: Next.js automatic splitting
- **Image Optimization**: Next.js image optimization

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend (Railway/Render)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

## 📈 Monitoring

- **Error Tracking**: Sentry integration
- **Analytics**: User engagement metrics
- **Performance**: API response times
- **Uptime**: Service health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Google for OAuth 2.0
- FastAPI team for the excellent framework
- Next.js team for the React framework
- Tailwind CSS for the utility-first CSS

## 📞 Support

- **Documentation**: [docs.creatorpulse.com](https://docs.creatorpulse.com)
- **Issues**: [GitHub Issues](https://github.com/creatorpulse/issues)
- **Email**: support@creatorpulse.com

---

**AI-Newz** - Turn hours of research into minutes of content. 🚀