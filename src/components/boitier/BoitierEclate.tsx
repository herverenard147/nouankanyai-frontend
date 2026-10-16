import { useEffect, useRef, useState } from 'react'
import {
  AnimationMixer,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Material, Object3D } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { META, PARTS } from '@/components/boitier/boitierEclateData'
import type { Box } from '@/components/boitier/boitierEclateData'
import { Boitier2D } from '@/components/boitier/Boitier2D'
import { boitierState } from '@/components/boitier/boitierStates'
import type { BoitierState } from '@/components/boitier/boitierStates'
import { useReducedMotion } from '@/components/boitier/useReducedMotion'

/** Modèle du prototype, avec l'animation « Eclatement » : 0 → 1 s l'éclatement, puis un segment par sous-ensemble. */
const MODEL_URL = '/models/boitier-nouankany.glb'
const T_EXPLODED = 1.0
const PITCH_START = (20 * Math.PI) / 180
const YAW_START = (-35 * Math.PI) / 180
const KEYS = Object.keys(META.components)

const compOf = (m: Material) => m.name.split('__')[0] ?? ''
const refOf = (m: Material) => m.name.split('__')[1] ?? ''

interface Engine {
  explode: () => void
  assemble: () => void
  toggleFocus: (key: string) => void
  selectRef: (ref: string) => void
  back: () => void
  reset: () => void
}

interface BoitierEclateProps {
  state: BoitierState
  onUnavailable: () => void
}

/**
 * Boîtier en 3D, éclatable, pièce par pièce (repris de la page 3D du prototype, 2026-10-15) :
 * - glisser fait tourner le boîtier dans tous les sens, à la même vitesse que la page du prototype (un demi-tour pour
 *   la largeur de la vue, avec une inertie au relâché) ; molette : zoom ;
 * - « Éclaté » sépare les sous-ensembles ; un clic sur l'un d'eux, ou sur son nom dans la liste, le met en avant, et
 *   ses pièces se détaillent une à une (réelles : modèle KiCad du vrai composant ; sinon modélisées) ;
 * - l'anneau prend la couleur de l'état choisi.
 */
