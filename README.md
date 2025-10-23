# AI-Newz: AI-Powered Newsletter Generator

An intelligent newsletter creation platform that uses AI to generate personalized newsletters from RSS feeds and trending topics.

## 🚀 Features

- **AI-Powered Content Generation**: Uses Grok AI to create engaging newsletter content
- **RSS Feed Integration**: Automatically fetches and processes articles from multiple RSS sources
- **Email Templates**: Beautiful, responsive email templates for newsletters
- **User Management**: Secure authentication and user preferences
- **Analytics**: Track newsletter performance and engagement

## 🛠️ Technology Stack

- **Backend**: FastAPI, Python 3.11+
- **Frontend**: Next.js, React, Tailwind CSS
- **AI**: Grok API (via Groq)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend API
- **Authentication**: Google OAuth

## 📋 API Endpoints

### Health Check
- `GET /` - Welcome message and status
- `GET /health` - Health check endpoint

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user

### Newsletters
- `GET /api/v1/newsletters` - List user newsletters
- `POST /api/v1/newsletters/generate` - Generate new newsletter
- `POST /api/v1/newsletters/publish-direct` - Publish newsletter directly

### RSS Feeds
- `GET /api/v1/rss/sources` - List RSS sources
- `POST /api/v1/rss/sources` - Add new RSS source
- `GET /api/v1/rss/articles` - Get articles from RSS feeds

## 🔧 Environment Variables

Set these in your Hugging Face Spaces environment:

```bash
# AI API Keys
GROK_API_KEY=your_grok_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GROK_API_URL=https://api.groq.com/openai/v1

# Database
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Email
RESEND_API_KEY=your_resend_api_key_here

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Security
JWT_SECRET_KEY=your_jwt_secret_key_here
```

## 🚀 Deployment

### Hugging Face Spaces

1. **Create a new Space** on Hugging Face
2. **Set the SDK** to "Gradio" or "Streamlit" (for web apps)
3. **Upload your code** to the Space
4. **Set environment variables** in Space settings
5. **Deploy!**

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

## 📖 Usage

1. **Start the application** - The API will be available at the provided URL
2. **Check health** - Visit `/health` to ensure the service is running
3. **Generate newsletters** - Use the API endpoints to create and manage newsletters
4. **View documentation** - Visit `/docs` for interactive API documentation

## 🔒 Security

- All API endpoints require authentication
- Environment variables are securely managed
- CORS is properly configured
- Input validation and sanitization

## 📊 Monitoring

- Health check endpoint for monitoring
- Structured logging
- Error handling and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue or contact the development team.

---

**Built with ❤️ using FastAPI, Next.js, and AI**
