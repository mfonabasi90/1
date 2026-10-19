# 🎮 AssetForge - Complete Guide

**Turn any image into a 3D game asset in seconds!**

---

## 🎯 What is AssetForge?

AssetForge is a web app that converts images into 3D models for games. Upload a picture of a fish, sword, or character → get a 3D model you can use in Unity, Unreal, Godot, or any game engine.

---

## 🚀 Two Ways to Use It

### Option 1: Cloud API (Easiest)
**Best for**: Beginners, quick testing, no GPU

**Pros:**
- ✅ No special hardware needed
- ✅ Works on any computer
- ✅ Simple setup (just need API key)
- ✅ High quality models

**Cons:**
- ❌ Costs money (~$0.10-0.15 per model)
- ❌ Requires internet
- ❌ Slower (30-90 seconds per model)

**Setup Time**: 5 minutes

---

### Option 2: Local GPU (Free & Unlimited) ⭐
**Best for**: Game developers, heavy use, no internet

**Pros:**
- ✅ **Completely free** - no API costs ever
- ✅ **Unlimited generations**
- ✅ Works offline
- ✅ Faster (2-10 seconds per model)
- ✅ Full control, no rate limits

**Cons:**
- ❌ Requires NVIDIA GPU with 6GB+ VRAM
- ❌ More complex setup (10-20 minutes)
- ❌ Slightly lower quality than cloud APIs

**Setup Time**: 10-20 minutes

---

## 📋 Quick Comparison

| Feature | Cloud API | Local GPU |
|---------|-----------|-----------|
| **Cost** | ~$0.10-0.15/model | **FREE** |
| **Speed** | 30-90 seconds | **2-10 seconds** |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Hardware** | Any computer | NVIDIA GPU 6GB+ |
| **Internet** | Required | **Not required** |
| **Setup** | 5 minutes | 10-20 minutes |
| **Best for** | Testing, low volume | **Production, game dev** |

---

## 🎮 Option 1: Cloud API Setup (5 minutes)

### What You Need
- Any computer (Windows/Mac/Linux)
- Internet connection
- Credit card (for API credits)

### Steps

