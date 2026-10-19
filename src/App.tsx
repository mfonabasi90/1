import { useState, useRef, useCallback, useEffect } from 'react'
import { 
  Upload, Box, Settings, Download, Play, Trash2, Eye, 
  Zap, Layers, FileCode, RefreshCw,
  CheckCircle, AlertCircle, X, Folder, Image as ImageIcon,
  Key, ExternalLink, Loader2, ChevronDown
} from 'lucide-react'
import Viewer3D from './components/Viewer3D'
import { generate3DFromImage, type GenerationOptions } from './services/tripoApi'

// Types
interface Asset {
  id: string
  name: string
  imageUrl: string
  modelUrl?: string
  renderedImage?: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  progress: number
  progressStage: string
  createdAt: Date
  category: string
  taskId?: string
  errorMessage?: string
}

interface ApiSettings {
  provider: 'tripo' | 'meshy' | 'csm'
  apiKey: string
  quality: 'draft' | 'standard' | 'high'
  autoRig: boolean
  autoTexture: boolean
  modelVersion: string
}

// Load settings from localStorage
function loadSettings(): ApiSettings {
  try {
    const saved = localStorage.getItem('assetforge_settings')
    if (saved) return JSON.parse(saved)
  } catch {}
  return {
    provider: 'tripo',
    apiKey: '',
    quality: 'standard',
    autoRig: true,
    autoTexture: true,
    modelVersion: 'v2.5-20250123',
  }
}

