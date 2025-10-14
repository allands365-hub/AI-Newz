# AI-Newz Universal Startup Script for PowerShell
# This script starts both backend and frontend servers

Write-Host "Starting AI-Newz Platform..." -ForegroundColor Green
Write-Host ""

# Get the directory where this PowerShell script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

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
python "$ScriptDir\start.py"

# If we get here, the script exited
Read-Host "Press Enter to exit"
