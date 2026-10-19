@echo off
title Force GPU Fix - Complete Reinstall
color 0E
chcp 65001 >nul 2>&1

echo.
echo ============================================================
echo   FORCE GPU FIX - Complete PyTorch Reinstall
echo ============================================================
echo.
echo   This will completely remove and reinstall PyTorch with
echo   CUDA support for your RTX 4090
echo.
echo ============================================================
echo.

REM Check if venv exists
if not exist "venv" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup_local_gpu.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
echo [1/8] Activating virtual environment...
call venv\Scripts\activate.bat
echo [OK] Virtual environment activated
echo.

REM Show current state
echo [2/8] Current PyTorch status:
python -c "import torch; print('  Version:', torch.__version__); print('  CUDA available:', torch.cuda.is_available()); print('  Device count:', torch.cuda.device_count())" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] PyTorch not working properly
)
echo.

REM Check GPU
echo [3/8] Checking NVIDIA GPU:
nvidia-smi --query-gpu=name,driver_version --format=csv,noheader 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NVIDIA GPU not detected!
    echo Please install/update NVIDIA drivers from https://nvidia.com/drivers
    pause
    exit /b 1
)
echo.

REM Completely remove old PyTorch
echo [4/8] Removing old PyTorch installation...
pip uninstall -y torch torchvision torchaudio
pip cache purge
echo [OK] Old PyTorch removed
echo.

REM Install PyTorch with CUDA 12.1 (correct for RTX 4090)
echo [5/8] Installing PyTorch with CUDA 12.1...
echo (This downloads about 2.5GB, takes 3-5 minutes)
echo.
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 --force-reinstall --no-cache-dir
echo.

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PyTorch installation failed!
    echo Trying alternative method...
    pip install torch torchvision torchaudio
    echo.
)

REM Verify installation
echo [6/8] Verifying PyTorch installation:
echo.
python -c "import torch; print('  PyTorch version:', torch.__version__); print('  CUDA available:', torch.cuda.is_available()); print('  CUDA version:', torch.version.cuda if torch.version.cuda else 'None'); print('  GPU count:', torch.cuda.device_count()); print('  GPU name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
echo.

REM Test GPU
echo [7/8] Testing GPU:
python -c "import torch; x = torch.randn(1000, 1000).cuda(); print('  [OK] GPU test passed! Tensor on:', x.device)" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] GPU test failed - PyTorch still can't use GPU
    echo.
    echo Possible causes:
    echo - NVIDIA driver too old (need 528.33+ for RTX 4090)
    echo - CUDA toolkit mismatch
    echo - PyTorch version incompatible
    echo.
    echo Please update NVIDIA drivers: https://www.nvidia.com/drivers
) else (
    echo [OK] GPU is working!
)
echo.

REM Final check
echo [8/8] Final status:
python check_gpu.py
echo.

echo ============================================================
echo.
echo   [DONE] Force GPU fix complete!
echo.
if exist "venv\Scripts\python.exe" (
    echo   Next step: Run start_local_gpu.bat
) else (
    echo   [ERROR] Something went wrong - check output above
)
echo.
echo ============================================================
echo.
pause
