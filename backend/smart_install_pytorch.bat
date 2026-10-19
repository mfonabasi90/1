@echo off
title Smart PyTorch CUDA Installer
color 0B
chcp 65001 >nul 2>&1

echo.
echo ============================================================
echo   Smart PyTorch CUDA Installer
echo ============================================================
echo.

REM Check Python version
echo [1/5] Checking Python version...
python --version
python -c "import sys; print(f'Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"
echo.

REM Check if Python version is supported
python -c "import sys; v = sys.version_info; exit(0 if v.major == 3 and v.minor >= 8 and v.minor <= 11 else 1)"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python version not supported!
    echo PyTorch requires Python 3.8, 3.9, 3.10, or 3.11
    echo.
    echo Please install Python 3.10 from: https://python.org/downloads
    pause
    exit /b 1
)

echo [OK] Python version is supported
echo.

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    echo [2/5] Activating virtual environment...
    call venv\Scripts\activate.bat
    echo [OK] Virtual environment activated
) else (
    echo [WARNING] Virtual environment not found
    echo Creating one now...
    python -m venv venv
    call venv\Scripts\activate.bat
)
echo.

REM Check NVIDIA GPU
echo [3/5] Checking NVIDIA GPU...
nvidia-smi --query-gpu=name,driver_version --format=csv,noheader 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NVIDIA GPU not detected!
    echo Please install NVIDIA drivers from: https://nvidia.com/drivers
    pause
    exit /b 1
)
echo.

REM Remove old PyTorch
echo [4/5] Removing old PyTorch...
pip uninstall -y torch torchvision torchaudio 2>nul
pip cache purge 2>nul
echo [OK] Old PyTorch removed
echo.

REM Try installing PyTorch with different CUDA versions
echo [5/5] Installing PyTorch with CUDA support...
echo.
echo Trying CUDA 11.8 (most compatible)...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] CUDA 11.8 failed, trying CUDA 12.1...
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [WARNING] CUDA 12.1 failed, trying default PyPI...
        pip install torch torchvision torchaudio
        
        if %ERRORLEVEL% NEQ 0 (
            echo.
            echo [ERROR] All installation methods failed!
            echo.
            echo Please try manual installation:
            echo 1. Go to: https://pytorch.org/get-started/locally/
            echo 2. Select your configuration
            echo 3. Copy the pip command
            echo 4. Run it here
            echo.
            pause
            exit /b 1
        )
    )
)

echo.
echo ============================================================
echo   Verifying installation...
echo ============================================================
echo.

python -c "import torch; print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('CUDA version:', torch.version.cuda if torch.version.cuda else 'None'); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] PyTorch installation verification failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo.
echo   [SUCCESS] PyTorch installed with CUDA support!
echo.
echo   Next steps:
echo     1. Run: start_local_gpu.bat
echo     2. Open: http://localhost:8000
echo.
echo ============================================================
echo.
pause
