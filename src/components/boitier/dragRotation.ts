interface DragRotationOptions {
  /** Applique une rotation (radians) : `dx` autour de l'axe vertical, `dy` autour de l'axe horizontal. */
  rotate: (dx: number, dy: number) => void
  /** Molette : facteur multiplicatif à appliquer à la distance de la caméra. */
  zoom: (factor: number) => void
  reduced: () => boolean
  /** Appelé au premier contact (la rotation automatique de l'accueil s'arrête alors). */
  onStart?: () => void
}

/**
 * Rotation à la main du boîtier de l'accueil, copie du geste de `BoitierEclate` (page du boîtier) pour la même vitesse :
 * axe verrouillé au début du geste, un demi-tour pour la largeur de la vue, inertie au relâché, molette pour zoomer,
 * flèches du clavier par pas de 15°. Renvoie la fonction qui détache les écouteurs.
 */
export function attachDragRotation(canvas: HTMLCanvasElement, host: HTMLElement, opts: DragRotationOptions): () => void {
  let drag: { id: number; x0: number; y0: number; x: number; y: number; axis: 'x' | 'y' | null } | null = null
  let vel: { axis: 'x' | 'y'; angle: number } | null = null
  let inertiaRaf = 0
  const pointers = new Set<number>()
  const turn = (axis: 'x' | 'y', angle: number) => (axis === 'x' ? opts.rotate(angle, 0) : opts.rotate(0, angle))

  const onDown = (e: PointerEvent) => {
    pointers.add(e.pointerId)
    cancelAnimationFrame(inertiaRaf)
    opts.onStart?.()
    if (pointers.size > 1 || e.button !== 0) {
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
    turn(drag.axis, d)
  }
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId)
    if (!drag || e.pointerId !== drag.id) return
    drag = null
    canvas.style.cursor = 'grab'
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    if (opts.reduced() || !vel || Math.abs(vel.angle) < 0.002) return
    const coast = () => {
      if (!vel) return
      vel = { axis: vel.axis, angle: vel.angle * 0.86 }
      if (Math.abs(vel.angle) < 0.0005) return
      turn(vel.axis, vel.angle)
      inertiaRaf = requestAnimationFrame(coast)
    }
    coast()
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    opts.zoom(Math.exp(e.deltaY * 0.001))
  }
  const onKey = (e: KeyboardEvent) => {
    const s = (15 * Math.PI) / 180
    const d = ({ ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] } as Record<string, number[]>)[e.key]
    if (!d) return
    e.preventDefault()
    opts.onStart?.()
    opts.rotate(d[0]!, d[1]!)
  }

  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('keydown', onKey)
  return () => {
    cancelAnimationFrame(inertiaRaf)
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    canvas.removeEventListener('pointercancel', onUp)
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('keydown', onKey)
  }
}
