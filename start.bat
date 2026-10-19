@echo off
title AssetForge - Starting...
color 0B

echo.
echo ========================================
echo   AssetForge - Image to 3D Pipeline
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download the LTS version
    echo 3. Install it
    echo 4. Restart your computer
    echo 5. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing dependencies for the first time...
    echo (This only happens once and takes 1-2 minutes)
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Installation failed!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed!
    echo.
)

REM Check if dist folder exists
if not exist "dist\" (
    echo [INFO] Building the app for the first time...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Build complete!
    echo.
)

echo ========================================
echo   Starting server...
echo   Open your browser to:
echo   http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

pause
