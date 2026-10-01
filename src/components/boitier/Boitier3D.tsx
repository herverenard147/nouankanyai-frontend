import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

import { boitierState } from '@/components/boitier/boitierStates'
import type { BoitierState } from '@/components/boitier/boitierStates'
import { useReducedMotion } from '@/components/boitier/useReducedMotion'

interface Boitier3DProps {
  state: BoitierState
  /** Appelé si le navigateur ne peut pas créer de contexte WebGL : l'appelant affiche alors le schéma 2D. */
  onUnavailable: () => void
  className?: string
}

// Dimensions du boîtier (unités de la scène).
const LARGEUR = 4.2
const HAUTEUR = 2.3
const PROFONDEUR = 2.2
const LED_Y = 0.55
const BASE_ROTATION = -0.5

function radialTexture(stops: [number, string][]): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    stops.forEach(([at, color]) => gradient.addColorStop(at, color))
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/**
 * Vue 3D du boîtier : corps arrondi, barre lumineuse et grille de haut-parleur sur la face avant.
 * La personne peut le faire tourner à la souris ou au doigt (glisser horizontalement). La lumière suit `state`.
 * Chargé à la demande (`BoitierViewer`) : la bibliothèque 3D n'alourdit que les pages qui montrent le boîtier.
 */
export default function Boitier3D({ state, onUnavailable, className }: Boitier3DProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<BoitierState>(state)
  const reducedRef = useRef(false)
  const reduced = useReducedMotion()

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
    canvas.style.touchAction = 'pan-y'
    host.appendChild(canvas)

    const scene = new Scene()
    const camera = new PerspectiveCamera(32, 1, 0.1, 50)
    camera.position.set(0, 0.9, 8.2)
    camera.lookAt(0, -0.05, 0)

    // Lumières : une lumière d'ambiance, une principale, et une lumière colorée devant la barre lumineuse.
    scene.add(new HemisphereLight(0xfff1e0, 0x1a1713, 1.1))
    const key = new DirectionalLight(0xffffff, 1.6)
    key.position.set(3, 4, 5)
    scene.add(key)
    const rim = new DirectionalLight(0xffd9b8, 0.6)
    rim.position.set(-4, 2, -3)
    scene.add(rim)
    const ledLight = new PointLight(0xffffff, 6, 7, 2)
    ledLight.position.set(0, LED_Y, PROFONDEUR / 2 + 0.9)
    scene.add(ledLight)

    const box = new Group()
    scene.add(box)

    const disposables: { dispose: () => void }[] = []
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item)
      return item
    }

    // Corps.
    const bodyMaterial = track(new MeshStandardMaterial({ color: 0x2b261e, roughness: 0.55, metalness: 0.12 }))
    const body = new Mesh(track(new RoundedBoxGeometry(LARGEUR, HAUTEUR, PROFONDEUR, 6, 0.3)), bodyMaterial)
    box.add(body)

    // Cadre sombre de la barre lumineuse, puis la barre elle-même.
    const darkMaterial = track(new MeshBasicMaterial({ color: 0x0e0c09 }))
    const bezel = new Mesh(track(new RoundedBoxGeometry(3.2, 0.3, 0.08, 3, 0.04)), darkMaterial)
    bezel.position.set(0, LED_Y, PROFONDEUR / 2 + 0.005)
    box.add(bezel)

    const ledMaterial = track(new MeshBasicMaterial({ color: 0xffffff }))
    const led = new Mesh(track(new RoundedBoxGeometry(2.9, 0.15, 0.06, 3, 0.03)), ledMaterial)
    led.position.set(0, LED_Y, PROFONDEUR / 2 + 0.03)
    box.add(led)

    // Halo autour de la barre.
    const glowTexture = track(radialTexture([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]))
    const glowMaterial = track(
      new MeshBasicMaterial({ map: glowTexture, color: 0xffffff, transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false }),
    )
    const glow = new Mesh(track(new PlaneGeometry(5.2, 1.7)), glowMaterial)
    glow.position.set(0, LED_Y, PROFONDEUR / 2 + 0.07)
    box.add(glow)

    // Grille du haut-parleur : 3 rangées de 9 trous.
    const holes = new InstancedMesh(track(new CircleGeometry(0.06, 16)), darkMaterial, 27)
    const dummy = new Object3D()
    let index = 0
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        dummy.position.set((col - 4) * 0.3, -0.12 - row * 0.3, PROFONDEUR / 2 + 0.004)
        dummy.updateMatrix()
        holes.setMatrixAt(index, dummy.matrix)
        index += 1
      }
    }
    holes.instanceMatrix.needsUpdate = true
    box.add(holes)

    // Ombre portée simulée.
    const shadowTexture = track(radialTexture([[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]))
    const shadow = new Mesh(
      track(new PlaneGeometry(7, 3.4)),
      track(new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.set(0, -HAUTEUR / 2 - 0.03, 0)
    scene.add(shadow)

    // Rotation à la main (glisser horizontalement) et mise en pause hors écran.
    let targetY = BASE_ROTATION
    let currentY = BASE_ROTATION
    let dragging = false
    let lastX = 0
    let userTouched = false
    const onDown = (event: PointerEvent) => {
      dragging = true
      userTouched = true
      lastX = event.clientX
      canvas.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      if (!dragging) return
      targetY += (event.clientX - lastX) * 0.01
      lastX = event.clientX
    }
    const onUp = (event: PointerEvent) => {
      dragging = false
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.style.cursor = 'grab'

    const resize = () => {
      const { clientWidth, clientHeight } = host
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
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
    const shown = new Color()
    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (!visible || document.hidden) return
      const t = (now - start) / 1000
      const still = reducedRef.current

      // Léger balancement tant que la personne n'a pas pris la main.
      if (!dragging && !userTouched && !still) targetY = BASE_ROTATION + Math.sin(t * 0.45) * 0.28
      currentY = MathUtils.lerp(currentY, targetY, 0.1)
      box.rotation.y = currentY
      box.rotation.x = still ? 0.04 : 0.04 + Math.sin(t * 0.3) * 0.02

      // La lumière glisse vers la couleur de l'état ; seule l'écoute pulse (environ 1 Hz, sans clignotement brusque).
      const info = boitierState(stateRef.current)
      target.set(info.led)
      current.lerp(target, 0.12)
      const pulse = info.id === 'ecoute' && !still ? 0.7 + 0.3 * Math.sin(t * Math.PI * 2 * 0.9) : 1
      shown.copy(current).multiplyScalar(pulse)
      ledMaterial.color.copy(shown)
      glowMaterial.color.copy(shown)
      glowMaterial.opacity = 0.6 * pulse
      ledLight.color.copy(current)
      ledLight.intensity = 6 * pulse

      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      disposables.forEach((item) => item.dispose())
      holes.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    }
  }, [onUnavailable])

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Boîtier Nouankany en 3D : une barre lumineuse sur la face avant et une grille de haut-parleur. Glissez pour le faire tourner."
      className={className}
    />
  )
}
