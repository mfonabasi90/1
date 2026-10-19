# AssetForge - Image to 3D Game Asset Pipeline

A web app that converts images into game-ready 3D models using the Tripo AI API.

## How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)

### Steps

1. **Download the project files**
   - Copy all project files to a folder on your computer
   - Or if you have the project in a git repo: `git clone <your-repo-url>`

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the app**
   ```bash
   npm run build
   ```

4. **Run the local server**
   ```bash
   node server.js
   ```

5. **Open your browser**
   - Go to `http://localhost:3000`

### Why use `node server.js` instead of `npm run dev`?

The Tripo AI API doesn't allow direct browser requests (CORS). The `server.js` file acts as a proxy — it forwards your API calls to Tripo while avoiding CORS issues. This is required for the 3D generation to work.

---

## Getting a Tripo AI API Key

1. Go to [platform.tripo3d.ai](https://platform.tripo3d.ai)
2. Sign up for a free account
3. Go to [API Keys](https://platform.tripo3d.ai/api-keys)
4. Create a new API key (starts with `tsk_...`)
5. Paste it into the Settings tab in AssetForge

Free tier gives you enough credits to try it out!

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Your Image  │────▶│  Tripo AI    │────▶│  3D Model    │
│  (PNG/JPG)   │     │  API (cloud) │     │  (.glb file) │
└─────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │    AssetForge      │    Generates       │    Download &
       │    uploads it      │    real mesh       │    import to game
       ▼                    ▼                    ▼
```

1. **Upload** an image of any object (fish, sword, character, etc.)
2. **Generate** — Tripo AI creates a real 3D model with textures
3. **Preview** — View the actual 3D model in the built-in viewer
4. **Download** — Get the .glb file
5. **Import** — Drop it into Unity, Unreal, Godot, Three.js, etc.

---

## Workflow with AI Coding

Once you have the .glb file, tell your coding AI:

> "Here's the fish asset from AssetForge:
> - File: fish.glb
> - Category: creatures
> - Has textures: Yes (PBR)
> 
> Please add it to the game with swimming AI behavior."

The coding session will import the model, set up animations, physics, and game logic.

---

## Project Structure

```
├── src/
│   ├── App.tsx              # Main app component
│   ├── components/
│   │   └── Viewer3D.tsx     # 3D model viewer (Three.js)
│   ├── services/
│   │   └── tripoApi.ts      # Tripo AI API integration
│   ├── index.css
│   └── main.tsx
├── server.js                # Local server with API proxy
├── dist/                    # Built output (after npm run build)
├── package.json
└── README.md
```

---

## Troubleshooting

### "Failed to fetch" error
- Make sure you're running via `node server.js` (not just opening the HTML file)
- Check that your API key is correct in Settings
- Check the terminal for error messages from the proxy

### Model doesn't appear in viewer
- The model URL from Tripo expires after 5 minutes
- Download it quickly, or regenerate
- Check browser console for errors

### CORS errors in browser console
- You must use `node server.js` — it proxies the requests
- Direct browser → Tripo API calls are blocked by CORS

---

## Tips

- **Best images**: Single object on a clean/white background
- **Draft quality**: Fast, good for testing (~5K faces)
- **High quality**: Detailed, slower (~200K faces)
- **P1 model version**: Best for game assets (optimized low-poly)
