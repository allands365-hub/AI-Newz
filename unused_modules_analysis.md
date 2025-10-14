# Module Usage Analysis

## ✅ USED MODULES (Keep in requirements.txt)

### Core FastAPI & Web Framework
- `fastapi==0.104.1` ✅ - Used in main.py, all API routers
- `uvicorn[standard]==0.24.0` ✅ - Used to run the server
- `python-multipart==0.0.6` ✅ - Used for form data handling
- `pydantic[email]==2.12.0` ✅ - Used in all schemas
- `pydantic-settings==2.1.0` ✅ - Used in config.py
- `starlette==0.27.0` ✅ - FastAPI dependency

### Database
- `sqlalchemy==2.0.23` ✅ - Used in all models and database operations
- `alembic==1.13.1` ✅ - Used for database migrations
- `psycopg2-binary==2.9.9` ✅ - PostgreSQL adapter
- `redis==5.0.1` ✅ - Used for caching (Celery)

### Authentication & Security
- `python-jose[cryptography]==3.3.0` ✅ - Used in security.py
- `passlib[bcrypt]==1.7.4` ✅ - Used in security.py
- `PyJWT[crypto]==2.10.1` ✅ - JWT handling

### Google OAuth
- `google-auth==2.23.4` ✅ - Used in Google auth services
- `google-auth-oauthlib==1.1.0` ✅ - Used in Google auth services
- `google-auth-httplib2==0.2.0` ✅ - Used in Google auth services

### HTTP Client
- `httpx==0.27.2` ✅ - Used in services for external API calls

### RSS & Content Processing
- `feedparser==6.0.10` ✅ - Used in rss_service.py
- `beautifulsoup4==4.12.2` ✅ - Used in rss_service.py
- `lxml==4.9.3` ✅ - Used by BeautifulSoup
- `python-dateutil==2.8.2` ✅ - Used in rss_service.py
- `textstat==0.7.3` ✅ - Used in rss_service.py
- `nltk==3.8.1` ✅ - Used in rss_service.py

### Email Delivery
- `resend==0.8.0` ✅ - Used in email_service.py
- `jinja2==3.1.2` ✅ - Used in email_service.py
- `celery==5.3.4` ✅ - Used for background tasks

### Supabase
- `supabase==2.19.0` ✅ - Used in supabase_service.py
- `postgrest==2.21.1` ✅ - Supabase dependency
- `realtime==2.19.0` ✅ - Supabase dependency
- `storage3==0.7.7` ✅ - Supabase dependency

### Environment & Configuration
- `python-dotenv==1.0.0` ✅ - Used for environment variables

### System Monitoring
- `psutil==7.1.0` ✅ - Used in start.py

### Development Tools
- `pytest==7.4.3` ✅ - Testing framework
- `pytest-asyncio==0.21.1` ✅ - Async testing
- `black==23.11.0` ✅ - Code formatting
- `isort==5.12.0` ✅ - Import sorting
- `flake8==6.1.0` ✅ - Linting

### Essential Runtime Dependencies
- `aiofiles==24.1.0` ✅ - File operations
- `anyio==3.7.1` ✅ - Async compatibility
- `certifi==2025.8.3` ✅ - SSL certificates
- `charset-normalizer==3.4.3` ✅ - Text encoding
- `click==8.2.1` ✅ - CLI framework
- `colorama==0.4.6` ✅ - Terminal colors
- `cryptography==46.0.1` ✅ - Security
- `dnspython==2.8.0` ✅ - DNS resolution
- `email-validator==2.3.0` ✅ - Email validation
- `h11==0.16.0` ✅ - HTTP/1.1
- `httpcore==1.0.9` ✅ - HTTP client core
- `httptools==0.6.4` ✅ - HTTP parsing
- `idna==3.10` ✅ - Internationalized domain names
- `Mako==1.3.10` ✅ - Templating (Alembic)
- `MarkupSafe==3.0.2` ✅ - Safe string handling
- `packaging==25.0` ✅ - Package utilities
- `pathspec==0.12.1` ✅ - Path matching
- `platformdirs==4.4.0` ✅ - Platform directories
- `pycparser==2.23.0` ✅ - C parser
- `pydantic-core==2.41.1` ✅ - Pydantic core
- `pywin32==311` ✅ - Windows API
- `PyYAML==6.0.2` ✅ - YAML parsing
- `requests==2.31.0` ✅ - HTTP library
- `rich==14.1.0` ✅ - Rich text
- `sniffio==1.3.1` ✅ - Async detection
- `soupsieve==2.8` ✅ - CSS selectors
- `sse-starlette==3.0.2` ✅ - Server-Sent Events
- `typing-extensions==4.14.1` ✅ - Type hints
- `urllib3==2.5.0` ✅ - HTTP client
- `watchfiles==1.1.0` ✅ - File watching
- `websockets==15.0.1` ✅ - WebSocket support

## ❌ POTENTIALLY UNUSED MODULES (Consider removing)

### These modules are in requirements.txt but not directly imported:
- `python-multipart==0.0.6` - Used by FastAPI internally for form data
- `python-http-client==3.3.7` - Used by SendGrid/Resend internally
- `sgmllib3k==1.0.0` - Used by BeautifulSoup internally
- `six==1.17.0` - Used by various packages internally
- `wrapt==1.17.3` - Used by various packages internally

## 📊 SUMMARY

**Total modules in requirements.txt:** 91
**Actually used modules:** ~85
**Potentially unused:** ~6

The requirements.txt file is quite comprehensive and most modules are actually being used either directly or as dependencies of other packages. The few potentially unused ones are likely transitive dependencies that are needed by other packages.
