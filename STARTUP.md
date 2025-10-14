# 🚀 AI-Newz Project Startup

## Quick Start

The AI-Newz platform now uses a **single universal startup script** that handles everything automatically!

### Option 1: Python Script (Recommended)
```bash
python start.py
```

### Option 2: Platform-Specific Scripts
- **Windows Batch**: `start.bat`
- **Windows PowerShell**: `start.ps1`

## ✨ What the Startup Script Does

1. **🔍 Dependency Check**: Verifies Python, Node.js, and npm are installed
2. **📁 Project Verification**: Ensures all required files and directories exist
3. **🔄 Process Management**: Kills any existing processes on ports 8000 and 3000
4. **🚀 Server Startup**: Starts both backend and frontend servers
5. **⏳ Health Check**: Waits for servers to be ready and accessible
6. **📊 Status Display**: Shows server URLs and status information
7. **🛑 Graceful Shutdown**: Handles Ctrl+C to stop all servers cleanly

## 🎯 Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Automatic Detection**: Finds project directory automatically
- **Error Handling**: Comprehensive error messages and recovery
- **Process Management**: Kills conflicting processes automatically
- **Health Monitoring**: Waits for servers to be ready
- **Beautiful Output**: Color-coded status messages
- **Graceful Shutdown**: Clean exit with Ctrl+C

## 📋 Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Project Dependencies** installed:
  ```bash
  pip install -r requirements.txt
  cd frontend && npm install
  ```

## 🔧 Advanced Usage

```bash
# Kill existing processes and exit
python start.py --kill

# Show help
python start.py --help
```

## 🌐 Server URLs

Once started, access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🛠️ Troubleshooting

### Common Issues

1. **"Python not found"**
   - Install Python 3.8+ and add to PATH

2. **"Node.js not found"**
   - Install Node.js 16+ and add to PATH

3. **"Port already in use"**
   - The script automatically kills conflicting processes
   - If issues persist, run `python start.py --kill`

4. **"Missing dependencies"**
   - Run `pip install -r requirements.txt`
   - Run `cd frontend && npm install`

### Manual Startup (if needed)

If the universal script fails, you can start servers manually:

```bash
# Backend only
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend only (in separate terminal)
cd frontend
npm run dev
```

## 🔄 Recent Changes

- Frontend RSS page now requests articles with `prefer_images=true` by default to prioritize entries with images.
- Fixed async auth headers in RSS Source modal save path by awaiting `getAuthHeaders()`.

## 📝 Notes

- The startup script automatically handles directory navigation
- All processes are managed and can be stopped with Ctrl+C
- The script provides real-time status updates
- Error messages are color-coded for easy identification

## 🎨 Platform Features

- ✅ **Authentication**: Google OAuth integration
- ✅ **Newsletter Generation**: AI-powered newsletter creation
- ✅ **RSS Management**: Complete RSS feed management system
- ✅ **Content Analysis**: Advanced content processing and filtering
- ✅ **Dashboard**: Comprehensive user dashboard
- ✅ **Save to Draft**: Save newsletters as drafts
- ✅ **Edit Newsletter**: Edit existing newsletters
- ✅ **Publish Newsletter**: Publish newsletters to subscribers