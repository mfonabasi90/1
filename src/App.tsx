import { useState, useRef, useCallback, useEffect } from 'react'
import { 
  Upload, Box, Settings, Download, Play, Trash2, Eye, 
  Zap, Layers, FileCode, RefreshCw,
  CheckCircle, AlertCircle, X, Folder, Image as ImageIcon,
  Key, ExternalLink, Loader2
} from 'lucide-react'
import Viewer3D from './components/Viewer3D'
import { generate3DFromImage, type GenerationOptions } from './services/tripoApi'
import { generate3DFromImageMeshy, type MeshyGenerationOptions } from './services/meshyApi'

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
  provider?: string
}

interface ApiSettings {
  provider: 'tripo' | 'meshy'
  tripoApiKey: string
  meshyApiKey: string
  quality: 'draft' | 'standard' | 'high'
  autoTexture: boolean
  modelVersion: string
}

function loadSettings(): ApiSettings {
  try {
    const saved = localStorage.getItem('assetforge_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.apiKey && !parsed.tripoApiKey) {
        parsed.tripoApiKey = parsed.apiKey
        delete parsed.apiKey
      }
      if (!parsed.meshyApiKey) parsed.meshyApiKey = ''
      if (!parsed.provider) parsed.provider = 'meshy'
      return parsed
    }
  } catch {}
  return {
    provider: 'meshy',
    tripoApiKey: '',
    meshyApiKey: '',
    quality: 'standard',
    autoTexture: true,
    modelVersion: 'v2.5-20250123',
  }
}

function saveSettings(settings: ApiSettings) {
  localStorage.setItem('assetforge_settings', JSON.stringify(settings))
}

