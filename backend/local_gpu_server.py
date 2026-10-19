"""
AssetForge Local GPU Server
Runs TripoSR (open-source image-to-3D) on your own GPU.
No API costs, unlimited generations!

Requirements:
- NVIDIA GPU with 6GB+ VRAM (RTX 3060 or better recommended)
- Python 3.10+
- CUDA installed

Setup:
1. Run: setup_local_gpu.bat (Windows) or bash setup_local_gpu.sh (Linux/Mac)
2. Run: python local_gpu_server.py
3. Open: http://localhost:8000
"""

import os
import sys
import uuid
import time
import io
import base64
import tempfile
from pathlib import Path

# Check if running in the TripoSR directory or standalone
TRIPOSR_DIR = os.environ.get("TRIPOSR_DIR", "TripoSR")

try:
    import torch
    import numpy as np
    from PIL import Image
    from fastapi import FastAPI, File, UploadFile, HTTPException, Form
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse, JSONResponse
    import uvicorn
except ImportError as e:
    print(f"\n[ERROR] Missing dependency: {e}")
    print("\nPlease run the setup script first:")
    print("  Windows: setup_local_gpu.bat")
    print("  Linux/Mac: bash setup_local_gpu.sh")
    print("\nOr manually install:")
    print("  pip install torch torchvision fastapi uvicorn python-multipart pillow numpy trimesh rembg")
    sys.exit(1)

