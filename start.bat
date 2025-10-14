@echo off
REM AI-Newz Universal Startup Script for Windows
REM This script starts both backend and frontend servers

echo Starting AI-Newz Platform...
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

REM Start the Python startup script using full path
python "%SCRIPT_DIR%start.py"

REM If we get here, the script exited
pause
