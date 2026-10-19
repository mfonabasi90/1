# GPU Not Detected - Quick Fix Guide

## Your Problem
You have an RTX 4090 but PyTorch says:
```
[INFO] Device: cpu
[WARNING] No GPU detected! Will run on CPU (very slow)
```

## What's Happening
Your GPU is there, but **PyTorch was installed without CUDA support**. It's using the CPU-only version.

Think of it like having a Ferrari but putting regular gas in it - the car is there, but it can't use its full power.

## The Fix (2 minutes)

### Step 1: Stop the Server
Press `Ctrl+C` in the terminal window

### Step 2: Run the Fix Script
```cmd
cd backend
fix_gpu.bat
```

This will:
- Uninstall the CPU-only PyTorch
- Install PyTorch with CUDA 12.1 support (for RTX 4090)
- Download about 2GB of files
- Take 2-5 minutes

### Step 3: Start the Server Again
```cmd
start_local_gpu.bat
```

You should now see:
```
[OK] GPU: NVIDIA GeForce RTX 4090
[OK] VRAM: 24.0 GB
```

## If That Doesn't Work

### Check What's Wrong
```cmd
python check_gpu.py
```

This will tell you exactly what's missing.

### Common Issues

**Issue 1: "CUDA not available"**
- PyTorch still doesn't see CUDA
- Run `fix_gpu.bat` again
- Make sure you're in the `backend` folder

**Issue 2: "nvidia-smi not found"**
- NVIDIA drivers not installed
- Download from: https://www.nvidia.com/drivers
- Install and restart computer

**Issue 3: "Driver version too old"**
- Update NVIDIA drivers
- RTX 4090 needs driver version 528.33 or newer

**Issue 4: Still shows CPU after fix**
- Delete the `venv` folder
- Run `setup_local_gpu.bat` again
- This recreates everything from scratch

## Why This Happened

The `setup_local_gpu.bat` script tried to install PyTorch with CUDA, but it might have:
- Failed silently and installed CPU version instead
- Installed wrong CUDA version
- Had network issues during download

The `fix_gpu.bat` script specifically forces CUDA 12.1 installation, which is correct for RTX 4090.

## After Fix Works

Once you see:
```
[OK] GPU: NVIDIA GeForce RTX 4090
[OK] VRAM: 24.0 GB
```

You can:
- Generate 3D models in 2-10 seconds (instead of 30+ seconds on CPU)
- Use unlimited generations for free
- Work offline

## Quick Reference

| Command | What it does |
|---------|-------------|
| `python check_gpu.py` | Diagnose GPU issues |
| `fix_gpu.bat` | Fix PyTorch CUDA installation |
| `start_local_gpu.bat` | Start the server |
| `setup_local_gpu.bat` | Full setup (reinstall everything) |

## Still Not Working?

1. Run `python check_gpu.py` and share the output
2. Check Windows Event Viewer for driver errors
3. Update NVIDIA drivers to latest version
4. Try reinstalling CUDA toolkit from NVIDIA

## Expected Performance

With RTX 4090 working:
- **Model loading**: 10-20 seconds (first time)
- **3D generation**: 2-5 seconds per image
- **Quality**: Excellent (24GB VRAM allows high resolution)

Without GPU (CPU only):
- **Model loading**: 30-60 seconds
- **3D generation**: 30-120 seconds per image
- **Quality**: Same, but much slower

The GPU makes it **10-30x faster**!
