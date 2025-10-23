# Hugging Face Spaces Deployment Guide

## 🚀 Deploy AI-Newz on Hugging Face Spaces

This guide will help you deploy your AI-Newz application on Hugging Face Spaces.

## 📋 Prerequisites

1. **Hugging Face Account**: Sign up at [huggingface.co](https://huggingface.co)
2. **Git Repository**: Your code should be in a Git repository
3. **API Keys**: Have your API keys ready (Grok, Supabase, Resend, etc.)

## 🛠️ Step-by-Step Deployment

### Step 1: Create a New Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"**
3. Fill in the details:
   - **Space name**: `ai-newz` (or your preferred name)
   - **License**: MIT
   - **SDK**: **Gradio** (for web applications)
   - **Hardware**: CPU basic (free tier)
   - **Visibility**: Public or Private

### Step 2: Upload Your Code

1. **Clone your repository** or upload files directly
2. **Key files needed**:
   - `app.py` (main entry point)
   - `requirements_hf.txt` (renamed from requirements.txt)
   - `README.md`
   - `app/` directory (your FastAPI application)
   - All other project files

### Step 3: Configure Environment Variables

In your Space settings, add these environment variables:

```bash
# AI API Keys
GROK_API_KEY=your_grok_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GROK_API_URL=https://api.groq.com/openai/v1

# Database (use Supabase or local SQLite)
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

# Hugging Face specific
PORT=7860
```

### Step 4: Update Configuration

1. **Rename requirements file**:
   ```bash
   mv requirements_hf.txt requirements.txt
   ```

2. **Update database configuration** (optional):
   - For Hugging Face Spaces, you might want to use SQLite instead of PostgreSQL
   - Update `app/core/database.py` to use SQLite for local development

### Step 5: Deploy

1. **Commit and push** your changes
2. **Hugging Face will automatically build** your Space
3. **Monitor the build logs** for any errors
4. **Your app will be available** at `https://huggingface.co/spaces/yourusername/ai-newz`

## 🔧 Configuration Options

### Option 1: Full Application (Recommended)
- Deploy the complete FastAPI backend
- Use external Supabase database
- Full functionality available

### Option 2: Demo Version
- Simplified version with limited features
- Use SQLite for local storage
- Good for showcasing capabilities

### Option 3: API Only
- Deploy just the API endpoints
- Frontend can be deployed separately
- Good for integration with other apps

## 📊 Monitoring and Logs

1. **View logs**: Go to your Space → "Logs" tab
2. **Monitor usage**: Check the "Metrics" tab
3. **Debug issues**: Use the built-in terminal

## 🔒 Security Considerations

1. **Environment Variables**: Never commit API keys to your repository
2. **CORS**: Configure CORS properly for your domain
3. **Rate Limiting**: Implement rate limiting for public APIs
4. **Authentication**: Ensure proper authentication for sensitive endpoints

## 🚀 Advanced Features

### Custom Domain
- Hugging Face Spaces support custom domains
- Configure in Space settings

### GPU Support
- Upgrade to paid tier for GPU access
- Useful for AI model inference

### Persistent Storage
- Use external databases (Supabase, MongoDB, etc.)
- Local storage is not persistent on free tier

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check `requirements.txt` for compatibility
   - Ensure all dependencies are available
   - Check Python version compatibility

2. **Import Errors**:
   - Verify file structure
   - Check `PYTHONPATH` configuration
   - Ensure all modules are included

3. **Database Connection**:
   - Use external database (Supabase recommended)
   - Check connection strings
   - Verify network access

4. **API Key Issues**:
   - Verify environment variables are set
   - Check API key validity
   - Ensure proper permissions

### Debug Steps

1. **Check logs** in the Space interface
2. **Test locally** with the same configuration
3. **Verify environment variables** are set correctly
4. **Check network connectivity** for external services

## 📈 Scaling

### Free Tier Limitations
- CPU: Basic
- Memory: Limited
- Storage: Temporary
- Requests: Rate limited

### Paid Tier Benefits
- More CPU/Memory
- Persistent storage
- Custom domains
- Priority support

## 🔄 Updates and Maintenance

1. **Automatic Updates**: Push to Git repository
2. **Manual Updates**: Use the Space interface
3. **Rollback**: Use Git history to revert changes
4. **Monitoring**: Set up alerts for critical issues

## 📚 Additional Resources

- [Hugging Face Spaces Documentation](https://huggingface.co/docs/hub/spaces)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Gradio Documentation](https://gradio.app/docs/)

## 🆘 Support

- **Hugging Face Community**: [Hugging Face Forums](https://discuss.huggingface.co/)
- **Documentation**: [Hugging Face Docs](https://huggingface.co/docs)
- **GitHub Issues**: Create issues in your repository

---

**Happy Deploying! 🚀**
