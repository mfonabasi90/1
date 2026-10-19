# GPU Still Not Working - Complete Fix Guide

## Your Situation
You have an RTX 4090 but PyTorch shows:
```json
{
  "gpu_available": false,
  "device": "cpu"
}
```

This means PyTorch was installed **without CUDA support** and is using CPU instead of your GPU.

## Why This Happens

The most common causes:
1. **Virtual environment not activated** when installing PyTorch
2. **PyTorch cached** with CPU-only version
3. **Wrong CUDA version** installed
4. **NVIDIA drivers too old** (RTX 4090 needs driver 528.33+)

## Step-by-Step Fix

### Step 1: Run Quick Diagnostic
```cmd
cd backend
python quick_gpu_check.py
```

This will show you exactly what's wrong. Look for:
- ✅ or ✗ next to each check
- The summary at the bottom

### Step 2: Force Reinstall PyTorch with CUDA

**Download and run:** `force_gpu_fix.bat`

This script will:
1. ✅ Activate virtual environment
2. ✅ Check your NVIDIA GPU
3. ✅ Completely remove old PyTorch
4. ✅ Clear pip cache
5. ✅ Install PyTorch with CUDA 12.1 (correct for RTX 4090)
6. ✅ Verify GPU is working
7. ✅ Run full diagnostic

**This takes 5-10 minutes** (downloads ~2.5GB)

### Step 3: Verify It Worked

After `force_gpu_fix.bat` completes, you should see:
```
✓ CUDA available: True
✓ GPU: NVIDIA GeForce RTX 4090
✓ VRAM: 24.0 GB
```

### Step 4: Start the Server
```cmd
start_local_gpu.bat
```

You should now see:
```
[OK] GPU: NVIDIA GeForce RTX 4090
[OK] VRAM: 24.0 GB
```

## If It Still Doesn't Work

### Check 1: Are You in the Right Folder?
```cmd
cd backend
```
Make sure you're in the `backend` folder, not the root folder.

### Check 2: Is Virtual Environment Active?
```cmd
venv\Scripts\activate
```
You should see `(venv)` at the start of your command prompt.

### Check 3: NVIDIA Drivers
RTX 4090 requires **driver version 528.33 or newer**.

Check your driver:
```cmd
nvidia-smi
```

Look for "Driver Version" in the output. If it's older than 528.33:
1. Go to https://www.nvidia.com/drivers
2. Select: GeForce RTX 4090
3. Download and install latest driver
4. **Restart your computer**
5. Try again

### Check 4: Windows Device Manager
1. Right-click Start → Device Manager
2. Expand "Display adapters"
3. You should see "NVIDIA GeForce RTX 4090"
4. If you see "Microsoft Basic Display Adapter" instead → drivers not installed

### Check 5: Integrated Graphics Conflict
Some laptops have both integrated (Intel/AMD) and dedicated (NVIDIA) GPUs.

Force Windows to use NVIDIA:
1. Settings → System → Display → Graphics settings
2. Add Python: `backend\venv\Scripts\python.exe`
3. Set to "High performance" (NVIDIA)

## Manual Fix (If Scripts Don't Work)

If the batch files fail, do this manually:

### 1. Activate Virtual Environment
```cmd
cd backend
venv\Scripts\activate
```

### 2. Remove Old PyTorch
```cmd
pip uninstall -y torch torchvision torchaudio
pip cache purge
```

### 3. Install PyTorch with CUDA 12.1
```cmd
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 --force-reinstall --no-cache-dir
```

### 4. Verify
```cmd
python -c "import torch; print('CUDA:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
```

Should output:
```
CUDA: True
GPU: NVIDIA GeForce RTX 4090
```

## Expected Performance

Once GPU is working:

| Task | CPU (current) | GPU (RTX 4090) |
|------|---------------|----------------|
| Model loading | 30-60s | 10-20s |
| 3D generation | 30-120s | **2-5s** |
| Quality | Same | Same |
| Cost | Free | Free |

**Your RTX 4090 will be 10-30x faster!**

## Files You Need

| File | What it does |
|------|--------------|
| `quick_gpu_check.py` | Diagnostic - shows what's wrong |
| `force_gpu_fix.bat` | **Run this** - fixes everything |
| `check_gpu.py` | Detailed diagnostic |
| `start_local_gpu.bat` | Start server after fix |

## Still Not Working?

If you've tried everything and GPU still not detected:

1. **Run quick_gpu_check.py** and share the output
2. **Check Windows Event Viewer** for driver errors
3. **Try a different USB port** (if using external GPU)
4. **Test in a fresh Python environment**:
   ```cmd
   python -m venv test_env
   test_env\Scripts\activate
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
   python -c "import torch; print(torch.cuda.is_available())"
   ```
   If this says `True`, the issue is with your main venv.

## Common Error Messages

**"CUDA out of memory"**
- RTX 4090 has 24GB, this shouldn't happen
- Close other GPU apps (games, browsers with many tabs)

**"Driver version too old"**
- Update NVIDIA drivers
- RTX 4090 needs 528.33 or newer

**"No CUDA-capable device detected"**
- Check Device Manager
- Update/reinstall NVIDIA drivers
- Restart computer

**"torch.cuda.is_available() returns False"**
- PyTorch installed without CUDA
- Run `force_gpu_fix.bat`

## Success Indicators

When everything is working, you'll see:

In `quick_gpu_check.py`:
```
✅ GPU IS WORKING!
```

In `start_local_gpu.bat`:
```
[OK] GPU: NVIDIA GeForce RTX 4090
[OK] VRAM: 24.0 GB
```

In browser (http://localhost:8000):
```json
{
  "gpu_available": true,
  "gpu_name": "NVIDIA GeForce RTX 4090",
  "vram_gb": 24.0
}
```

## Next Steps

Once GPU is working:
1. ✅ Generate unlimited 3D models for free
2. ✅ Get results in 2-5 seconds
3. ✅ Work offline
4. ✅ No API costs ever

**Your RTX 4090 is a beast - let's make it work!** 🚀
