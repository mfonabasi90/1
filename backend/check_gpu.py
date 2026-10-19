"""
Diagnostic script to check GPU setup
Run: python check_gpu.py
"""

import sys

print("=" * 60)
print("  AssetForge GPU Diagnostic")
print("=" * 60)
print()

# Check Python version
print("[1/6] Python Version:")
print(f"  {sys.version}")
print()

# Check PyTorch
print("[2/6] PyTorch:")
try:
    import torch
    print(f"  Version: {torch.__version__}")
    print(f"  CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"  CUDA version: {torch.version.cuda}")
        print(f"  GPU: {torch.cuda.get_device_name(0)}")
        print(f"  VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    else:
        print("  ❌ CUDA NOT available - PyTorch can't see your GPU!")
        print()
        print("  This usually means:")
        print("  - PyTorch was installed without CUDA support")
        print("  - CUDA toolkit version doesn't match PyTorch")
        print("  - NVIDIA drivers need updating")
        print()
        print("  FIX: Run fix_gpu.bat to reinstall PyTorch with CUDA")
except ImportError:
    print("  ❌ PyTorch not installed!")
    print("  Run: pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121")
print()

# Check NVIDIA drivers
print("[3/6] NVIDIA Driver:")
import subprocess
try:
    result = subprocess.run(['nvidia-smi', '--query-gpu=name,driver_version', '--format=csv,noheader'], 
                          capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        print(f"  {result.stdout.strip()}")
    else:
        print("  ❌ nvidia-smi failed")
except FileNotFoundError:
    print("  ❌ nvidia-smi not found - NVIDIA drivers not installed?")
except Exception as e:
    print(f"  ❌ Error: {e}")
print()

# Check CUDA toolkit
print("[4/6] CUDA Toolkit:")
try:
    result = subprocess.run(['nvcc', '--version'], capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            if 'release' in line.lower():
                print(f"  {line.strip()}")
                break
    else:
        print("  ⚠️  CUDA toolkit not found (optional, PyTorch has its own)")
except FileNotFoundError:
    print("  ⚠️  CUDA toolkit not found (optional, PyTorch has its own)")
print()

# Check other dependencies
print("[5/6] Other Dependencies:")
deps = ['fastapi', 'uvicorn', 'PIL', 'numpy', 'trimesh', 'rembg']
for dep in deps:
    try:
        if dep == 'PIL':
            import PIL
            print(f"  ✓ Pillow {PIL.__version__}")
        else:
            mod = __import__(dep)
            version = getattr(mod, '__version__', 'unknown')
            print(f"  ✓ {dep} {version}")
    except ImportError:
        print(f"  ❌ {dep} not installed")
print()

# Check TripoSR
print("[6/6] TripoSR Model:")
import os
if os.path.exists("TripoSR"):
    print("  ✓ TripoSR directory found")
    if os.path.exists("TripoSR/checkpoints"):
        print("  ✓ Checkpoints directory found")
        ckpt_files = os.listdir("TripoSR/checkpoints")
        if ckpt_files:
            print(f"  ✓ Found {len(ckpt_files)} checkpoint files")
        else:
            print("  ❌ No checkpoint files - run setup_local_gpu.bat")
    else:
        print("  ❌ No checkpoints directory - run setup_local_gpu.bat")
else:
    print("  ❌ TripoSR not found - run setup_local_gpu.bat")
print()

print("=" * 60)
print("  Summary")
print("=" * 60)
print()

if torch.cuda.is_available():
    print("✅ GPU is working! You can run start_local_gpu.bat")
else:
    print("❌ GPU not detected by PyTorch")
    print()
    print("TO FIX:")
    print("  1. Run: fix_gpu.bat")
    print("  2. This will reinstall PyTorch with CUDA support")
    print("  3. Then run: start_local_gpu.bat")
    print()
    print("If that doesn't work:")
    print("  - Update NVIDIA drivers: https://nvidia.com/drivers")
    print("  - Make sure you have CUDA 11.8 or 12.x installed")
    print("  - Check that your GPU is in the supported list")

print()
