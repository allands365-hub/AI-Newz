# Docker Deployment on Hugging Face Spaces

## 🐳 Deploy AI-Newz with Docker on Hugging Face Spaces

This guide shows you how to deploy your AI-Newz application using Docker on Hugging Face Spaces for better control and consistency.

## 📋 Prerequisites

1. **Hugging Face Account**: Sign up at [huggingface.co](https://huggingface.co)
2. **Docker Knowledge**: Basic understanding of Docker
3. **Git Repository**: Your code in a Git repository
4. **API Keys**: Have your API keys ready

## 🚀 Step-by-Step Docker Deployment

### Step 1: Create a New Space with Docker

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"**
3. Fill in the details:
   - **Space name**: `ai-newz` (or your preferred name)
   - **License**: MIT
   - **SDK**: **Docker** (select this instead of Gradio)
   - **Hardware**: CPU basic (free tier) or GPU (paid)
   - **Visibility**: Public or Private

### Step 2: Prepare Your Docker Files

Ensure you have these files in your repository:

```
├── Dockerfile.hf              # Docker configuration for Hugging Face
├── docker-compose.hf.yml      # Docker Compose for local testing
├── .dockerignore              # Files to exclude from Docker build
├── requirements_hf.txt        # Python dependencies
├── app.py                     # FastAPI entry point
├── gradio_app.py              # Gradio web interface
└── app/                       # Your FastAPI application
    ├── main.py
    ├── api/
    ├── services/
    └── ...
```

### Step 3: Configure Environment Variables

In your Space settings, add these environment variables:

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

# Hugging Face specific
PORT=7860
API_BASE_URL=http://localhost:7860
```

### Step 4: Deploy Options

#### Option A: FastAPI Backend Only
```dockerfile
# In Dockerfile.hf, change the CMD to:
CMD ["python", "app.py"]
```

#### Option B: Gradio Web Interface (Recommended)
```dockerfile
# In Dockerfile.hf, keep the CMD as:
CMD ["python", "gradio_app.py"]
```

#### Option C: Both (Multi-stage)
```dockerfile
# You can create a multi-stage build to support both
# See advanced configuration below
```

### Step 5: Deploy

1. **Push your code** to the repository
2. **Hugging Face will automatically build** the Docker image
3. **Monitor the build logs** for any errors
4. **Your app will be available** at `https://huggingface.co/spaces/yourusername/ai-newz`

## 🔧 Advanced Docker Configuration

### Multi-Stage Build (Optional)

Create a `Dockerfile.multi` for more advanced setups:

```dockerfile
# Multi-stage Dockerfile for Hugging Face Spaces
FROM python:3.11-slim as base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements_hf.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Default command (can be overridden)
CMD ["python", "gradio_app.py"]
```

### Docker Compose for Local Testing

Use `docker-compose.hf.yml` for local testing:

```bash
# Build and run locally
docker-compose -f docker-compose.hf.yml up --build

# Run in background
docker-compose -f docker-compose.hf.yml up -d

# View logs
docker-compose -f docker-compose.hf.yml logs -f

# Stop services
docker-compose -f docker-compose.hf.yml down
```

## 🐳 Docker Benefits on Hugging Face

### Advantages:
- **✅ Full Control**: Complete control over the environment
- **✅ Consistency**: Same environment everywhere
- **✅ Dependencies**: Install any system packages you need
- **✅ Custom Setup**: Configure the environment exactly as needed
- **✅ Reproducibility**: Same build every time
- **✅ Security**: Better isolation and security

### Considerations:
- **⚠️ Build Time**: Docker builds can take longer
- **⚠️ Image Size**: Larger images take more time to deploy
- **⚠️ Complexity**: More complex than simple Python apps

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**:
   ```bash
   # Check Docker build locally
   docker build -f Dockerfile.hf -t ai-newz .
   
   # Check for syntax errors
   docker build --no-cache -f Dockerfile.hf -t ai-newz .
   ```

2. **Port Issues**:
   ```bash
   # Ensure PORT environment variable is set
   ENV PORT=7860
   
   # Expose the correct port
   EXPOSE 7860
   ```

3. **Permission Issues**:
   ```bash
   # Ensure proper user permissions
   RUN useradd --create-home --shell /bin/bash app && \
       chown -R app:app /app
   USER app
   ```

4. **Health Check Failures**:
   ```bash
   # Test health check locally
   curl -f http://localhost:7860/health
   
   # Check if the endpoint exists
   curl -f http://localhost:7860/
   ```

### Debug Commands:

```bash
# Build and run locally
docker build -f Dockerfile.hf -t ai-newz .
docker run -p 7860:7860 --env-file .env ai-newz

# Check container logs
docker logs <container_id>

# Enter container for debugging
docker exec -it <container_id> /bin/bash

# Check if app is running
docker exec <container_id> ps aux
```

## 📊 Performance Optimization

### Optimize Docker Image:

1. **Use .dockerignore** to exclude unnecessary files
2. **Multi-stage builds** to reduce final image size
3. **Layer caching** by copying requirements first
4. **Alpine images** for smaller size (if compatible)

### Example Optimized Dockerfile:

```dockerfile
FROM python:3.11-alpine as base

# Install only necessary system packages
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libpq-dev \
    curl

# Rest of your Dockerfile...
```

## 🔄 CI/CD with Docker

### GitHub Actions Example:

```yaml
name: Build and Deploy to Hugging Face

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: docker build -f Dockerfile.hf -t ai-newz .
      
      - name: Test Docker image
        run: docker run --rm -d -p 7860:7860 ai-newz
      
      - name: Wait for service
        run: sleep 30
      
      - name: Health check
        run: curl -f http://localhost:7860/health
```

## 📚 Additional Resources

- [Hugging Face Spaces Docker Guide](https://huggingface.co/docs/hub/spaces-sdks-docker)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Python Docker Guide](https://docs.docker.com/language/python/)

## 🆘 Support

- **Hugging Face Community**: [Hugging Face Forums](https://discuss.huggingface.co/)
- **Docker Documentation**: [Docker Docs](https://docs.docker.com/)
- **GitHub Issues**: Create issues in your repository

---

**Happy Docker Deploying! 🐳🚀**
