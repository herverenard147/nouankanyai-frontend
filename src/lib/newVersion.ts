/**
 * Après une mise en ligne, une page restée ouverte cherche des fichiers de l'ancienne version, qui
 * n'existent plus (« Failed to fetch dynamically imported module », vu le 2026-10-19 sur la page
 * Facturation de l'admin). On recharge alors la page une seule fois pour prendre la nouvelle version.
 */
const RELOAD_KEY = 'nouankany-rechargement-version'
const MIN_INTERVAL_MS = 30_000

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(message)
}

/** Recharge la page, sauf si on vient déjà de le faire (pas de boucle si le fichier manque vraiment). */
export function reloadForNewVersion(): boolean {
  let last = 0
  try {
    last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
  } catch {
    // stockage indisponible : on recharge quand même une fois
  }
  if (Date.now() - last < MIN_INTERVAL_MS) return false
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // voir plus haut
  }
  window.location.reload()
  return true
}
