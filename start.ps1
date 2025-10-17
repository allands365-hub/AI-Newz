# AI-Newz Universal Startup Script for PowerShell
# This script starts both backend and frontend servers
# 
# IMPORTANT: PowerShell uses ';' instead of '&&' as command separator
# If running manually, use: cd "F:\cursor files\4thOct_buildathon"; python start.py

Write-Host "Starting AI-Newz Platform..." -ForegroundColor Green
Write-Host ""

# Get the directory where this PowerShell script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Change to the project directory (handles the C: drive issue)
$ProjectDir = "F:\cursor files\4thOct_buildathon"
if (Test-Path $ProjectDir) {
    Set-Location $ProjectDir
    Write-Host "✅ Changed to project directory: $ProjectDir" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Project directory not found at $ProjectDir" -ForegroundColor Yellow
    Write-Host "Using script directory: $ScriptDir" -ForegroundColor Yellow
}

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the Python startup script
Write-Host "🚀 Starting servers..." -ForegroundColor Blue
Write-Host "Note: Use Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Prefer the project's virtual environment Python if available
$VenvPython = Join-Path $ProjectDir "venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    Write-Host "[INFO] Using virtual environment: $VenvPython" -ForegroundColor Cyan
    & $VenvPython start.py
} else {
    Write-Host "[WARN] Virtual environment not found at $VenvPython; falling back to system Python" -ForegroundColor Yellow
    python start.py
}

# If we get here, the script exited
Write-Host ""
Write-Host "Servers stopped. Press Enter to exit..." -ForegroundColor Yellow
Read-Host