function saveSettings(settings: ApiSettings) {
  localStorage.setItem('assetforge_settings', JSON.stringify(settings))
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'settings' | 'workflow'>('upload')
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [assetName, setAssetName] = useState('')
  const [category, setCategory] = useState('creatures')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [settings, setSettings] = useState<ApiSettings>(loadSettings)
  const [showApiKey, setShowApiKey] = useState(false)

  // Save settings whenever they change
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
      setUploadedFile(file)
      setAssetName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
      setError(null)
    }
  }, [])

  const startGeneration = useCallback(async () => {
    if (!uploadedFile || !settings.apiKey) {
      if (!settings.apiKey) {
        setError('Please add your Tripo API key in Settings first!')
        setActiveTab('settings')
      }
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingStage('Initializing...')
    setError(null)

    const newAsset: Asset = {
      id: Date.now().toString(),
      name: assetName || 'Untitled Asset',
      imageUrl: uploadedImage!,
      status: 'processing',
      progress: 0,
      progressStage: 'Starting...',
      createdAt: new Date(),
      category,
    }

    setAssets(prev => [newAsset, ...prev])
    setSelectedAsset(newAsset)

    try {
      const options: GenerationOptions = {
        quality: settings.quality,
        autoRig: settings.autoRig,
        autoTexture: settings.autoTexture,
        modelVersion: settings.modelVersion,
      }

      const result = await generate3DFromImage(
        settings.apiKey,
        uploadedFile,
        options,
        (progress, stage) => {
          setProcessingProgress(progress)
          setProcessingStage(stage)
          setAssets(prev => prev.map(a => 
            a.id === newAsset.id 
              ? { ...a, progress, progressStage: stage }
              : a
          ))
        }
      )

      // Update asset with the model URL
      setAssets(prev => prev.map(a => 
        a.id === newAsset.id 
          ? { ...a, status: 'ready', progress: 100, modelUrl: result.modelUrl, renderedImage: result.renderedImage, taskId: result.taskId, progressStage: 'Complete!' }
          : a
      ))
      setSelectedAsset(prev => prev?.id === newAsset.id 
        ? { ...prev, status: 'ready', progress: 100, modelUrl: result.modelUrl, renderedImage: result.renderedImage, taskId: result.taskId, progressStage: 'Complete!' }
        : prev
      )
      
      setIsProcessing(false)
      setUploadedImage(null)
      setUploadedFile(null)
      setAssetName('')
    } catch (err: any) {
      const errorMsg = err.message || 'Generation failed'
      setError(errorMsg)
      setAssets(prev => prev.map(a => 
        a.id === newAsset.id 
          ? { ...a, status: 'error', progressStage: 'Failed', errorMessage: errorMsg }
          : a
      ))
      setSelectedAsset(prev => prev?.id === newAsset.id 
        ? { ...prev, status: 'error', progressStage: 'Failed', errorMessage: errorMsg }
        : prev
      )
      setIsProcessing(false)
    }
  }, [uploadedFile, uploadedImage, settings, assetName, category])

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id))
    if (selectedAsset?.id === id) setSelectedAsset(null)
  }

  const exportModel = async (asset: Asset, format: string) => {
    if (!asset.modelUrl) return
    try {
      const response = await fetch(asset.modelUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${asset.name.replace(/\s+/g, '_').toLowerCase()}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: open in new tab
      window.open(asset.modelUrl, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Box size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AssetForge
            </h1>
            <p className="text-xs text-gray-400">Real Image → 3D via Tripo AI</p>
          </div>
        </div>
        
        <nav className="flex gap-1 bg-gray-800/50 rounded-xl p-1">
          {[
            { id: 'upload', label: 'Create', icon: Upload },
            { id: 'library', label: 'Library', icon: Folder },
            { id: 'workflow', label: 'Workflow', icon: FileCode },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Create 3D Asset</h2>
                <p className="text-gray-400">Upload an image → Tripo AI generates a real 3D model → Preview & export</p>
              </div>

              {/* API Key Warning */}
              {!settings.apiKey && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Key size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-300">API Key Required</p>
                    <p className="text-sm text-yellow-200/70 mt-1">
                      You need a Tripo AI API key to generate 3D models.{' '}
                      <button onClick={() => setActiveTab('settings')} className="underline hover:text-yellow-100">
                        Add your key in Settings
                      </button>
                      {' '}— Get one free at{' '}
                      <a href="https://platform.tripo3d.ai/api-keys" target="_blank" rel="noopener" className="underline hover:text-yellow-100">
                        platform.tripo3d.ai
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-300">Error</p>
                    <p className="text-sm text-red-200/70 mt-1">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                    <X size={16} />
                  </button>
                </div>
              )}

              {!isProcessing ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload Zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative border-2 border-dashed border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    {uploadedImage ? (
                      <div className="w-full h-full">
                        <img
                          src={uploadedImage}
                          alt="Upload preview"
                          className="w-full h-64 object-contain rounded-lg"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); setUploadedImage(null); setUploadedFile(null) }}
                          className="absolute top-4 right-4 bg-red-500/80 rounded-full p-1.5 hover:bg-red-500 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition">
                          <ImageIcon size={28} className="text-gray-400 group-hover:text-blue-400 transition" />
                        </div>
                        <p className="text-lg font-medium text-gray-300 mb-1">Drop your image here</p>
                        <p className="text-sm text-gray-500">or click to browse • PNG, JPG, WEBP (max 10MB)</p>
                        <p className="text-xs text-gray-600 mt-2">Best results: single object on clean background</p>
                      </>
                    )}
                  </div>

                  {/* Asset Config */}
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Layers size={18} className="text-blue-400" />
                      Generation Settings
                    </h3>
                    
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Asset Name</label>
                      <input
                        type="text"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        placeholder="e.g., Tropical Fish, Sword, Character"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                      >
                        <option value="creatures">Creatures & Animals</option>
                        <option value="characters">Characters</option>
                        <option value="weapons">Weapons & Items</option>
                        <option value="environment">Environment</option>
                        <option value="vehicles">Vehicles</option>
                        <option value="props">Props & Objects</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Quality</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['draft', 'standard', 'high'] as const).map(q => (
                          <button
                            key={q}
                            onClick={() => setSettings(s => ({ ...s, quality: q }))}
                            className={`py-2 rounded-lg text-sm font-medium transition ${
                              settings.quality === q
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {q.charAt(0).toUpperCase() + q.slice(1)}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {settings.quality === 'draft' && '~5K faces • Fast • Good for prototyping'}
                        {settings.quality === 'standard' && '~adaptive • Balanced quality/speed'}
                        {settings.quality === 'high' && '~200K faces • Detailed • Slower'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Model Version</label>
                      <select
                        value={settings.modelVersion}
                        onChange={(e) => setSettings(s => ({ ...s, modelVersion: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                      >
                        <option value="P1-20260311">P1 (Best low-poly, ~2s mesh)</option>
                        <option value="v3.1-20260211">v3.1 (Latest, highest quality)</option>
                        <option value="v3.0-20250812">v3.0 (High quality)</option>
                        <option value="v2.5-20250123">v2.5 (Stable, default)</option>
                        <option value="Turbo-v1.0-20250506">Turbo (Fastest)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm text-gray-300">PBR Textures</span>
                          <p className="text-xs text-gray-500">Physically-based rendering materials</p>
                        </div>
                        <div
                          onClick={() => setSettings(s => ({ ...s, autoTexture: !s.autoTexture }))}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            settings.autoTexture ? 'bg-blue-600' : 'bg-gray-700'
                          }`}
                        >
                          <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform" style={{ transform: settings.autoTexture ? 'translateX(20px)' : 'translateX(0)', left: '2px' }} />
                        </div>
                      </label>
                    </div>

                    <button
                      onClick={startGeneration}
                      disabled={!uploadedImage || !settings.apiKey}
                      className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        uploadedImage && settings.apiKey
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Zap size={18} />
                      {settings.apiKey ? 'Generate 3D Model' : 'Add API Key First'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Processing State */
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                    <Loader2 size={36} className="text-blue-400 animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Generating Your 3D Model</h3>
                  <p className="text-gray-400 mb-6">{processingStage || 'Initializing...'}</p>
                  
                  <div className="max-w-md mx-auto">
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">{Math.round(processingProgress)}% complete</p>
                  </div>

                  {uploadedImage && (
                    <div className="mt-8 flex justify-center gap-8 items-center">
                      <div className="text-center">
                        <img src={uploadedImage} alt="Source" className="w-28 h-28 object-contain rounded-xl border border-gray-700" />
                        <p className="text-xs text-gray-500 mt-2">Input Image</p>
                      </div>
                      <div className="text-2xl text-gray-600">→</div>
                      <div className="text-center">
                        <div className="w-28 h-28 rounded-xl border border-gray-700 border-dashed flex items-center justify-center">
                          <Loader2 size={24} className="text-blue-400 animate-spin" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">3D Model</p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 mt-6">
                    This typically takes 30-90 seconds depending on quality settings
                  </p>
                </div>
              )}

              {/* How it works */}
              {!isProcessing && !uploadedImage && (
                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 mt-8">
                  <h3 className="text-lg font-semibold mb-6 text-center">How It Works (Real API)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { icon: Upload, title: '1. Upload Image', desc: 'Your image is sent to Tripo AI servers' },
                      { icon: Zap, title: '2. AI Generation', desc: 'Tripo generates real 3D mesh + textures' },
                      { icon: Eye, title: '3. Preview in 3D', desc: 'View the actual GLB model in the viewer' },
                      { icon: Download, title: '4. Export GLB', desc: 'Download real .glb file for your game' },
                    ].map((step, i) => (
                      <div key={i} className="text-center">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <step.icon size={20} className="text-blue-400" />
                        </div>
                        <p className="font-medium text-sm mb-1">{step.title}</p>
                        <p className="text-xs text-gray-500">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <p className="text-sm text-blue-300">
                      💡 <strong>This is a real pipeline</strong> — not a simulation. When you upload an image and click Generate, 
                      it calls the Tripo AI API to create an actual 3D model from your image. You'll see the real generated model in the viewer.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Asset Library</h2>
                  <p className="text-gray-400 text-sm">{assets.length} assets generated</p>
                </div>
              </div>

              {assets.length === 0 ? (
                <div className="text-center py-20">
                  <Folder size={48} className="mx-auto text-gray-700 mb-4" />
                  <p className="text-gray-400 text-lg">No assets yet</p>
                  <p className="text-gray-600 text-sm mt-1">Upload an image to generate your first real 3D asset</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500 transition"
                  >
                    Create Asset
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => asset.status === 'ready' && setSelectedAsset(asset)}
                      className={`bg-gray-900/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-500/50 ${
                        selectedAsset?.id === asset.id ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-800'
                      }`}
                    >
                      <div className="flex gap-4">
                        <img src={asset.imageUrl} alt={asset.name} className="w-20 h-20 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{asset.name}</h4>
                          <p className="text-xs text-gray-500 capitalize">{asset.category}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {asset.status === 'ready' && (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle size={12} /> Ready
                              </span>
                            )}
                            {asset.status === 'processing' && (
                              <span className="flex items-center gap-1 text-xs text-blue-400">
                                <Loader2 size={12} className="animate-spin" /> {Math.round(asset.progress)}%
                              </span>
                            )}
                            {asset.status === 'error' && (
                              <span className="flex items-center gap-1 text-xs text-red-400">
                                <AlertCircle size={12} /> Failed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {asset.status === 'ready' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); exportModel(asset, 'glb') }}
                            className="flex-1 py-1.5 bg-blue-600 rounded-lg text-xs font-medium text-white hover:bg-blue-500 transition flex items-center justify-center gap-1"
                          >
                            <Download size={12} /> Download GLB
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id) }}
                            className="py-1.5 px-2 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">Game Dev Workflow</h2>
              <p className="text-gray-400 mb-8">How to use generated assets in your game</p>

              <div className="space-y-4">
                {[
                  { step: 1, title: 'Generate Asset Here', desc: 'Upload image → Tripo AI creates real 3D model with PBR textures', icon: Zap, color: 'blue' },
                  { step: 2, title: 'Preview & Download', desc: 'View the real 3D model in the viewer, then download the .glb file', icon: Download, color: 'purple' },
                  { step: 3, title: 'Import to Game Engine', desc: 'Drop the GLB into Unity, Unreal, Godot, or Three.js project', icon: Play, color: 'green' },
                  { step: 4, title: 'Tell the Coding AI', desc: 'Pass the asset info to your coding session to set up behavior, physics, animations', icon: FileCode, color: 'orange' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20 border border-blue-500/50">
                        <item.icon size={18} className="text-blue-400" />
                      </div>
                      {i < 3 && <div className="w-0.5 h-8 bg-gray-800 mt-2" />}
                    </div>
                    <div className="pb-6">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Integration Code Example */}
              <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileCode size={18} className="text-blue-400" />
                  Example: Hand off to Coding AI
                </h3>
                <div className="bg-gray-950 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                  <p className="text-gray-500">// After downloading the GLB, tell your coding AI:</p>
                  <p className="text-green-400 mt-2">"I generated a 3D fish model using AssetForge.</p>
                  <p className="text-green-400">File: fish.glb (downloaded from the Library tab)</p>
                  <p className="text-green-400">Please add it to the game with:</p>
                  <p className="text-green-400">- Swimming animation behavior</p>
                  <p className="text-green-400">- Collision detection</p>
                  <p className="text-green-400">- Spawn in the ocean area"</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">Settings</h2>
              <p className="text-gray-400 mb-8">Configure your Tripo AI connection</p>

              <div className="space-y-6">
                {/* API Key */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Key size={18} className="text-yellow-400" />
                    Tripo AI API Key
                  </h3>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.apiKey}
                      onChange={(e) => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                      placeholder="tsk_..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pr-20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition font-mono text-sm"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-700"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href="https://platform.tripo3d.ai/api-keys"
                      target="_blank"
                      rel="noopener"
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      Get your API key <ExternalLink size={12} />
                    </a>
                    <span className="text-xs text-gray-600">• Free tier available</span>
                  </div>
                  <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400">
                      <strong className="text-gray-300">How it works:</strong> Your API key is stored locally in your browser. 
                      When you generate a model, the image is sent directly from your browser to Tripo's API. 
                      No backend server is involved — your key never leaves your device except to talk to Tripo.
                    </p>
                  </div>
                </div>

                {/* Defaults */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Default Generation Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Default Quality</label>
                      <select
                        value={settings.quality}
                        onChange={(e) => setSettings(s => ({ ...s, quality: e.target.value as any }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                      >
                        <option value="draft">Draft (5K faces, fast)</option>
                        <option value="standard">Standard (adaptive)</option>
                        <option value="high">High (200K faces, detailed)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Default Model Version</label>
                      <select
                        value={settings.modelVersion}
                        onChange={(e) => setSettings(s => ({ ...s, modelVersion: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                      >
                        <option value="P1-20260311">P1 (Best low-poly, ~2s)</option>
                        <option value="v3.1-20260211">v3.1 (Latest, highest quality)</option>
                        <option value="v3.0-20250812">v3.0 (High quality)</option>
                        <option value="v2.5-20250123">v2.5 (Stable default)</option>
                        <option value="Turbo-v1.0-20250506">Turbo (Fastest)</option>
                      </select>
                    </div>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">PBR Textures by default</p>
                        <p className="text-xs text-gray-500">Generate physically-based materials</p>
                      </div>
                      <div
                        onClick={() => setSettings(s => ({ ...s, autoTexture: !s.autoTexture }))}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          settings.autoTexture ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform" style={{ transform: settings.autoTexture ? 'translateX(20px)' : 'translateX(0)', left: '2px' }} />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Connection Status</h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${settings.apiKey ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-gray-300">
                      {settings.apiKey ? 'API Key configured' : 'No API key set'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {settings.apiKey 
                      ? `Key: ${settings.apiKey.slice(0, 8)}...${settings.apiKey.slice(-4)}` 
                      : 'Get a free key at platform.tripo3d.ai'}
                  </p>
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <p className="text-sm text-blue-300">
                    💡 <strong>Note about CORS:</strong> If you get a CORS error when generating, 
                    it means Tripo's API doesn't allow direct browser requests. In that case, you'd need to 
                    run a small proxy server, or use the Tripo dashboard directly and import the models here.
                    Most users find the direct API works fine from the browser.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - 3D Viewer */}
        <div className="hidden lg:flex w-[450px] border-l border-gray-800 flex-col">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Box size={16} className="text-blue-400" />
              3D Preview
              {selectedAsset?.status === 'ready' && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Live Model</span>
              )}
              {selectedAsset?.status === 'processing' && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Generating...</span>
              )}
            </h3>
          </div>
          <div className="flex-1">
            <Viewer3D 
              modelUrl={selectedAsset?.status === 'ready' ? selectedAsset.modelUrl : null} 
              isDemo={!selectedAsset || selectedAsset.status !== 'ready'}
            />
          </div>
          {selectedAsset && selectedAsset.status === 'ready' && (
            <div className="p-4 border-t border-gray-800 space-y-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm font-medium">{selectedAsset.name}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{selectedAsset.category}</p>
                {selectedAsset.taskId && (
                  <p className="text-xs text-gray-600 mt-1 font-mono">Task: {selectedAsset.taskId.slice(0, 8)}...</p>
                )}
              </div>
              <button
                onClick={() => exportModel(selectedAsset, 'glb')}
                className="w-full py-2.5 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500 transition flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download .glb Model
              </button>
              <p className="text-xs text-gray-500 text-center">
                Import this file into your game engine
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
