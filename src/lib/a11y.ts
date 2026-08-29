import type { KeyboardEvent } from 'react'

/** Classe utilitaire appliquant l'anneau de focus du design system (voir styles/index.css). */
export const FOCUS_RING = 'focus-ring'

/**
 * À poser sur `onKeyDown` d'un élément interactif non natif (ex. barre de
 * graphique en `<div role="button">`) pour que Entrée et Espace déclenchent
 * la même action qu'un clic, comme pour un vrai `<button>`.
 */
export function onEnterOrSpace(action: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }
}

/** À poser sur `onKeyDown` pour fermer un panneau (assistant, tiroir) via Échap. */
export function onEscape(action: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      action()
    }
  }
}
