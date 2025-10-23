# AI-Newz Render Deployment Guide

## 🚀 Deployment Options

### Option 1: Blueprint Deployment (Recommended)
Use the `render.yaml` blueprint for complete infrastructure setup:

1. **Connect Repository**: Link your GitHub repository to Render
2. **Create Blueprint**: Use the `render.yaml` file to create all services at once
3. **Set Environment Variables**: Configure all required API keys in Render dashboard
4. **Deploy**: Render will automatically deploy both frontend and backend

### Option 2: Manual Service Setup
If you prefer to set up services individually:

#### Backend Service
- **Type**: Web Service
- **Environment**: Python
- **Python Version**: 3.11.10
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python start.py`
- **Health Check**: `/health`

#### Frontend Service
- **Type**: Static Site
- **Build Command**: `cd frontend && npm ci && npm run build`
- **Publish Directory**: `frontend/out`

## 🔧 Required Environment Variables

Set these in your Render dashboard:

### API Keys
```
GROK_API_KEY=your_grok_api_key_here
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
RESEND_API_KEY=your_resend_api_key_here
```

### Google OAuth (Optional)
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Auto-Generated
```
JWT_SECRET_KEY=auto_generated_by_render
```

## 📁 File Structure for Deployment

```
├── render.yaml              # Blueprint configuration
├── Procfile                 # Process definition
├── .python-version          # Python version specification
├── runtime.txt              # Alternative Python version spec
├── requirements.txt         # Python dependencies
├── start.py                 # Application startup script
├── app/                     # Backend application
└── frontend/                # Frontend application
    ├── package.json
    ├── next.config.js
    └── src/
```

## 🐛 Troubleshooting

### Common Issues

1. **Python Version Mismatch**
   - Ensure `runtime.txt` contains `python-3.11`
   - Check `.python-version` file
   - Verify Python version in service settings

2. **Build Failures**
   - Check `requirements.txt` for incompatible packages
   - Ensure all dependencies are Linux-compatible
   - Remove Windows-specific packages (like `pywin32`)

3. **Environment Variables**
   - Verify all required variables are set
   - Check variable names match exactly
   - Ensure no typos in API keys

4. **Database Connection**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure database is accessible

### Health Check Endpoints

- **Backend Health**: `https://your-backend-url.onrender.com/health`
- **API Status**: `https://your-backend-url.onrender.com/api/health`

## 🔄 Deployment Process

1. **Push Changes**: Commit and push to main branch
2. **Auto-Deploy**: Render automatically detects changes
3. **Build Phase**: Installs dependencies and builds application
4. **Start Phase**: Runs the application
5. **Health Check**: Verifies application is running

## 📊 Monitoring

- **Logs**: Available in Render dashboard
- **Metrics**: CPU, Memory, Response Time
- **Alerts**: Configure notifications for failures

## 🔒 Security Considerations

- Never commit API keys to repository
- Use Render's environment variable system
- Enable HTTPS (automatic with Render)
- Configure CORS properly
- Use strong JWT secrets

## 📈 Scaling

- **Free Plan**: 1 instance, 512MB RAM
- **Starter Plan**: 1 instance, 1GB RAM
- **Standard Plan**: Multiple instances, auto-scaling

## 🆘 Support

- **Render Docs**: https://render.com/docs
- **Troubleshooting**: https://render.com/docs/troubleshooting-deploys
- **Community**: https://community.render.com