app = FastAPI(title="AssetForge Local GPU Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path("output_models")
OUTPUT_DIR.mkdir(exist_ok=True)

# Global model state
model_state = {
    "loaded": False,
    "model": None,
    "model_name": None,
    "device": None,
    "load_time": None,
}


def get_device():
    """Get the best available device."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    else:
        return torch.device("cpu")


def load_triposr_model():
    """Load the TripoSR model into memory."""
    global model_state
    
    if model_state["loaded"]:
        return
    
    device = get_device()
    print(f"\n[INFO] Loading TripoSR model on {device}...")
    start = time.time()
    
    try:
        # Try importing from TripoSR package
        sys.path.insert(0, TRIPOSR_DIR)
        from tsr.system import TSR
        
        model = TSR.from_pretrained(
            "stabilityai/TripoSR",
            config_name="config.yaml",
            weight_name="model.ckpt",
        )
        model.renderer.set_chunk_size(8192)
        model.to(device)
        
        model_state["model"] = model
        model_state["model_name"] = "TripoSR"
        model_state["device"] = str(device)
        model_state["loaded"] = True
        model_state["load_time"] = time.time() - start
        
        print(f"[OK] TripoSR loaded in {model_state['load_time']:.1f}s on {device}")
        
    except Exception as e:
        print(f"[ERROR] Failed to load TripoSR: {e}")
        print("\nMake sure you've run the setup script and downloaded the model.")
        print(f"Expected TripoSR at: {TRIPOSR_DIR}/")
        raise


def remove_background(image: Image.Image) -> Image.Image:
    """Remove background from image using rembg."""
    try:
        from rembg import remove
        return remove(image)
    except ImportError:
        print("Warning: rembg not installed, using image as-is")
        return image


def generate_mesh(image: Image.Image, chunk_size: int = 8192) -> str:
    """Generate a 3D mesh from an image using TripoSR."""
    load_triposr_model()
    
    device = model_state["device"]
    model = model_state["model"]
    
    # Preprocess image
    image = remove_background(image)
    image = image.resize((512, 512), Image.Resampling.LANCZOS)
    
    # Convert to tensor
    image_np = np.array(image)
    if image_np.shape[-1] == 4:
        # Use alpha channel as mask
        rgb = image_np[..., :3]
        alpha = image_np[..., 3:]
        # Composite on white background
        white_bg = np.ones_like(rgb) * 255
        rgb = (rgb * (alpha / 255) + white_bg * (1 - alpha / 255)).astype(np.uint8)
    else:
        rgb = image_np
    
    image_tensor = torch.from_numpy(rgb).float() / 255.0
    image_tensor = image_tensor.permute(2, 0, 1).unsqueeze(0)
    
    if "cuda" in str(device):
        image_tensor = image_tensor.cuda()
    elif "mps" in str(device):
        image_tensor = image_tensor.to(device)
    
    print(f"[INFO] Generating 3D mesh...")
    start = time.time()
    
    with torch.no_grad():
        scene_codes = model(image_tensor)
        
    # Extract mesh
    meshes = model.extract_mesh(scene_codes, resolution=256)
    
    gen_time = time.time() - start
    print(f"[OK] Mesh generated in {gen_time:.2f}s")
    
    # Save as GLB
    task_id = str(uuid.uuid4())
    output_path = OUTPUT_DIR / f"{task_id}.glb"
    
    # Export mesh
    mesh = meshes[0] if isinstance(meshes, (list, tuple)) else meshes
    
    try:
        import trimesh
        if isinstance(mesh, trimesh.Trimesh):
            mesh.export(str(output_path), file_type="glb")
        else:
            # Try direct export
            mesh.export(str(output_path))
    except Exception:
        # Fallback: save as OBJ
        output_path = OUTPUT_DIR / f"{task_id}.obj"
        mesh.export(str(output_path))
    
    return str(output_path), task_id, gen_time


# ============ API Endpoints ============

@app.get("/")
async def root():
    device = get_device()
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    return {
        "status": "running",
        "service": "AssetForge Local GPU Backend",
        "gpu_available": torch.cuda.is_available(),
        "gpu_name": gpu_name,
        "device": str(device),
        "model_loaded": model_state["loaded"],
        "model_name": model_state["model_name"],
        "vram_gb": torch.cuda.get_device_properties(0).total_mem / (1024**3) if torch.cuda.is_available() else None,
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model_state["loaded"],
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
    }


@app.post("/load-model")
async def load_model():
    """Pre-load the model into GPU memory."""
    try:
        load_triposr_model()
        return {
            "status": "success",
            "model": model_state["model_name"],
            "device": model_state["device"],
            "load_time": model_state["load_time"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate")
async def generate(image: UploadFile = File(...), resolution: int = 256):
    """Generate a 3D model from an uploaded image."""
    try:
        # Read image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data)).convert("RGBA")
        
        # Generate mesh
        output_path, task_id, gen_time = generate_mesh(pil_image, chunk_size=8192)
        
        return {
            "task_id": task_id,
            "status": "success",
            "generation_time": gen_time,
            "download_url": f"/download/{task_id}",
            "file_size_mb": os.path.getsize(output_path) / (1024 * 1024),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/download/{task_id}")
async def download_model(task_id: str):
    """Download a generated 3D model."""
    for ext in [".glb", ".obj"]:
        file_path = OUTPUT_DIR / f"{task_id}{ext}"
        if file_path.exists():
            media_type = "model/gltf-binary" if ext == ".glb" else "text/plain"
            return FileResponse(file_path, media_type=media_type, filename=f"model{ext}")
    
    raise HTTPException(status_code=404, detail="Model not found")


@app.get("/models")
async def list_models():
    """List all generated models."""
    models = []
    for file in sorted(OUTPUT_DIR.glob("*"), key=lambda f: f.stat().st_ctime, reverse=True):
        if file.suffix in [".glb", ".obj"]:
            models.append({
                "task_id": file.stem,
                "filename": file.name,
                "size_mb": round(file.stat().st_size / (1024 * 1024), 2),
                "format": file.suffix[1:],
            })
    return {"models": models, "count": len(models)}


if __name__ == "__main__":
    print("""
============================================================
  AssetForge Local GPU Backend
  Running on: http://localhost:8000
============================================================
    """)
    
    device = get_device()
    print(f"[INFO] Device: {device}")
    if torch.cuda.is_available():
        print(f"[OK] GPU: {torch.cuda.get_device_name(0)}")
        vram = torch.cuda.get_device_properties(0).total_mem / (1024**3)
        print(f"[OK] VRAM: {vram:.1f} GB")
        if vram < 6:
            print("[WARNING] Less than 6GB VRAM. Model may not fit!")
    else:
        print("[WARNING] No GPU detected! Will run on CPU (very slow)")
        print()
        print("=" * 60)
        print("  GPU NOT DETECTED - PyTorch is using CPU")
        print("=" * 60)
        print()
        print("  This usually means PyTorch was installed without CUDA support.")
        print()
        print("  TO FIX:")
        print("    1. Stop this server (Ctrl+C)")
        print("    2. Run: fix_gpu.bat")
        print("    3. Then run: start_local_gpu.bat again")
        print()
        print("  Or run: python check_gpu.py for detailed diagnostics")
        print()
        print("=" * 60)
        print()
    
    print("\n[INFO] API endpoints:")
    print("   GET  /           - Server info")
    print("   POST /load-model - Load TripoSR into GPU memory")
    print("   POST /generate   - Generate 3D from image")
    print("   GET  /download/:id - Download generated model")
    print("   GET  /models     - List all generated models")
    print("\nPress Ctrl+C to stop\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
