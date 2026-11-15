import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface MetricStateProps {
  status: 'pending' | 'error' | 'success'
  isEmpty?: boolean
  /** Lien proposé quand il n'y a rien à montrer : un état vide doit dire quoi faire. */
  emptyAction?: { label: string; to?: string; onClick?: () => void }
  /** Relance la requête quand le chargement a échoué (ex. serveur endormi) : sans lui, pas de bouton. */
  onRetry?: () => void
  children: ReactNode
}

/**
 * Corps d'une carte métrique : chargement / vide / indisponible / contenu.
 * La carte parente garde toujours son titre (et sa mention de fenêtre) visibles
 * autour de ce composant : jamais d'écran d'erreur global, un bloc à la fois.
 */
export function MetricState({ status, isEmpty, emptyAction, onRetry, children }: MetricStateProps) {
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
      <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
        <p>
          <span className="font-semibold text-text-primary">Indisponible.</span> Cette donnée ne répond pas
          actuellement. Le reste de la page continue de fonctionner.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="focus-ring min-h-9 border border-border px-3 font-semibold text-accent-cta hover:text-accent-cta-hover"
          >
            Réessayer
          </button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <p className="text-sm text-text-secondary">
        Aucune donnée pour le moment.
        {emptyAction && (
          <>
            {' '}
            {emptyAction.to ? (
              <Link to={emptyAction.to} className="focus-ring font-semibold text-accent-cta hover:text-accent-cta-hover">
                {emptyAction.label} →
              </Link>
            ) : (
              <button
                type="button"
                onClick={emptyAction.onClick}
                className="focus-ring font-semibold text-accent-cta hover:text-accent-cta-hover"
              >
                {emptyAction.label} →
              </button>
            )}
          </>
        )}
      </p>
    )
  }

  return <>{children}</>
}
