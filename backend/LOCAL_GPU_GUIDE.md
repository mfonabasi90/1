# 🎮 AssetForge Local GPU Guide

**Generate unlimited 3D models on your own GPU - no API costs!**

---

## 📋 What You Need

### Hardware Requirements
- **NVIDIA GPU** with 6GB+ VRAM (RTX 3060, RTX 4060, or better)
- **8GB+ RAM**
- **10GB free disk space** (for model files)

### Software Requirements
- **Windows 10/11** (or Linux/Mac)
- **Python 3.10+** ([Download here](https://python.org/downloads))
- **NVIDIA drivers** (latest version)
- **Git** ([Download here](https://git-scm.com/downloads))

### Recommended GPUs
| GPU | VRAM | Performance | Notes |
|-----|------|-------------|-------|
| RTX 3060 | 12GB | ⭐⭐⭐⭐ | Great value |
| RTX 4060 | 8GB | ⭐⭐⭐⭐ | Good performance |
| RTX 3080 | 10GB | ⭐⭐⭐⭐⭐ | Excellent |
| RTX 4090 | 24GB | ⭐⭐⭐⭐⭐ | Best performance |

---

## 🚀 Quick Start (Windows)

### Step 1: Install Prerequisites

1. **Install Python 3.10+**
   - Go to https://python.org/downloads
   - Download Python 3.10 or newer
   - **IMPORTANT**: Check "Add Python to PATH" during installation
   - Verify: Open Command Prompt, type `python --version`

2. **Install Git**
   - Go to https://git-scm.com/downloads
   - Download and install (default options are fine)
   - Verify: Open Command Prompt, type `git --version`

3. **Check NVIDIA Drivers**
   - Open Command Prompt, type `nvidia-smi`
   - You should see your GPU info
   - If not, update drivers from https://nvidia.com/drivers

### Step 2: Setup Local GPU Backend

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Run setup script**
   ```bash
   setup_local_gpu.bat
   ```
   
   This will:
   - Create a Python virtual environment
   - Install PyTorch with CUDA support (~2GB download)
   - Download TripoSR model (~1GB)
   - Install all dependencies
   
   **This takes 10-20 minutes on first run.**

3. **Wait for completion**
   - You'll see "✅ Setup Complete!" when done

### Step 3: Start the Server

1. **Run the server**
   ```bash
   start_local_gpu.bat
   ```

2. **Wait for model to load**
   - First load takes 30-60 seconds
   - You'll see "✅ TripoSR loaded" when ready

3. **Open your browser**
   - Go to http://localhost:8000
   - You should see the server status

### Step 4: Use in AssetForge

1. **Open the main AssetForge app**
   - Go to http://localhost:3000 (your main app)

2. **Switch to Local GPU mode**
   - Go to Settings tab
   - Select "Local GPU" as provider
   - The app will connect to your local server

3. **Generate 3D models**
   - Upload any image
   - Click "Generate with Local GPU"
   - Wait 2-10 seconds (depending on your GPU)
   - Download the .glb file

---

## 🐧 Linux/Mac Setup

### Linux (Ubuntu/Debian)

```bash
# Install dependencies
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip git

# Navigate to backend
cd backend

# Run setup
bash setup_local_gpu.sh

# Start server
bash start_local_gpu.sh
```

### Mac (Apple Silicon)

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python and Git
brew install python@3.10 git

# Navigate to backend
cd backend

# Run setup
bash setup_local_gpu.sh

# Start server
bash start_local_gpu.sh
```

**Note**: Mac uses MPS (Metal Performance Shaders) instead of CUDA. Performance is good but not as fast as NVIDIA GPUs.

---

## 🔧 How It Works

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Your Image │ ───▶ │  Your GPU    │ ───▶ │  3D Model   │
│  (PNG/JPG)  │      │  (TripoSR)   │      │  (.glb)     │
└─────────────┘      └──────────────┘      └─────────────┘
                           │
                    Runs entirely
                     on your PC
                    No internet needed
                    No API costs!
```

### The Process
1. **Upload image** → Sent to local server (localhost:8000)
2. **Remove background** → AI detects the object
3. **Generate 3D mesh** → TripoSR creates geometry (2-10 seconds)
4. **Export GLB** → Ready for your game engine

---

## 📊 Performance Comparison

| Method | Speed | Cost | Quality | Internet |
|--------|-------|------|---------|----------|
| **Local GPU (TripoSR)** | 2-10s | Free | ⭐⭐⭐ | No |
| Meshy AI | 30-60s | ~$0.10/model | ⭐⭐⭐⭐ | Yes |
| Tripo AI | 30-90s | ~$0.15/model | ⭐⭐⭐⭐⭐ | Yes |

**Local GPU is fastest and free**, but cloud APIs have slightly better quality.

---

## 🎯 Using the Generated Models

### Import to Game Engines

**Unity:**
1. Download the .glb file
2. Drag into your Unity project's Assets folder
3. Unity automatically imports it as a 3D model
4. Add to scene, configure materials, add scripts

**Unreal Engine:**
1. Download the .glb file
2. Import via Content Browser
3. Drag into your level
4. Set up materials and physics

**Godot:**
1. Download the .glb file
2. Import via FileSystem dock
3. Instance in your scene
4. Add collision shapes

**Three.js / Web:**
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('model.glb', (gltf) => {
    scene.add(gltf.scene);
});
```

---

## 🆘 Troubleshooting

### "CUDA out of memory"
- Your GPU doesn't have enough VRAM
- Try reducing resolution in the generate call
- Close other GPU-intensive apps (games, browsers with many tabs)

### "ModuleNotFoundError: No module named 'tsr'"
- TripoSR wasn't installed correctly
- Run `setup_local_gpu.bat` again
- Make sure you're in the `backend` folder

### "Model takes too long to load"
- First load downloads model weights (~1GB)
- Subsequent loads are faster (model stays in memory)
- If it's slow, check your internet speed

### "Very slow generation (30+ seconds)"
- You're running on CPU instead of GPU
- Check `nvidia-smi` to verify GPU is detected
- Reinstall PyTorch with CUDA: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121`

### "Quality is not as good as cloud APIs"
- Local TripoSR is optimized for speed, not maximum quality
- Cloud APIs (Meshy, Tripo) use larger models
- For best quality, use cloud APIs; for unlimited free generations, use local GPU

---

## 💡 Tips

### Maximize Performance
1. **Keep the server running** - Model stays in GPU memory
2. **Close other GPU apps** - Free up VRAM
3. **Use smaller images** - 512x512 is optimal
4. **Batch process** - Generate multiple models in one session

### Best Image Types
- ✅ Single object on clean background
- ✅ Good lighting, clear details
- ✅ PNG with transparency (best results)
- ❌ Complex scenes with multiple objects
- ❌ Very dark or blurry images

### Model Quality Settings
- **Fast mode**: 128 resolution (~2s) - Quick preview
- **Standard**: 256 resolution (~5s) - Good balance
- **High quality**: 512 resolution (~15s) - Best detail

---

## 📁 File Structure

```
backend/
├── local_gpu_server.py      # Main server
├── setup_local_gpu.bat      # Windows setup
├── setup_local_gpu.sh       # Linux/Mac setup
├── start_local_gpu.bat      # Windows start
├── start_local_gpu.sh       # Linux/Mac start
├── requirements.txt         # Python dependencies
├── TripoSR/                 # TripoSR model (downloaded)
│   ├── tsr/                 # Model code
│   ├── checkpoints/         # Model weights
│   └── requirements.txt
├── venv/                    # Python virtual environment
└── output_models/           # Generated 3D models
    ├── model_1.glb
    ├── model_2.glb
    └── ...
```

---

## 🎉 You're Ready!

Now you can:
- ✅ Generate unlimited 3D models for free
- ✅ Run entirely offline (after initial setup)
- ✅ Get results in 2-10 seconds
- ✅ No API keys or credits needed
- ✅ Full control over your data

**Happy 3D generating!** 🎮

---

## 📚 Additional Resources

- [TripoSR GitHub](https://github.com/VAST-AI-Research/TripoSR)
- [TripoSR Paper](https://arxiv.org/abs/2403.02151)
- [PyTorch Installation](https://pytorch.org/get-started/locally/)
- [NVIDIA CUDA Toolkit](https://developer.nvidia.com/cuda-toolkit)

---

## 🤔 Still Need Help?

Common issues and solutions:
1. **Setup fails** → Check Python version (3.10+), install Git, update NVIDIA drivers
2. **Slow performance** → Verify GPU is detected with `nvidia-smi`, reinstall PyTorch with CUDA
3. **Low quality** → Try cloud APIs (Meshy/Tripo) for better results
4. **Out of memory** → Close other apps, reduce image size, use smaller GPU

For more help, check the troubleshooting section above or open an issue on GitHub.
