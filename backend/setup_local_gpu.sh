#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🎮 AssetForge Local GPU Setup                          ║"
echo "║                                                          ║"
echo "║   This will install TripoSR for local 3D generation      ║"
echo "║   Requirements: NVIDIA GPU with 6GB+ VRAM               ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found!"
    echo ""
    echo "Please install Python 3.10+ from https://python.org"
    exit 1
fi

echo "✅ Python found"
python3 --version
echo ""

# Check GPU
if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    echo ""
else
    echo "⚠️  NVIDIA GPU not detected"
    echo "You can still run on CPU, but it will be very slow"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip setuptools wheel
echo ""

# Install PyTorch
echo "📦 Installing PyTorch..."
if command -v nvidia-smi &> /dev/null; then
    echo "Installing with CUDA support..."
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
else
    echo "Installing CPU version..."
    pip install torch torchvision
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pip install fastapi uvicorn python-multipart pillow numpy trimesh rembg huggingface-hub
echo ""

# Clone TripoSR
echo "📦 Downloading TripoSR model..."
if [ ! -d "TripoSR" ]; then
    git clone https://github.com/VAST-AI-Research/TripoSR.git
    echo "✅ TripoSR downloaded"
else
    echo "✅ TripoSR already exists"
fi
echo ""

# Install TripoSR dependencies
echo "📦 Installing TripoSR dependencies..."
cd TripoSR
pip install -r requirements.txt
cd ..
echo ""

# Download model weights
echo "📦 Downloading model weights..."
python3 -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='stabilityai/TripoSR', filename='model.ckpt', local_dir='TripoSR/checkpoints'); hf_hub_download(repo_id='stabilityai/TripoSR', filename='config.yaml', local_dir='TripoSR/checkpoints')"
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   ✅ Setup Complete!                                     ║"
echo "║                                                          ║"
echo "║   To start the server:                                   ║"
echo "║     bash start_local_gpu.sh                              ║"
echo "║                                                          ║"
echo "║   Then open: http://localhost:8000                       ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
