@echo off
REM AI-Newz Universal Startup Script for Windows Command Prompt
REM This script starts both backend and frontend servers
REM 
REM IMPORTANT: For PowerShell users, use start.ps1 instead
REM Manual command: cd "F:\cursor files\4thOct_buildathon" && python start.py

echo Starting AI-Newz Platform...
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

REM Change to the project directory (handles the C: drive issue)
set PROJECT_DIR=F:\cursor files\4thOct_buildathon
if exist "%PROJECT_DIR%" (
    cd /d "%PROJECT_DIR%"
    echo [OK] Changed to project directory: %PROJECT_DIR%
) else (
    echo [WARN] Project directory not found at %PROJECT_DIR%
    echo [WARN] Using script directory: %SCRIPT_DIR%
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo [OK] Python: %%i
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version 2^>^&1') do echo [OK] Node.js: %%i
)

REM Start the Python startup script
echo.
echo [INFO] Starting servers...
echo [INFO] Use Ctrl+C to stop both servers
echo.

python start.py

REM If we get here, the script exited
echo.
echo Servers stopped. Press any key to exit...
pause >nul
