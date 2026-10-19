import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const HIGHLIGHT = 'notification-target'
const WAIT_MS = 4000

/**
 * Arrivée par une notification (lien « /app/page#ancre ») : la page défile jusqu'à l'élément et le met en valeur
 * quelques secondes. L'élément peut n'apparaître qu'après le chargement des données : il est cherché jusqu'à 4 s.
 */
export function useHashTarget(): void {
  const { hash, pathname, key } = useLocation()
  useEffect(() => {
    if (!hash || hash === '#main-content') return
    const id = decodeURIComponent(hash.slice(1))
    const started = Date.now()
    let timer = 0
    function look() {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
        el.classList.add(HIGHLIGHT)
        timer = window.setTimeout(() => el.classList.remove(HIGHLIGHT), 2500)
        return
      }
      if (Date.now() - started < WAIT_MS) timer = window.setTimeout(look, 200)
    }
    look()
    return () => window.clearTimeout(timer)
  }, [hash, pathname, key])
}