1. **Get API Key** (choose one):
   - **Meshy AI** (200 free credits): [app.meshy.ai](https://app.meshy.ai)
   - **Tripo AI** (pay-as-you-go): [platform.tripo3d.ai](https://platform.tripo3d.ai)

2. **Download Project Files**:
   - Download all files from this project
   - Extract to a folder on your computer

3. **Install Node.js**:
   - Download from [nodejs.org](https://nodejs.org)
   - Install (check "Add to PATH")
   - Restart computer

4. **Run the App**:
   ```bash
   # Open terminal in project folder
   npm install
   npm run build
   node server.js
   ```

5. **Open Browser**:
   - Go to http://localhost:3000
   - Paste your API key in Settings
   - Upload an image and generate!

**See [BEGINNER_SETUP.md](BEGINNER_SETUP.md) for detailed step-by-step instructions.**

---

## 🖥️ Option 2: Local GPU Setup (10-20 minutes)

### What You Need
- **NVIDIA GPU** with 6GB+ VRAM (RTX 3060 or better)
- **8GB+ RAM**
- **10GB free disk space**
- Windows 10/11 (or Linux/Mac)
- Python 3.10+
- Git

### Recommended GPUs
- ✅ RTX 3060 (12GB) - Great value
- ✅ RTX 4060 (8GB) - Good performance
- ✅ RTX 3080 (10GB) - Excellent
- ✅ RTX 4090 (24GB) - Best performance

### Steps

1. **Install Prerequisites**:
   - Python 3.10+ from [python.org](https://python.org)
   - Git from [git-scm.com](https://git-scm.com)
   - Latest NVIDIA drivers

2. **Download Project Files**:
   - Download all files from this project
   - Extract to a folder

3. **Setup Local GPU Backend**:
   ```bash
   cd backend
   setup_local_gpu.bat    # Windows
   # or
   bash setup_local_gpu.sh  # Linux/Mac
   ```
   This downloads the TripoSR model (~1GB) and installs everything.

4. **Start Local Server**:
   ```bash
   start_local_gpu.bat    # Windows
   # or
   bash start_local_gpu.sh  # Linux/Mac
   ```

5. **Run Main App**:
   ```bash
   # In project root
   npm install
   npm run build
   node server.js
   ```

6. **Use It**:
   - Open http://localhost:3000
   - Select "Local GPU" in Settings
   - Upload image → Generate → Download .glb

**See [backend/LOCAL_GPU_GUIDE.md](backend/LOCAL_GPU_GUIDE.md) for detailed instructions.**

---

## 🎨 How to Use AssetForge

### Step 1: Upload Image
- Click "Upload" or drag & drop
- Best results: single object on clean background
- Supported: PNG, JPG, WEBP

### Step 2: Configure Settings
- **Quality**: Draft (fast) / Standard / High (detailed)
- **Provider**: Cloud API or Local GPU
- **Name**: Give your asset a name

### Step 3: Generate
- Click "Generate 3D Model"
- Wait 2-90 seconds (depends on provider)
- Watch the progress bar

### Step 4: Preview
- See the 3D model in the viewer
- Rotate, zoom, inspect
- Check quality

### Step 5: Download
- Click "Download .glb"
- Save to your computer
- Import into your game engine

### Step 6: Use in Game
- Import .glb into Unity/Unreal/Godot
- Tell your coding AI: "Add this fish asset with swimming behavior"
- Done! 🎮

---

## 📁 Project Structure

```
assetforge/
├── src/                      # Frontend code (React)
│   ├── App.tsx              # Main app
│   ├── components/          # UI components
│   └── services/            # API clients
├── backend/                  # Local GPU backend
│   ├── local_gpu_server.py  # Python server
│   ├── setup_local_gpu.bat  # Windows setup
│   ├── LOCAL_GPU_GUIDE.md   # Detailed guide
│   └── TripoSR/             # 3D model (downloaded)
├── server.js                 # Node.js proxy server
├── package.json              # Node dependencies
├── README.md                 # This file
└── BEGINNER_SETUP.md         # Step-by-step guide
```

---

## 🎯 Which Option Should You Choose?

### Choose Cloud API if:
- You don't have a powerful GPU
- You only need a few models
- You want the highest quality
- You're just testing/prototyping

### Choose Local GPU if:
- You have an NVIDIA GPU (RTX 3060+)
- You need unlimited generations
- You're building a game (many assets)
- You want to work offline
- You want to save money

---

## 💰 Cost Comparison

### Cloud API Costs
- **Meshy AI**: ~$0.10 per model (200 free credits = ~20 models)
- **Tripo AI**: ~$0.15 per model

**Example**: Making 100 fish models for a game
- Cloud API: $10-15
- Local GPU: **FREE**

### Local GPU Costs
- **Electricity**: ~$0.01 per model (negligible)
- **Hardware**: One-time GPU purchase (if you don't have one)

**Break-even**: After ~100 models, local GPU pays for itself

---

## 🔧 Troubleshooting

### Cloud API Issues

**"Not enough credits"**
- Buy more credits on the provider's website
- Or switch to Local GPU (free!)

**"Invalid API key"**
- Go to provider's website
- Create a new API key
- Paste it in Settings

**"Failed to fetch"**
- Make sure you're running `node server.js`
- Check your internet connection

### Local GPU Issues

**"CUDA out of memory"**
- Close other GPU apps (games, browsers)
- Reduce image size
- Your GPU might not have enough VRAM

**"Very slow (30+ seconds)"**
- You're running on CPU instead of GPU
- Check `nvidia-smi` to verify GPU
- Reinstall PyTorch with CUDA

**"Model won't load"**
- Run `setup_local_gpu.bat` again
- Check you have 10GB free disk space
- Verify Python 3.10+ is installed

**See [backend/LOCAL_GPU_GUIDE.md](backend/LOCAL_GPU_GUIDE.md) for more troubleshooting.**

---

## 🎮 Using Generated Models in Games

### Unity
1. Download .glb file
2. Drag into Assets folder
3. Drag into scene
4. Add scripts for behavior

### Unreal Engine
1. Download .glb file
2. Import via Content Browser
3. Drag into level
4. Set up materials

### Godot
1. Download .glb file
2. Import via FileSystem
3. Instance in scene
4. Add collision

### Three.js (Web)
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
loader.load('model.glb', (gltf) => {
    scene.add(gltf.scene);
});
```

---

## 📚 Additional Resources

### Documentation
- [Beginner Setup Guide](BEGINNER_SETUP.md) - Step-by-step for total beginners
- [Local GPU Guide](backend/LOCAL_GPU_GUIDE.md) - Detailed local GPU setup
- [TripoSR GitHub](https://github.com/VAST-AI-Research/TripoSR) - The AI model we use

### APIs
- [Meshy AI](https://app.meshy.ai) - 200 free credits
- [Tripo AI](https://platform.tripo3d.ai) - Pay-as-you-go

### Game Engines
- [Unity](https://unity.com) - Most popular
- [Unreal Engine](https://unrealengine.com) - Best graphics
- [Godot](https://godotengine.org) - Free & open source

---

## 🆘 Need Help?

### Quick Fixes
1. **Cloud API not working?** → Check API key, buy credits
2. **Local GPU slow?** → Verify GPU detected, close other apps
3. **Setup failing?** → Check Python version, install Git
4. **Low quality?** → Try cloud API for better results

### Still Stuck?
- Read the detailed guides
- Check troubleshooting sections
- Open an issue on GitHub

---

## 🎉 You're Ready!

Now you can:
- ✅ Upload any image
- ✅ Generate 3D models
- ✅ Download .glb files
- ✅ Use in your games
- ✅ Build amazing things!

**Happy game developing!** 🎮🚀

---

## 📝 Summary

| | Cloud API | Local GPU |
|---|---|---|
| **Setup** | 5 min | 10-20 min |
| **Cost** | ~$0.10/model | FREE |
| **Speed** | 30-90s | 2-10s |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Hardware** | Any | NVIDIA GPU 6GB+ |
| **Best for** | Testing | Production |

**Start with Cloud API** to test, then **switch to Local GPU** for production use!
