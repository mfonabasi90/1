import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Center, useProgress, Html } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Component that loads and displays a GLTF/GLB model from URL
function ModelLoader({ url, onError }: { url: string; onError?: (err: string) => void }) {
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { scene } = useThree()

  useEffect(() => {
    const loader = new GLTFLoader()
    
    loader.load(
      url,
      (gltf) => {
        // Auto-scale the model to fit in view
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        gltf.scene.scale.setScalar(scale)
        
        // Center the model
        const center = box.getCenter(new THREE.Vector3())
        gltf.scene.position.sub(center.multiplyScalar(scale))
        
        setModel(gltf.scene)
      },
      undefined,
      (err: any) => {
        const errorMsg = `Failed to load model: ${err?.message || 'Unknown error'}`
        setError(errorMsg)
        if (onError) onError(errorMsg)
      }
    )

    return () => {
      if (model) {
        scene.remove(model)
      }
    }
  }, [url])

  if (error) {
    return null
  }

  if (!model) {
    return (
      <Html center>
        <div className="text-white text-sm bg-black/60 px-4 py-2 rounded-lg">
          Loading model...
        </div>
      </Html>
    )
  }

  return <primitive object={model} />
}

// Fallback demo model (simple fish shape)
function DemoModel() {
  const groupRef = useRef<THREE.Group>(null)
  
  useEffect(() => {
    let frame: number
    const animate = () => {
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.005
      }
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <group ref={groupRef}>
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

// Loading indicator
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-white text-sm">{progress.toFixed(0)}% loaded</p>
      </div>
    </Html>
  )
}

interface Viewer3DProps {
  modelUrl?: string | null
  isDemo?: boolean
  onError?: (err: string) => void
}

export default function Viewer3D({ modelUrl, isDemo = false, onError }: Viewer3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [3, 2, 5], fov: 50 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#4a9eff" />
        <pointLight position={[3, -2, 4]} intensity={0.3} color="#a855f7" />

        <Suspense fallback={<Loader />}>
          {modelUrl ? (
            <ModelLoader url={modelUrl} onError={onError} />
          ) : (
            <DemoModel />
          )}
        </Suspense>

        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} />
        <Environment preset="studio" />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true}
          autoRotate={!modelUrl && !isDemo}
          autoRotateSpeed={1}
        />
      </Canvas>

      {/* Overlay info */}
      <div className="absolute top-3 right-3 flex gap-2">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-gray-300">
          🖱️ Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  )
}
