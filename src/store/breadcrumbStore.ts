import { useEffect } from 'react'
import { create } from 'zustand'

/**
 * Fil d'Ariane (demande du propriétaire, 2026-10-20 : « juste le fil d'Ariane » pour revenir à la page précédente).
 * Une page de détail donne le nom de ce qu'elle montre (un boîtier, un client) ; sans nom, le fil dit « Détail ».
 */
interface BreadcrumbState {
  label: string | null
  setLabel: (label: string | null) => void
}

export const useBreadcrumbStore = create<BreadcrumbState>()((set) => ({
  label: null,
  setLabel: (label) => set({ label }),
}))

/** À appeler dans une page de détail avec le nom affiché ; effacé quand la page se ferme. */
export function useBreadcrumbLabel(label: string | null | undefined) {
  const setLabel = useBreadcrumbStore((s) => s.setLabel)
  useEffect(() => {
    setLabel(label ?? null)
    return () => setLabel(null)
  }, [label, setLabel])
}
