import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Fait défiler vers l'élément dont l'id correspond au hash de l'URL, à chaque
 * changement de hash — y compris quand ce changement vient d'une navigation
 * client-side depuis une autre page (ex: NavBar/Footer sur /comment-ca-marche
 * qui pointent vers /#probleme). React Router ne fait pas ce défilement
 * automatiquement pour une navigation SPA (contrairement à un vrai chargement
 * de page) : sans ce hook, cliquer sur un lien d'ancre depuis une autre page
 * change juste l'URL, sans rien afficher. Le DOM de la section ciblée est
 * déjà committé au moment où cet effet s'exécute (toutes les sections sont
 * montées de façon synchrone dans LandingPage) : pas besoin de différer via
 * requestAnimationFrame, ce qui évite aussi que le scroll ne parte jamais
 * si l'onglet est en arrière-plan (rAF est mis en pause sur un onglet caché).
 */
export function useScrollToHash() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [hash])
}
