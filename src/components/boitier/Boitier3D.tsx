import { useEffect, useRef, useState } from 'react'
import {
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Material, Object3D } from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { Boitier2D } from '@/components/boitier/Boitier2D'
import { boitierState } from '@/components/boitier/boitierStates'
import type { BoitierState } from '@/components/boitier/boitierStates'
import { useReducedMotion } from '@/components/boitier/useReducedMotion'

interface Boitier3DProps {
  state: BoitierState
  /** Appelé si le navigateur ne peut pas créer de contexte WebGL ou charger le modèle : l'appelant affiche alors le schéma 2D. */
  onUnavailable: () => void
  className?: string
}

/** Modèle du prototype (boitier-3d/boitier_pi.py, rendu Blender exporté en glTF) : teinte anthracite, anneau lumineux. */
const MODEL_URL = '/models/boitier-nouankany.glb'

/** Les pièces de l'anneau : leurs matériaux portent « __lens » (les 12 diodes et le diffuseur du capot). */
function ringMaterials(root: Object3D): MeshStandardMaterial[] {
  const found = new Set<MeshStandardMaterial>()
  root.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[]
    materials.forEach((material) => {
      if (material.name.includes('__lens') && material instanceof MeshStandardMaterial) found.add(material)
    })
  })
  return [...found]
}

/**
 * Vue 3D du boîtier (modèle du prototype, 15 octobre 2026) : la personne le fait tourner librement dans tous les sens
 * (glisser), et zoome (molette ou pincement). L'anneau prend la couleur de `state` ; le blanc d'écoute pulse.
 * Chargé à la demande (`BoitierViewer`) : la bibliothèque 3D et le modèle n'alourdissent que les pages qui le montrent.
 */
export default function Boitier3D({ state, onUnavailable, className }: Boitier3DProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<BoitierState>(state)
  const reducedRef = useRef(false)
  const reduced = useReducedMotion()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      onUnavailable()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    const canvas = renderer.domElement
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    canvas.style.touchAction = 'none'
    canvas.style.cursor = 'grab'
    host.appendChild(canvas)

    const scene = new Scene()
    // Reflets doux d'une pièce claire : sans eux, une coque anthracite paraît noire et plate sur fond sombre.
    const pmrem = new PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment
    scene.add(new HemisphereLight(0xffffff, 0x2a2622, 0.6))
    const key = new DirectionalLight(0xffffff, 1.4)
    key.position.set(0.5, 0.8, 0.6)
    scene.add(key)
    const rim = new DirectionalLight(0xffe2c8, 0.8)
    rim.position.set(-0.6, 0.4, -0.7)
    scene.add(rim)

    const camera = new PerspectiveCamera(30, 1, 0.005, 20)
    const controls = new TrackballControls(camera, canvas)
    controls.rotateSpeed = 3.2
    controls.zoomSpeed = 1.1
    controls.noPan = true
    controls.dynamicDampingFactor = 0.12
    let userTouched = false
    const onStart = () => {
      userTouched = true
      canvas.style.cursor = 'grabbing'
    }
    const onEnd = () => {
      canvas.style.cursor = 'grab'
    }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)

    let ring: MeshStandardMaterial[] = []
    let model: Object3D | null = null
    let cancelled = false
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (cancelled) return
        model = gltf.scene
        // Le fichier porte aussi l'animation de la vue éclatée : elle n'est pas jouée, le boîtier reste fermé.
        const bounds = new Box3().setFromObject(model)
        const center = bounds.getCenter(new Vector3())
        const size = bounds.getSize(new Vector3()).length()
        model.position.sub(center)
        scene.add(model)
        ring = ringMaterials(model)
        // Vue de départ : un peu au-dessus, de trois quarts, pour voir l'anneau et la façade (ports USB).
        const distance = size * 1.9
        camera.position.set(distance * 0.55, distance * 0.45, distance * 0.7)
        camera.near = size / 100
        camera.far = size * 40
        camera.updateProjectionMatrix()
        controls.target.set(0, 0, 0)
        controls.minDistance = size * 0.8
        controls.maxDistance = size * 4
        controls.update()
        setLoaded(true)
      },
      undefined,
      () => {
        if (!cancelled) onUnavailable()
      },
    )

    const resize = () => {
      const { clientWidth, clientHeight } = host
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      controls.handleResize()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    let visible = true
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
    })
    visibility.observe(host)

    const current = new Color(boitierState(stateRef.current).led)
    const target = new Color()
    let frame = 0
    let last = performance.now()
    const start = last

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible || document.hidden) return
      const t = (now - start) / 1000
      const still = reducedRef.current

      // Lente rotation tant que la personne n'a pas pris la main (jamais si elle préfère moins de mouvement).
      if (model && !userTouched && !still) model.rotation.y += dt * 0.35
      controls.update()

      // L'anneau glisse vers la couleur de l'état ; seule l'écoute pulse (environ 1 Hz, sans clignotement brusque).
      const info = boitierState(stateRef.current)
      target.set(info.led)
      current.lerp(target, 0.12)
      const pulse = info.id === 'ecoute' && !still ? 0.65 + 0.35 * Math.sin(t * Math.PI * 2 * 0.9) : 1
      // Teinte de base sombre : la couleur vient de l'émission, sinon le rouge tire vers le rose sous l'éclairage.
      ring.forEach((material) => {
        material.color.copy(current).multiplyScalar(0.25)
        material.emissive.copy(current)
        material.emissiveIntensity = MathUtils.lerp(0.4, 1.6, pulse)
      })

      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
      controls.dispose()
      scene.traverse((node) => {
        const mesh = node as Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[]
        materials.forEach((material) => material.dispose())
      })
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    }
  }, [onUnavailable])

  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        ref={hostRef}
        role="img"
        aria-label="Boîtier Nouankany en 3D : un cylindre anthracite, l'anneau lumineux sur le dessus. Glissez pour le faire tourner dans tous les sens, molette ou pincement pour zoomer."
        className="absolute inset-0"
      />
      {!loaded && (
          // Image fixe du prototype le temps que le modèle 3D arrive (jamais l'ancien schéma)
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <Boitier2D state={state} />
          </div>
        )}
    </div>
  )
}
