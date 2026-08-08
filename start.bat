@echo off
title FloatChat - AI Ocean Intelligence Platform
cls

echo ==============================================================================
echo                      FloatChat Server Bootstrapper
echo ==============================================================================
echo.

echo [System] Navigating to frontend...
cd /d "%~dp0frontend"

echo [System] Installing node dependencies...
call npm install

echo [System] Building frontend distribution...
call npm run build

echo [System] Navigating to backend...
cd /d "%~dp0backend"

echo [System] Installing Python requirements...
call pip install -r requirements.txt

echo.
echo ========================================
echo FloatChat
echo ========================================
echo Frontend and backend build complete.
echo Starting FastAPI on port 8000...
echo.
echo FloatChat is running at http://localhost:8000
echo ========================================
echo.

call python -m uvicorn main:app --host 0.0.0.0 --port 8000

echo.
echo [System] Server has stopped.
pause
