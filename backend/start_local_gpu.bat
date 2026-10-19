@echo off
title AssetForge Local GPU Server
color 0A
chcp 65001 >nul 2>&1

echo.
echo ============================================================
echo   Starting AssetForge Local GPU Server...
echo ============================================================
echo.

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

REM Check if TripoSR exists
if not exist "TripoSR" (
    echo [ERROR] TripoSR not found!
    echo Please run setup_local_gpu.bat first
    pause
    exit /b 1
)

echo Starting server on http://localhost:8000
echo.
echo Press Ctrl+C to stop
echo.

python local_gpu_server.py

pause
