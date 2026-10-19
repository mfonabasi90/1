@echo off
title AssetForge Local GPU Setup
color 0B
chcp 65001 >nul 2>&1

echo.
echo ============================================================
echo   AssetForge Local GPU Setup
echo ============================================================
echo.
echo   This will install TripoSR for local 3D generation
echo   Requirements: NVIDIA GPU with 6GB+ VRAM
echo.
echo ============================================================
echo.

REM Check Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found!
    echo.
    echo Please install Python 3.10+ from https://python.org
    echo IMPORTANT: Check "Add Python to PATH" during install
    echo.
    pause
    exit /b 1
)

echo [OK] Python found
python --version
echo.

REM Check NVIDIA GPU
nvidia-smi >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] NVIDIA GPU not detected or drivers not installed
    echo.
    echo You can still run on CPU, but it will be very slow
    echo.
    choice /C YN /M "Continue anyway?"
    if errorlevel 2 exit /b 1
) else (
    echo [OK] NVIDIA GPU detected
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    echo.
)

REM Create virtual environment
echo [1/7] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip
echo [2/7] Upgrading pip...
python -m pip install --upgrade pip setuptools wheel
echo.

REM Install PyTorch with CUDA
echo [3/7] Installing PyTorch with CUDA support...
echo (This is a large download, about 2GB)
echo.
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] CUDA installation failed, trying CPU version...
    pip install torch torchvision
)
echo.

REM Install other dependencies
echo [4/7] Installing dependencies...
pip install fastapi uvicorn python-multipart pillow numpy trimesh rembg huggingface-hub
echo.

REM Clone TripoSR
echo [5/7] Downloading TripoSR model...
if not exist "TripoSR" (
    git clone https://github.com/VAST-AI-Research/TripoSR.git
    echo [OK] TripoSR downloaded
) else (
    echo [OK] TripoSR already exists
)
echo.

REM Install TripoSR dependencies
echo [6/7] Installing TripoSR dependencies...
cd TripoSR
pip install -r requirements.txt
cd ..
echo.

REM Download model weights
echo [7/7] Downloading model weights (this may take a while)...
python -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='stabilityai/TripoSR', filename='model.ckpt', local_dir='TripoSR/checkpoints'); hf_hub_download(repo_id='stabilityai/TripoSR', filename='config.yaml', local_dir='TripoSR/checkpoints')"
echo.

echo ============================================================
echo.
echo   [DONE] Setup Complete!
echo.
echo   To start the server:
echo     Double-click "start_local_gpu.bat"
echo.
echo   Then open http://localhost:8000 in your browser
echo.
echo ============================================================
echo.
pause
