#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   🎮 Starting AssetForge Local GPU Server...            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Check if TripoSR exists
if [ ! -d "TripoSR" ]; then
    echo "❌ TripoSR not found!"
    echo "Please run setup_local_gpu.sh first"
    exit 1
fi

echo "🚀 Starting server on http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 local_gpu_server.py