function getApiKey(settings: ApiSettings): string {
  return settings.provider === 'tripo' ? settings.tripoApiKey : settings.meshyApiKey
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

  useEffect(() => { saveSettings(settings) }, [settings])

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
    const apiKey = getApiKey(settings).trim()
    if (!uploadedImage || !apiKey) {
      if (!apiKey) {
        setError(`Please add your ${settings.provider === 'tripo' ? 'Tripo' : 'Meshy'} API key in Settings first!`)
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
      imageUrl: uploadedImage,
      status: 'processing',
      progress: 0,
      progressStage: 'Starting...',
      createdAt: new Date(),
      category,
      provider: settings.provider,
    }

    setAssets(prev => [newAsset, ...prev])
    setSelectedAsset(newAsset)

    try {
      let result: { modelUrl: string; renderedImage?: string; taskId: string }

      if (settings.provider === 'meshy') {
        const options: MeshyGenerationOptions = {
          quality: settings.quality,
          autoTexture: settings.autoTexture,
        }
        result = await generate3DFromImageMeshy(
          apiKey,
          uploadedImage,
          options,
          (progress, stage) => {
            setProcessingProgress(progress)
            setProcessingStage(stage)
            setAssets(prev => prev.map(a => a.id === newAsset.id ? { ...a, progress, progressStage: stage } : a))
          }
        )
      } else {
        if (!uploadedFile) throw new Error('No file uploaded')
        const options: GenerationOptions = {
          quality: settings.quality,
          autoRig: false,
          autoTexture: settings.autoTexture,
          modelVersion: settings.modelVersion,
        }
        result = await generate3DFromImage(
          apiKey,
          uploadedFile,
          options,
          (progress, stage) => {
            setProcessingProgress(progress)
            setProcessingStage(stage)
            setAssets(prev => prev.map(a => a.id === newAsset.id ? { ...a, progress, progressStage: stage } : a))
          }
        )
      }

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
      let errorMsg = err.message || 'Generation failed'
      
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = 'Cannot connect to API. Make sure you are running "node server.js" locally.'
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        errorMsg = `Invalid ${settings.provider} API key. Check Settings.`
      } else if (errorMsg.includes('402') || errorMsg.includes('credit')) {
        errorMsg = `Not enough credits on ${settings.provider}. Go to their website to buy more, or switch to the other provider in Settings.`
      } else if (errorMsg.includes('429')) {
        errorMsg = 'Rate limit exceeded. Wait a moment and try again.'
      }
      
      setError(errorMsg)
      setAssets(prev => prev.map(a => a.id === newAsset.id ? { ...a, status: 'error', progressStage: 'Failed', errorMessage: errorMsg } : a))
      setSelectedAsset(prev => prev?.id === newAsset.id ? { ...prev, status: 'error', progressStage: 'Failed', errorMessage: errorMsg } : prev)
      setIsProcessing(false)
    }
  }, [uploadedImage, uploadedFile, settings, assetName, category])

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
      window.open(asset.modelUrl, '_blank')
    }
  }

  const currentApiKey = getApiKey(settings).trim()

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
            <p className="text-xs text-gray-400">
              Using: <span className="text-blue-400 font-medium">{settings.provider === 'tripo' ? 'Tripo AI' : 'Meshy AI'}</span>
            </p>
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

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Create 3D Asset</h2>
                <p className="text-gray-400">Upload an image → AI generates a real 3D model → Preview & export</p>
              </div>

              {!currentApiKey && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Key size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-300">API Key Required</p>
                    <p className="text-sm text-yellow-200/70 mt-1">
                      You need a {settings.provider === 'tripo' ? 'Tripo' : 'Meshy'} API key.{' '}
                      <button onClick={() => setActiveTab('settings')} className="underline hover:text-yellow-100">
                        Add your key in Settings
                      </button>
                    </p>
                  </div>
                </div>
              )}

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
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative border-2 border-dashed border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    
                    {uploadedImage ? (
                      <div className="w-full h-full">
                        <img src={uploadedImage} alt="Upload preview" className="w-full h-64 object-contain rounded-lg" />
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
                        <p className="text-sm text-gray-500">or click to browse • PNG, JPG, WEBP</p>
                      </>
                    )}
                  </div>

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
                        placeholder="e.g., Tropical Fish, Sword"
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
                              settings.quality === q ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {q.charAt(0).toUpperCase() + q.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={startGeneration}
                      disabled={!uploadedImage || !currentApiKey}
                      className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        uploadedImage && currentApiKey
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Zap size={18} />
                      {currentApiKey ? `Generate with ${settings.provider === 'tripo' ? 'Tripo' : 'Meshy'}` : 'Add API Key First'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                    <Loader2 size={36} className="text-blue-400 animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Generating Your 3D Model</h3>
                  <p className="text-gray-400 mb-6">{processingStage || 'Initializing...'}</p>
                  
                  <div className="max-w-md mx-auto">
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${processingProgress}%` }} />
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
                  <button onClick={() => setActiveTab('upload')} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500 transition">
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
                          <p className="text-xs text-gray-500 capitalize">{asset.category} • {asset.provider}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {asset.status === 'ready' && <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={12} /> Ready</span>}
                            {asset.status === 'processing' && <span className="flex items-center gap-1 text-xs text-blue-400"><Loader2 size={12} className="animate-spin" /> {Math.round(asset.progress)}%</span>}
                            {asset.status === 'error' && <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} /> Failed</span>}
                          </div>
                        </div>
                      </div>
                      
                      {asset.status === 'ready' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={(e) => { e.stopPropagation(); exportModel(asset, 'glb') }} className="flex-1 py-1.5 bg-blue-600 rounded-lg text-xs font-medium text-white hover:bg-blue-500 transition flex items-center justify-center gap-1">
                            <Download size={12} /> Download GLB
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id) }} className="py-1.5 px-2 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition">
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

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">Settings</h2>
              <p className="text-gray-400 mb-8">Choose your AI provider and add API keys</p>

              <div className="space-y-6">
                {/* Provider Selection */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Choose Provider</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSettings(s => ({ ...s, provider: 'meshy' }))}
                      className={`p-4 rounded-xl border text-left transition ${
                        settings.provider === 'meshy' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">Meshy AI</p>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Free credits</span>
                      </div>
                      <p className="text-xs text-gray-400">200 free credits on signup</p>
                    </button>
                    <button
                      onClick={() => setSettings(s => ({ ...s, provider: 'tripo' }))}
                      className={`p-4 rounded-xl border text-left transition ${
                        settings.provider === 'tripo' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <p className="font-medium mb-1">Tripo AI</p>
                      <p className="text-xs text-gray-400">Pay-as-you-go</p>
                    </button>
                  </div>
                </div>

                {/* API Keys */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Key size={18} className="text-yellow-400" />
                    {settings.provider === 'meshy' ? 'Meshy' : 'Tripo'} API Key
                  </h3>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.provider === 'meshy' ? settings.meshyApiKey : settings.tripoApiKey}
                      onChange={(e) => setSettings(s => ({
                        ...s,
                        ...(s.provider === 'meshy' ? { meshyApiKey: e.target.value } : { tripoApiKey: e.target.value })
                      }))}
                      placeholder={settings.provider === 'meshy' ? 'ms-...' : 'tsk_...'}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pr-20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition font-mono text-sm"
                    />
                    <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-700">
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="mt-3">
                    <a href={settings.provider === 'meshy' ? 'https://app.meshy.ai/dashboard' : 'https://platform.tripo3d.ai/api-keys'} target="_blank" rel="noopener" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      Get your API key <ExternalLink size={12} />
                    </a>
                  </div>

                  {currentApiKey && (
                    <button
                      onClick={async () => {
                        setError(null)
                        try {
                          const endpoint = settings.provider === 'meshy' ? '/api/meshy/openapi/v1/user/me' : '/api/tripo/wallet'
                          const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${currentApiKey}` } })
                          if (res.ok) {
                            const data = await res.json()
                            setError(`✅ API key is valid! ${JSON.stringify(data).slice(0, 200)}`)
                          } else {
                            const text = await res.text()
                            setError(`❌ API key test failed (${res.status}): ${text}`)
                          }
                        } catch (err: any) {
                          setError(`❌ Connection test failed: ${err.message}. Make sure you're running "node server.js".`)
                        }
                      }}
                      className="mt-4 w-full py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500 transition"
                    >
                      Test API Connection
                    </button>
                  )}
                </div>

                {/* Local Setup Guide */}
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                  <p className="text-sm text-green-300 mb-2">🖥️ <strong>Running Locally:</strong></p>
                  <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs space-y-1">
                    <p className="text-green-400">npm install</p>
                    <p className="text-green-400">npm run build</p>
                    <p className="text-green-400">node server.js</p>
                    <p className="text-gray-400"># Then open http://localhost:3000</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">Game Dev Workflow</h2>
              <p className="text-gray-400 mb-8">How to use generated assets in your game</p>

              <div className="space-y-4">
                {[
                  { title: 'Generate Asset Here', desc: 'Upload image → AI creates real 3D model with PBR textures', icon: Zap },
                  { title: 'Preview & Download', desc: 'View the real 3D model, then download the .glb file', icon: Download },
                  { title: 'Import to Game Engine', desc: 'Drop the GLB into Unity, Unreal, Godot, or Three.js', icon: Play },
                  { title: 'Tell the Coding AI', desc: 'Pass the asset info to your coding session for behavior setup', icon: FileCode },
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
            </div>
          )}
        </div>

        {/* Right Panel - 3D Viewer */}
        <div className="hidden lg:flex w-[450px] border-l border-gray-800 flex-col">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Box size={16} className="text-blue-400" />
              3D Preview
            </h3>
          </div>
          <div className="flex-1">
            <Viewer3D modelUrl={selectedAsset?.status === 'ready' ? selectedAsset.modelUrl : null} isDemo={!selectedAsset || selectedAsset.status !== 'ready'} />
          </div>
          {selectedAsset && selectedAsset.status === 'ready' && (
            <div className="p-4 border-t border-gray-800 space-y-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm font-medium">{selectedAsset.name}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{selectedAsset.category} • {selectedAsset.provider}</p>
              </div>
              <button onClick={() => exportModel(selectedAsset, 'glb')} className="w-full py-2.5 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500 transition flex items-center justify-center gap-2">
                <Download size={14} /> Download .glb Model
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
