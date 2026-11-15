import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface MetricStateProps {
  status: 'pending' | 'error' | 'success'
  isEmpty?: boolean
  /** Lien proposé quand il n'y a rien à montrer : un état vide doit dire quoi faire. */
  emptyAction?: { to: string; label: string }
  children: ReactNode
}

/**
 * Corps d'une carte métrique : chargement / vide / indisponible / contenu.
 * La carte parente garde toujours son titre (et sa mention de fenêtre) visibles
 * autour de ce composant : jamais d'écran d'erreur global, un bloc à la fois.
 */
export function MetricState({ status, isEmpty, emptyAction, children }: MetricStateProps) {
  if (status === 'pending') {
    return (
      <div className="animate-pulse space-y-2" role="status" aria-label="Chargement en cours">
        <div className="h-4 w-2/3 rounded bg-bg-elevated" />
        <div className="h-4 w-1/2 rounded bg-bg-elevated" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <p className="text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">Indisponible.</span> Cette donnée ne répond pas
        actuellement. Le reste de la page continue de fonctionner.
      </p>
    )
  }

  if (isEmpty) {
    return (
      <p className="text-sm text-text-secondary">
        Aucune donnée pour le moment.
        {emptyAction && (
          <>
            {' '}
            <Link to={emptyAction.to} className="focus-ring font-semibold text-accent-cta hover:text-accent-cta-hover">
              {emptyAction.label} →
            </Link>
          </>
        )}
      </p>
    )
  }

  return <>{children}</>
}
