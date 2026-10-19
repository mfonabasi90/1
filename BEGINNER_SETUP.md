# 🚀 AssetForge - Super Beginner Setup Guide

**Don't worry if you've never done this before! Just follow these steps exactly.**

---

## 📋 What You Need to Install First

### Step 1: Install Node.js (The Engine That Runs This App)

**What is Node.js?** It's a program that lets you run JavaScript code on your computer. Think of it like a special engine that powers this app.

**For Windows:**
1. Go to https://nodejs.org/
2. Click the big green button that says **"LTS"** (it will download a file)
3. Double-click the downloaded file (it ends in `.msi`)
4. Click **Next → Next → Next → Install** (just keep clicking Next)
5. **Close and reopen your computer** (or at least log out and back in)

**For Mac:**
1. Go to https://nodejs.org/
2. Click the big green button that says **"LTS"**
3. Double-click the downloaded file (it ends in `.pkg`)
4. Follow the installer (click Continue → Agree → Install)
5. Enter your Mac password when asked
6. **Close and reopen your computer**

**How to check if it worked:**
- **Windows:** Press `Windows key`, type "cmd", press Enter. A black window opens. Type `node --version` and press Enter. You should see something like `v20.11.0`
- **Mac:** Press `Cmd + Space`, type "terminal", press Enter. Type `node --version` and press Enter. You should see something like `v20.11.0`

If you see a version number, **you're good!** ✅

---

## 📥 Step 2: Download the Project Files

Since you have the files in this web editor, you need to download them to your computer.

### Option A: Download as ZIP (Easiest)
1. Look for a **"Download"** button in the file explorer (usually at the top)
2. Click it → it downloads a ZIP file
3. Find the ZIP file in your Downloads folder
4. **Right-click** it → **Extract** (Windows) or **Double-click** (Mac)
5. Extract it to a folder you can find easily, like `C:\AssetForge` or `~/Desktop/AssetForge`

### Option B: Copy Files Manually
If there's no download button, you'll need to copy each file:
1. Create a new folder on your Desktop called `AssetForge`
2. For each file in the file explorer on the left:
   - Click the file to open it
   - Select all the text (`Ctrl+A` or `Cmd+A`)
   - Copy it (`Ctrl+C` or `Cmd+C`)
   - Create a new file on your computer with the same name
   - Paste the content (`Ctrl+V` or `Cmd+V`)
   - Save it

**Files you need:**
```
📁 AssetForge/
  ├── 📁 src/
  │   ├── App.tsx
  │   ├── main.tsx
  │   ├── index.css
  │   ├── 📁 components/
  │   │   └── Viewer3D.tsx
  │   └── 📁 services/
  │       └── tripoApi.ts
  ├── server.js
  ├── package.json
  ├── index.html
  ├── tsconfig.json
  ├── vite.config.ts
  ├── tailwind.config.js
  └── postcss.config.js
```

---

## 🛠️ Step 3: Open the Terminal/Command Prompt

**What is a terminal?** It's a text-based way to give commands to your computer. Don't worry, you only need to type a few simple commands!

**For Windows:**
1. Open the `AssetForge` folder you just extracted/created
2. Click the **address bar** at the top (where it shows the folder path)
3. Type `cmd` and press **Enter**

**For Mac:**
1. Open **Terminal** app
2. Type `cd ` (that's "cd" followed by a space)
3. Drag the `AssetForge` folder into Terminal
4. Press **Enter**

You should now see the terminal is "inside" your AssetForge folder.

---

## ⚙️ Step 4: Install the App's Dependencies

In the terminal, type this command and press Enter:

```bash
npm install
```

**What does this do?** It downloads all the pieces the app needs to work (like React, Three.js, etc.). This takes 1-2 minutes.

You'll see a lot of text scrolling by — that's normal! Wait until it says something like "added 200 packages" and stops.

---

## 🔨 Step 5: Build the App

In the terminal, type this and press Enter:

```bash
npm run build
```

**What does this do?** It compiles all the code into a format your browser can understand. Takes about 15 seconds.

Wait until it says "✓ built in Xs" and stops.

---

## 🚀 Step 6: Run the App!

In the terminal, type this and press Enter:

```bash
node server.js
```

**What does this do?** It starts a special server that:
1. Shows the app in your browser
2. Proxies API calls to Tripo (so CORS doesn't block them)

You should see a message like:
```
╔══════════════════════════════════════════════════════╗
║   🎮 AssetForge is running!                          ║
║   → Open http://localhost:3000                       ║
╚══════════════════════════════════════════════════════╝
```

---

## 🌐 Step 7: Open Your Browser

1. Open your web browser (Chrome, Firefox, Edge, Safari — any works)
2. Go to: **http://localhost:3000**
3. You should see the AssetForge app!

---

## 🔑 Step 8: Add Your Tripo API Key

1. Click the **Settings** tab in the app
2. Go to [platform.tripo3d.ai/api-keys](https://platform.tripo3d.ai/api-keys)
3. **Delete your old key** (the one that gave you the error)
4. Click **"Create API Key"**
5. **Copy the new key immediately** (it starts with `tsk_`)
6. Paste it into the app
7. Click **"Test API Connection"** to verify it works

---

## 🎨 Step 9: Generate Your First 3D Model!

1. Go to the **Create** tab
2. Upload an image (fish, sword, character, anything!)
3. Click **"Generate 3D Model"**
4. Wait 30-90 seconds (it's calling the real Tripo AI!)
5. You'll see the **actual 3D model** in the viewer on the right!
6. Click **"Download .glb Model"** to save it

---

## 🎮 Step 10: Use It in Your Game

Now you have a real 3D model file! You can:
- Import it into Unity, Unreal, Godot, Three.js, etc.
- Tell your coding AI: "Here's the fish asset, add swimming behavior"
- The AI will set up animations, physics, and game logic

---

## 🆘 Troubleshooting

### "npm is not recognized" (Windows)
- You need to restart your computer after installing Node.js
- Or close and reopen the terminal

### "command not found: npm" (Mac)
- Same as above — restart your computer
- Or try closing Terminal and reopening it

### "Failed to fetch" or CORS error
- Make sure you're running `node server.js` (not just opening the HTML file)
- The server proxies the API calls to avoid CORS issues

### "Invalid API key" error
- Your API key expired or is invalid
- Go to platform.tripo3d.ai/api-keys and create a NEW one
- Delete the old one first

### Port 3000 already in use
- Another program is using port 3000
- Close it, or edit `server.js` and change `const PORT = 3000` to `const PORT = 3001`
- Then open http://localhost:3001 instead

---

## 📝 Quick Reference Commands

```bash
# Install dependencies (only needed once)
npm install

# Build the app (needed after code changes)
npm run build

# Run the server
node server.js

# Stop the server
Press Ctrl+C in the terminal
```

---

## 🎉 That's It!

You now have a working Image-to-3D pipeline on your computer! Every time you want to use it:

1. Open terminal
2. Navigate to the AssetForge folder
3. Run `node server.js`
4. Open http://localhost:3000
5. Generate 3D models!

**Pro tip:** Create a shortcut/batch file to automate this:

**Windows (create `start.bat`):**
```batch
@echo off
cd /d "%~dp0"
node server.js
pause
```

**Mac (create `start.sh`):**
```bash
#!/bin/bash
cd "$(dirname "$0")"
node server.js
```

Then just double-click the file to start the app!
