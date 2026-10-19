@echo off
title Fix GPU Detection
color 0E
chcp 65001 >nul 2>&1

echo.
echo ============================================================
echo   Fixing GPU Detection for AssetForge
echo ============================================================
echo.

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo [STEP 1] Checking current PyTorch installation...
echo.
python -c "import torch; print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('CUDA version:', torch.version.cuda if torch.cuda.is_available() else 'None')"
echo.

echo [STEP 2] Checking NVIDIA GPU...
echo.
nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
echo.

echo [STEP 3] Uninstalling CPU-only PyTorch...
echo.
pip uninstall -y torch torchvision
echo.

echo [STEP 4] Installing PyTorch with CUDA 12.1 support...
echo (This will download about 2GB)
echo.
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
echo.

echo [STEP 5] Verifying installation...
echo.
python -c "import torch; print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('CUDA version:', torch.version.cuda); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
echo.

echo ============================================================
echo.
echo   [DONE] GPU fix complete!
echo.
echo   Now run: start_local_gpu.bat
echo.
echo   You should see: [OK] GPU: NVIDIA GeForce RTX 4090
echo.
echo ============================================================
echo.
pause
