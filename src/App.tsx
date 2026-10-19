import { useState, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, PresentationControls } from '@react-three/drei'
import { 
  Upload, Box, Settings, Download, Play, Trash2, Eye, 
  ChevronRight, Zap, Layers, FileCode, RefreshCw,
  CheckCircle, Clock, AlertCircle, X, Folder, Image as ImageIcon
} from 'lucide-react'
import * as THREE from 'three'

// Types
interface Asset {
  id: string
  name: string
  imageUrl: string
  modelUrl?: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  progress: number
  createdAt: Date
  category: string
  vertices?: number
  triangles?: number
}

interface ApiSettings {
  provider: 'tripo' | 'meshy' | 'csm'
  apiKey: string
  quality: 'draft' | 'standard' | 'high'
  autoRig: boolean
  autoTexture: boolean
}

// Demo 3D Model Component (placeholder fish)
function DemoModel() {
  return (
    <group>
      {/* Fish body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#4a9eff" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Fish tail */}
      <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.6, 1, 4]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Fish eye */}
      <mesh position={[0.6, 0.3, 0.6]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.65, 0.3, 0.7]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Fish fin */}
      <mesh position={[0, 0.8, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.6, 0.4, 0.05]} />
        <meshStandardMaterial color="#60a5fa" metalness={0.3} roughness={0.4} transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