export default function BoitierEclate({ state, onUnavailable }: BoitierEclateProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const stateRef = useRef<BoitierState>(state)
  const reducedRef = useRef(false)
  const reduced = useReducedMotion()
  const [loaded, setLoaded] = useState(false)
  const [exploded, setExploded] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [label, setLabel] = useState<{ text: string; real: boolean | null } | null>(null)

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
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' })
    canvas.tabIndex = 0
    canvas.setAttribute('aria-label', 'Boîtier en 3D. Flèches du clavier : tourner.')
    host.appendChild(canvas)

    const scene = new Scene()
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
    const camera = new PerspectiveCamera(30, 1, 0.002, 20)

    // --- État du moteur (même logique que la page du prototype) ---
    let model: Object3D | null = null
    let mixer: AnimationMixer | null = null
    let t = 0
    let isExploded = false
    let focusedKey: string | null = null
    let selRef: string | null = null
    let pitch = PITCH_START
    let yaw = YAW_START
    const q = new Quaternion()
    const qp = new Quaternion()
    const qy = new Quaternion()
    const X = new Vector3(1, 0, 0)
    const Y = new Vector3(0, 1, 0)
    const aimLocal = new Vector3(...META.assembled.center)
    const aimGoal = new Vector3()
    const aimNow = new Vector3()
    let radiusGoal = 0.4
    let radiusNow = 0.4
    let labelLocal: Vector3 | null = null
    const materials: MeshStandardMaterial[] = []
    const baseOpacity = new Map<MeshStandardMaterial, number>()
    const ring: MeshStandardMaterial[] = []
    let queue: Promise<unknown> = Promise.resolve()
    let disposed = false

    const run = (fn: () => Promise<unknown> | void) => {
      queue = queue.then(fn).catch(() => undefined)
    }
    const composeQ = () => {
      qp.setFromAxisAngle(X, pitch)
      qy.setFromAxisAngle(Y, yaw)
      q.multiplyQuaternions(qp, qy)
      if (model) model.quaternion.copy(q)
    }
    composeQ()
    const applyAim = (jump: boolean) => {
      aimGoal.copy(aimLocal).applyQuaternion(q)
      if (jump) aimNow.copy(aimGoal)
    }
    const setTime = (x: number) => {
      t = x
      mixer?.setTime(x)
    }
    const tween = (to: number, ms: number) =>
      new Promise<void>((resolve) => {
        const from = t
        if (reducedRef.current || from === to) {
          setTime(to)
          resolve()
          return
        }
        const start = performance.now()
        const step = (now: number) => {
          if (disposed) return resolve()
          const k = Math.min(1, (now - start) / ms)
          setTime(from + (to - from) * k)
          if (k < 1) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      })
    const frame = (box: Box, k = 3.0, minR = 0.15) => {
      radiusGoal = Math.max(minR, box.size * k)
      aimLocal.set(...box.center)
      applyAim(false)
    }
    const fade = (keyName: string | null, ref: string | null = null) => {
      materials.forEach((m) => {
        let alpha = baseOpacity.get(m) ?? 1
        if (keyName && compOf(m) !== keyName) alpha = 0.08
        else if (keyName && ref && refOf(m) !== ref) alpha = 0.35
        m.transparent = alpha < 1
        m.opacity = alpha
        m.depthWrite = alpha >= 1
        m.needsUpdate = true
      })
    }
    const compTop = (keyName: string): [number, number, number] => {
      const c = META.components[keyName]!.center
      const y = Math.max(...Object.values(META.parts[keyName] ?? {}).map((p) => p.top[1]))
      return [c[0], y, c[2]]
    }
    const showLabel = (text: string, real: boolean | null, pos: [number, number, number]) => {
      labelLocal = new Vector3(...pos)
      setLabel({ text, real })
    }
    const hideLabel = () => {
      labelLocal = null
      setLabel(null)
    }
    const syncUi = () => {
      setExploded(isExploded)
      setFocused(focusedKey)
    }
    const explode = () => {
      if (isExploded) return Promise.resolve()
      isExploded = true
      syncUi()
      frame(META.exploded, 1.9)
      return tween(T_EXPLODED, 900)
    }
    const unfocus = async (reframe: boolean) => {
      if (!focusedKey) return
      const seg = META.components[focusedKey]!.segment
      focusedKey = null
      selRef = null
      syncUi()
      hideLabel()
      if (seg) await tween(seg[0], 650)
      if (seg) setTime(T_EXPLODED)
      fade(null)
      if (reframe) frame(META.exploded, 1.9)
    }
    const assemble = async () => {
      await unfocus(false)
      if (!isExploded) return
      isExploded = false
      syncUi()
      frame(META.assembled, 3.4)
      await tween(0, 900)
    }
    const focus = async (keyName: string) => {
      await explode()
      if (focusedKey === keyName) return
      await unfocus(false)
      const c = META.components[keyName]!
      focusedKey = keyName
      syncUi()
      fade(keyName)
      frame(c)
      showLabel(c.label, null, compTop(keyName))
      if (!c.segment) return
      setTime(c.segment[0])
      await tween(c.segment[1], 900)
    }
    const selectRef = (ref: string, force = false) => {
      if (!focusedKey || !PARTS[focusedKey]?.[ref]) return
      selRef = selRef === ref && !force ? null : ref
      syncUi()
      fade(focusedKey, selRef)
      if (selRef) {
        const box = META.parts[focusedKey]![selRef]!
        frame(box, 3.2, 0.05)
        const p = PARTS[focusedKey]![selRef]!
        showLabel(p.name, p.real, box.top)
      } else {
        frame(META.components[focusedKey]!)
        showLabel(META.components[focusedKey]!.label, null, compTop(focusedKey))
      }
    }
    let resetRaf = 0
    const reset = () => {
      cancelAnimationFrame(resetRaf)
      const p0 = pitch
      const y0 = yaw
      const wrap = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI))
      const dp = wrap(PITCH_START - pitch)
      const dy = wrap(YAW_START - yaw)
      const start = performance.now()
      const step = (now: number) => {
        const k = reducedRef.current ? 1 : Math.min(1, (now - start) / 600)
        const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
        pitch = p0 + dp * e
        yaw = y0 + dy * e
        composeQ()
        applyAim(true)
        if (k < 1) resetRaf = requestAnimationFrame(step)
      }
      resetRaf = requestAnimationFrame(step)
    }
    engineRef.current = {
      explode: () => run(explode),
      assemble: () => run(assemble),
      toggleFocus: (keyName) => run(() => (focusedKey === keyName ? unfocus(true) : focus(keyName))),
      selectRef: (ref) => run(() => selectRef(ref)),
      back: () => run(() => unfocus(true)),
      reset,
    }

    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return
        model = gltf.scene
        model.traverse((node) => {
          const mesh = node as Mesh
          if (!mesh.isMesh) return
          // Un matériau par pièce : la mise en retrait d'une pièce ne doit pas en toucher une autre.
          const list = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[]
          const own = list.map((m) => (m instanceof MeshStandardMaterial ? m.clone() : m))
          mesh.material = Array.isArray(mesh.material) ? own : own[0]!
          own.forEach((m) => {
            if (!(m instanceof MeshStandardMaterial)) return
            materials.push(m)
            baseOpacity.set(m, m.opacity)
            if (m.name.includes('__lens')) ring.push(m)
          })
        })
        scene.add(model)
        mixer = new AnimationMixer(model)
        const clip = gltf.animations[0]
        if (clip) {
          const action = mixer.clipAction(clip)
          action.play()
        }
        setTime(0)
        composeQ()
        frame(META.assembled, 3.4)
        aimNow.copy(aimGoal)
        radiusNow = radiusGoal
        setLoaded(true)
      },
      undefined,
      () => {
        if (!disposed) onUnavailable()
      },
    )

    // --- Rotation à la main : axe verrouillé au début du geste, inertie au relâché (comme la page du prototype) ---
    let drag: { id: number; x0: number; y0: number; x: number; y: number; axis: 'x' | 'y' | null } | null = null
    let down: { x: number; y: number; at: number } | null = null
    let vel: { axis: 'x' | 'y'; angle: number } | null = null
    let inertiaRaf = 0
    const pointers = new Set<number>()
    const rotateBy = (dx: number, dy: number) => {
      yaw += Math.cos(pitch) >= 0 ? dx : -dx
      pitch += dy
      composeQ()
      applyAim(true)
    }
    const onDown = (e: PointerEvent) => {
      pointers.add(e.pointerId)
      down = e.button === 0 ? { x: e.clientX, y: e.clientY, at: Date.now() } : null
      cancelAnimationFrame(inertiaRaf)
      cancelAnimationFrame(resetRaf)
      if (pointers.size > 1 || e.button !== 0 || !model) {
        drag = null
        return
      }
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, axis: null }
      vel = null
    }
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      if (!drag.axis) {
        const tx = e.clientX - drag.x0
        const ty = e.clientY - drag.y0
        if (Math.hypot(tx, ty) < 6) return
        drag.axis = Math.abs(tx) >= Math.abs(ty) ? 'x' : 'y'
      }
      const k = Math.PI / Math.max(300, Math.min(host.clientWidth, host.clientHeight))
      const d = drag.axis === 'x' ? (e.clientX - drag.x) * k : (e.clientY - drag.y) * k
      drag.x = e.clientX
      drag.y = e.clientY
      vel = { axis: drag.axis, angle: d }
      if (drag.axis === 'x') rotateBy(d, 0)
      else rotateBy(0, d)
    }
    const pick = (e: PointerEvent) => {
      if (!down || !model) return
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
      const quick = Date.now() - down.at < 450
      down = null
      if (moved > 6 || !quick) return
      const rect = canvas.getBoundingClientRect()
      const ndc = new Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      const ray = new Raycaster()
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObject(model, true).find((h) => {
        const m = (h.object as Mesh).material as Material
        return !Array.isArray(m) && m.opacity > 0.1
      })
      const m = hit ? ((hit.object as Mesh).material as Material) : null
      const keyName = m ? compOf(m) : ''
      const ref = m ? refOf(m) : ''
      if (!m || !META.components[keyName] || !PARTS[keyName]?.[ref]) {
        if (selRef) run(() => selectRef(selRef!))
        else if (focusedKey) run(() => unfocus(true))
        return
      }
      run(async () => {
        if (focusedKey === keyName) {
          selectRef(ref)
          return
        }
        await focus(keyName)
        selectRef(ref, true)
      })
    }
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      pick(e)
      if (!drag || e.pointerId !== drag.id) return
      drag = null
      canvas.style.cursor = 'grab'
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
      if (reducedRef.current || !vel || Math.abs(vel.angle) < 0.002) return
      const coast = () => {
        if (!vel) return
        vel = { axis: vel.axis, angle: vel.angle * 0.86 }
        if (Math.abs(vel.angle) < 0.0005) return
        if (vel.axis === 'x') rotateBy(vel.angle, 0)
        else rotateBy(0, vel.angle)
        inertiaRaf = requestAnimationFrame(coast)
      }
      coast()
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      radiusGoal = Math.min(2, Math.max(0.03, radiusGoal * Math.exp(e.deltaY * 0.001)))
    }
    const onKey = (e: KeyboardEvent) => {
      const s = (15 * Math.PI) / 180
      const d = ({ ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] } as Record<string, number[]>)[e.key]
      if (!d || !model) return
      e.preventDefault()
      rotateBy(d[0]!, d[1]!)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('keydown', onKey)

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

    const ledTarget = new Vector3()
    const ledNow = new Vector3(1, 1, 1)
    const labelPos = new Vector3()
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible || document.hidden) return
      // la caméra glisse vers son but (cible et distance), comme dans la page du prototype
      aimNow.lerp(aimGoal, 0.14)
      radiusNow += (radiusGoal - radiusNow) * 0.14
      camera.position.set(aimNow.x, aimNow.y, aimNow.z + radiusNow)
      camera.near = Math.max(0.001, radiusNow / 50)
      camera.updateProjectionMatrix()
      camera.lookAt(aimNow)

      const info = boitierState(stateRef.current)
      const c = info.led
      ledTarget.set(parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255)
      ledNow.lerp(ledTarget, 0.12)
      const pulse = info.id === 'ecoute' && !reducedRef.current ? 0.55 + 0.45 * Math.sin(((now - start) / 1000) * 2.6) : 1
      ring.forEach((m) => {
        m.color.setRGB(ledNow.x * 0.25, ledNow.y * 0.25, ledNow.z * 0.25)
        m.emissive.setRGB(ledNow.x, ledNow.y, ledNow.z)
        m.emissiveIntensity = 1.6 * pulse
      })

      renderer.render(scene, camera)
      const el = labelRef.current
      if (el && labelLocal) {
        labelPos.copy(labelLocal).applyQuaternion(q).project(camera)
        el.style.left = `${((labelPos.x + 1) / 2) * host.clientWidth}px`
        el.style.top = `${((1 - labelPos.y) / 2) * host.clientHeight}px`
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      engineRef.current = null
      cancelAnimationFrame(raf)
      cancelAnimationFrame(inertiaRaf)
      cancelAnimationFrame(resetRaf)
      observer.disconnect()
      visibility.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('keydown', onKey)
      scene.traverse((node) => {
        const mesh = node as Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        ;((Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[]).forEach((m) => m.dispose())
      })
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    }
  }, [onUnavailable])

  const engine = () => engineRef.current

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] w-full">
        <div ref={hostRef} className="absolute inset-0" />
        {!loaded && (
          // Image fixe du prototype le temps que le modèle 3D arrive (jamais l'ancien schéma)
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <Boitier2D state={state} />
          </div>
        )}
        {label && (
          <div
            ref={labelRef}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap bg-white px-2.5 py-1 text-xs font-semibold text-text-primary"
          >
            {label.text}
            {label.real !== null && (
              <span className={`ml-2 font-mono text-[0.65rem] uppercase ${label.real ? 'text-confirm' : 'text-text-secondary'}`}>
                {label.real ? 'réel' : 'modélisé'}
              </span>
            )}
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-px bg-dark-field-border text-xs font-semibold">
          {(
            [
              ['Assemblé', !exploded, () => engine()?.assemble()],
              ['Éclaté', exploded, () => engine()?.explode()],
            ] as const
          ).map(([text, on, act]) => (
            <button
              key={text}
              type="button"
              aria-pressed={on}
              onClick={act}
              className={`focus-ring px-3 py-1.5 ${on ? 'bg-white text-text-primary' : 'bg-dark-bg text-white hover:bg-white/10'}`}
            >
              {text}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => engine()?.reset()}
          className="focus-ring absolute right-2 top-2 bg-dark-bg px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
        >
          Recentrer
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px bg-dark-field-border" role="group" aria-label="Pièces du boîtier">
        {KEYS.map((k, i) => (
          <button
            key={k}
            type="button"
            aria-pressed={focused === k}
            onClick={() => engine()?.toggleFocus(k)}
            className={`focus-ring flex items-baseline gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold ${
              focused === k ? 'bg-white text-text-primary' : 'bg-dark-bg text-white hover:bg-white/10'
            }`}
          >
            <span className="font-mono text-[0.65rem] opacity-60">{String(i + 1).padStart(2, '0')}</span>
            {META.components[k]!.label}
          </button>
        ))}
      </div>

    </div>
  )
}
