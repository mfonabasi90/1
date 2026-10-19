"""
Quick GPU diagnostic - shows exactly what's wrong
Run: python quick_gpu_check.py
"""

import sys
import subprocess

print("=" * 70)
print("  QUICK GPU DIAGNOSTIC")
print("=" * 70)
print()

# 1. Check if we're in venv
print("[1] Virtual Environment:")
if sys.prefix != sys.base_prefix:
    print(f"  ✓ Active: {sys.prefix}")
else:
    print("  ✗ NOT ACTIVE - You need to activate venv first!")
    print("    Run: venv\\Scripts\\activate")
print()

# 2. Check PyTorch
print("[2] PyTorch Installation:")
try:
    import torch
    print(f"  ✓ Version: {torch.__version__}")
    print(f"  ✓ CUDA compiled: {torch.version.cuda}")
    print(f"  ✓ CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"  ✓ Device count: {torch.cuda.device_count()}")
        print(f"  ✓ GPU: {torch.cuda.get_device_name(0)}")
        props = torch.cuda.get_device_properties(0)
        print(f"  ✓ VRAM: {props.total_memory / 1e9:.1f} GB")
        print(f"  ✓ Compute capability: {props.major}.{props.minor}")
        print()
        print("  ✅ GPU IS WORKING!")
    else:
        print("  ✗ CUDA NOT AVAILABLE")
        print()
        print("  This means PyTorch was installed WITHOUT CUDA support.")
        print()
        print("  FIX: Run force_gpu_fix.bat")
        
except ImportError as e:
    print(f"  ✗ PyTorch not installed: {e}")
    print()
    print("  FIX: Run setup_local_gpu.bat or force_gpu_fix.bat")
print()

# 3. Check NVIDIA driver
print("[3] NVIDIA Driver:")
try:
    result = subprocess.run(['nvidia-smi'], capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        lines = result.stdout.split('\n')
        for line in lines:
            if 'GeForce' in line or 'Driver Version' in line or 'CUDA Version' in line:
                print(f"  {line.strip()}")
    else:
        print("  ✗ nvidia-smi failed")
except FileNotFoundError:
    print("  ✗ nvidia-smi not found - NVIDIA drivers not installed!")
    print("    Download from: https://www.nvidia.com/drivers")
except Exception as e:
    print(f"  ✗ Error: {e}")
print()

# 4. Check CUDA toolkit
print("[4] CUDA Toolkit:")
try:
    result = subprocess.run(['nvcc', '--version'], capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            if 'release' in line.lower():
                print(f"  {line.strip()}")
                break
    else:
        print("  ⚠ CUDA toolkit not found (optional)")
except FileNotFoundError:
    print("  ⚠ CUDA toolkit not found (optional - PyTorch has its own)")
print()

# 5. Summary
print("=" * 70)
print("  SUMMARY")
print("=" * 70)
print()

try:
    import torch
    if torch.cuda.is_available():
        print("✅ Everything looks good!")
        print()
        print("You can now run: start_local_gpu.bat")
    else:
        print("❌ GPU NOT DETECTED")
        print()
        print("SOLUTION:")
        print("  1. Run: force_gpu_fix.bat")
        print("  2. This will reinstall PyTorch with CUDA 12.1")
        print("  3. Then run: start_local_gpu.bat")
        print()
        print("If that doesn't work:")
        print("  - Update NVIDIA drivers to latest version")
        print("  - Make sure you're using RTX 4090 (not integrated graphics)")
        print("  - Check Windows Device Manager for GPU")
except ImportError:
    print("❌ PyTorch not installed")
    print()
    print("SOLUTION:")
    print("  Run: setup_local_gpu.bat")

print()