function Viewer3D({ asset }: { asset: Asset | null }) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [3, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#4a9eff" />
        
        <PresentationControls
          global
          rotation={[0.1, 0.2, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
          speed={1.5}
        >
          <DemoModel />
        </PresentationControls>
        
        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} />
        <Environment preset="studio" />
        <OrbitControls enablePan={true} enableZoom={true} />
      </Canvas>
      
      {asset && (
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
          <p className="font-medium">{asset.name}</p>
          <p className="text-gray-300 text-xs">
            {asset.vertices ? `${asset.vertices.toLocaleString()} vertices` : 'Demo Model'} • 
            {asset.triangles ? ` ${asset.triangles.toLocaleString()} triangles` : ' Preview'}
          </p>
        </div>
      )}
      
      <div className="absolute top-4 right-4 flex gap-2">
        <button className="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-black/80 transition">
          <Eye size={16} />
        </button>
        <button className="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-black/80 transition">
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'settings' | 'workflow'>('upload')
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [assetName, setAssetName] = useState('')
  const [category, setCategory] = useState('creatures')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [settings, setSettings] = useState<ApiSettings>({
    provider: 'tripo',
    apiKey: '',
    quality: 'standard',
    autoRig: true,
    autoTexture: true,
  })

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
      setAssetName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
    }
  }, [])

  const simulateProcessing = useCallback(() => {
    if (!uploadedImage) return
    
    setIsProcessing(true)
    setProcessingProgress(0)
    
    const stages = [
      'Analyzing image...',
      'Detecting object boundaries...',
      'Generating depth map...',
      'Creating 3D mesh...',
      'Applying textures...',
      'Optimizing geometry...',
      settings.autoRig ? 'Adding skeleton...' : '',
      'Finalizing asset...',
    ].filter(Boolean)
    
    let currentStage = 0
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const next = prev + Math.random() * 8 + 2
        if (next >= 100) {
          clearInterval(interval)
          
          const newAsset: Asset = {
            id: Date.now().toString(),
            name: assetName || 'Untitled Asset',
            imageUrl: uploadedImage,
            status: 'ready',
            progress: 100,
            createdAt: new Date(),
            category,
            vertices: Math.floor(Math.random() * 5000) + 2000,
            triangles: Math.floor(Math.random() * 8000) + 4000,
          }
          
          setAssets(prev => [newAsset, ...prev])
          setSelectedAsset(newAsset)
          setIsProcessing(false)
          setUploadedImage(null)
          setAssetName('')
          return 100
        }
        
        const stageIndex = Math.floor((next / 100) * stages.length)
        if (stageIndex !== currentStage && stageIndex < stages.length) {
          currentStage = stageIndex
          setProcessingStage(stages[stageIndex])
        }
        
        return next
      })
    }, 200)
  }, [uploadedImage, assetName, category, settings.autoRig])

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id))
    if (selectedAsset?.id === id) setSelectedAsset(null)
  }

  const exportAsset = (asset: Asset, format: string) => {
    // In a real app, this would download the actual model file
    const blob = new Blob([`// ${asset.name} - ${format} export\n// Generated by AssetForge\n// Vertices: ${asset.vertices}\n// Triangles: ${asset.triangles}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${asset.name.replace(/\s+/g, '_').toLowerCase()}.${format}`
    a.click()
    URL.revokeObjectURL(url)
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
            <p className="text-xs text-gray-400">Image → 3D Game Asset Pipeline</p>
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
                <p className="text-gray-400">Upload an image and convert it into a game-ready 3D model</p>
              </div>

              {/* Upload Area */}
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
                          onClick={(e) => { e.stopPropagation(); setUploadedImage(null) }}
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
                        <p className="text-xs text-gray-600 mt-2">Best results: single object on clean background</p>
                      </>
                    )}
                  </div>

                  {/* Asset Config */}
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Layers size={18} className="text-blue-400" />
                      Asset Configuration
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
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-300">Auto-rig (skeleton)</span>
                        <div
                          onClick={() => setSettings(s => ({ ...s, autoRig: !s.autoRig }))}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            settings.autoRig ? 'bg-blue-600' : 'bg-gray-700'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            settings.autoRig ? 'translate-x-5.5 left-0.5' : 'left-0.5'
                          }`} style={{ transform: settings.autoRig ? 'translateX(20px)' : 'translateX(0)' }} />
                        </div>
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-300">Auto-texture</span>
                        <div
                          onClick={() => setSettings(s => ({ ...s, autoTexture: !s.autoTexture }))}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            settings.autoTexture ? 'bg-blue-600' : 'bg-gray-700'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform`} style={{ transform: settings.autoTexture ? 'translateX(20px)' : 'translateX(0)', left: '2px' }} />
                        </div>
                      </label>
                    </div>

                    <button
                      onClick={simulateProcessing}
                      disabled={!uploadedImage}
                      className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        uploadedImage
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Zap size={18} />
                      Generate 3D Model
                    </button>
                  </div>
                </div>
              ) : (
                /* Processing State */
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Generating Your 3D Model</h3>
                  <p className="text-gray-400 mb-6">{processingStage || 'Initializing...'}</p>
                  
                  <div className="max-w-md mx-auto">
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">{Math.round(processingProgress)}% complete</p>
                  </div>

                  {uploadedImage && (
                    <div className="mt-8 flex justify-center">
                      <img src={uploadedImage} alt="Source" className="w-32 h-32 object-contain rounded-xl border border-gray-700" />
                    </div>
                  )}
                </div>
              )}

              {/* How it works */}
              {!isProcessing && !uploadedImage && (
                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 mt-8">
                  <h3 className="text-lg font-semibold mb-6 text-center">How It Works</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { icon: Upload, title: 'Upload Image', desc: 'Drop any image of your object' },
                      { icon: Zap, title: 'AI Processing', desc: 'Tripo/Meshy generates the mesh' },
                      { icon: Eye, title: 'Preview & Edit', desc: 'View in 3D, adjust settings' },
                      { icon: Download, title: 'Export', desc: 'Download as GLB, OBJ, FBX' },
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
                <div className="flex gap-2">
                  {['all', 'creatures', 'characters', 'weapons', 'environment'].map(cat => (
                    <button key={cat} className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition capitalize">
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {assets.length === 0 ? (
                <div className="text-center py-20">
                  <Folder size={48} className="mx-auto text-gray-700 mb-4" />
                  <p className="text-gray-400 text-lg">No assets yet</p>
                  <p className="text-gray-600 text-sm mt-1">Upload an image to create your first 3D asset</p>
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
                      onClick={() => setSelectedAsset(asset)}
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
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle size={12} /> Ready
                            </span>
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-gray-500">{asset.vertices?.toLocaleString()} verts</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportAsset(asset, 'glb') }}
                          className="flex-1 py-1.5 bg-gray-800 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-700 transition flex items-center justify-center gap-1"
                        >
                          <Download size={12} /> GLB
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); exportAsset(asset, 'obj') }}
                          className="flex-1 py-1.5 bg-gray-800 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-700 transition flex items-center justify-center gap-1"
                        >
                          <Download size={12} /> OBJ
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id) }}
                          className="py-1.5 px-2 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">Game Dev Workflow</h2>
              <p className="text-gray-400 mb-8">How assets flow from AssetForge to your game engine</p>

              <div className="space-y-4">
                {/* Workflow Steps */}
                {[
                  {
                    step: 1,
                    title: 'Generate Asset',
                    desc: 'Upload image → AI converts to 3D model with textures and optional rigging',
                    status: 'active',
                    icon: Zap,
                    color: 'blue',
                  },
                  {
                    step: 2,
                    title: 'Review & Refine',
                    desc: 'Preview in 3D viewer, check topology, adjust quality if needed',
                    status: 'pending',
                    icon: Eye,
                    color: 'purple',
                  },
                  {
                    step: 3,
                    title: 'Export for Engine',
                    desc: 'Export as GLB/FBX with proper scale, materials, and skeleton data',
                    status: 'pending',
                    icon: Download,
                    color: 'green',
                  },
                  {
                    step: 4,
                    title: 'Import to Game',
                    desc: 'Drop into Unity/Unreal/Godot. Configure animations, physics, behaviors.',
                    status: 'pending',
                    icon: Play,
                    color: 'orange',
                  },
                  {
                    step: 5,
                    title: 'AI Integration',
                    desc: 'Asset data sent to coding session for behavior scripting & game logic',
                    status: 'pending',
                    icon: FileCode,
                    color: 'pink',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.status === 'active' ? `bg-${item.color}-500/20 border border-${item.color}-500/50` : 'bg-gray-800 border border-gray-700'
                      }`}>
                        <item.icon size={18} className={item.status === 'active' ? 'text-blue-400' : 'text-gray-500'} />
                      </div>
                      {i < 4 && <div className="w-0.5 h-8 bg-gray-800 mt-2" />}
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
                  Integration with AI Coding Session
                </h3>
                <div className="bg-gray-950 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                  <p className="text-gray-500">// When you're ready, tell the coding AI:</p>
                  <p className="text-green-400 mt-2">"Here's the fish asset from AssetForge:</p>
                  <p className="text-green-400">- File: fish_model.glb</p>
                  <p className="text-green-400">- Vertices: 4,200 | Triangles: 7,800</p>
                  <p className="text-green-400">- Has skeleton: Yes (swim animation rig)</p>
                  <p className="text-green-400">- Category: creatures</p>
                  <p className="text-green-400">Please add it to the game with swimming AI behavior."</p>
                  <p className="text-gray-500 mt-4">// The coding session will then:</p>
                  <p className="text-blue-400">1. Import the GLB into the game project</p>
                  <p className="text-blue-400">2. Set up the skeleton & animation controller</p>
                  <p className="text-blue-400">3. Add movement AI (swimming patterns)</p>
                  <p className="text-blue-400">4. Configure collision & physics</p>
                  <p className="text-blue-400">5. Spawn it in the game world</p>
                </div>
              </div>

              {/* API Connection */}
              <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-purple-400" />
                  Supported 3D Generation APIs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Tripo AI', desc: 'Fast image-to-3D, great for creatures', url: 'tripo3d.ai', status: 'Recommended' },
                    { name: 'Meshy', desc: 'High quality with PBR textures', url: 'meshy.ai', status: 'Available' },
                    { name: 'CSM (Common Sense Machines)', desc: 'Open source, self-hostable', url: 'csm.ai', status: 'Available' },
                  ].map(api => (
                    <div key={api.name} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{api.name}</h4>
                        <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{api.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{api.desc}</p>
                      <p className="text-xs text-blue-400">{api.url}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">Settings</h2>
              <p className="text-gray-400 mb-8">Configure your 3D generation pipeline</p>

              <div className="space-y-6">
                {/* API Provider */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">3D Generation Provider</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { id: 'tripo', name: 'Tripo AI', desc: 'Best overall' },
                      { id: 'meshy', name: 'Meshy', desc: 'Best textures' },
                      { id: 'csm', name: 'CSM', desc: 'Open source' },
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSettings(s => ({ ...s, provider: p.id as any }))}
                        className={`p-3 rounded-xl border text-left transition ${
                          settings.provider === p.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">API Key</h3>
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">
                      {settings.provider.charAt(0).toUpperCase() + settings.provider.slice(1)} API Key
                    </label>
                    <input
                      type="password"
                      value={settings.apiKey}
                      onChange={(e) => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                      placeholder="Enter your API key..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Get your API key from{' '}
                      <a href="https://www.tripo3d.ai" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                        tripo3d.ai
                      </a>
                      {' '}dashboard
                    </p>
                  </div>
                </div>

                {/* Defaults */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Default Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Default Quality</label>
                      <select
                        value={settings.quality}
                        onChange={(e) => setSettings(s => ({ ...s, quality: e.target.value as any }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                      >
                        <option value="draft">Draft (fast, low poly)</option>
                        <option value="standard">Standard (balanced)</option>
                        <option value="high">High (detailed, slower)</option>
                      </select>
                    </div>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">Auto-rig by default</p>
                        <p className="text-xs text-gray-500">Add skeleton to creatures & characters</p>
                      </div>
                      <div
                        onClick={() => setSettings(s => ({ ...s, autoRig: !s.autoRig }))}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          settings.autoRig ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform" style={{ transform: settings.autoRig ? 'translateX(20px)' : 'translateX(0)', left: '2px' }} />
                      </div>
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">Auto-texture by default</p>
                        <p className="text-xs text-gray-500">Generate PBR textures from source image</p>
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

                {/* Save */}
                <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-sm hover:from-blue-500 hover:to-purple-500 transition shadow-lg shadow-blue-600/20">
                  Save Settings
                </button>
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
            <div className="flex gap-2">
              <button className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 hover:text-white transition">Wireframe</button>
              <button className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 hover:text-white transition">Textured</button>
            </div>
          </div>
          <div className="flex-1">
            <Viewer3D asset={selectedAsset} />
          </div>
          {selectedAsset && (
            <div className="p-4 border-t border-gray-800 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <p className="text-gray-500">Vertices</p>
                  <p className="font-medium">{selectedAsset.vertices?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <p className="text-gray-500">Triangles</p>
                  <p className="font-medium">{selectedAsset.triangles?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportAsset(selectedAsset, 'glb')}
                  className="flex-1 py-2 bg-blue-600 rounded-lg text-xs font-medium hover:bg-blue-500 transition flex items-center justify-center gap-1"
                >
                  <Download size={12} /> Export GLB
                </button>
                <button
                  onClick={() => exportAsset(selectedAsset, 'fbx')}
                  className="flex-1 py-2 bg-gray-800 rounded-lg text-xs font-medium hover:bg-gray-700 transition flex items-center justify-center gap-1"
                >
                  <Download size={12} /> Export FBX
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
