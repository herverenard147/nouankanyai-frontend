import { Link } from 'react-router-dom'

import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { useResolveMachine } from '@/hooks/queries/useMachineCrud'
import { ApiError } from '@/lib/apiClient'
import type { ActionAlert, AutoAlert } from '@/types/domain'

interface ActionAlertCardProps {
  variant: 'action'
  alert: ActionAlert
  /** Rendu minimal (une ligne, sans détail ni bouton résoudre) — utilisé sur
   * les pages Vue d'ensemble où les alertes ne sont qu'un aperçu, la liste
   * complète et les actions vivant sur /app/alertes. */
  compact?: boolean
}

interface AutoAlertCardProps {
  variant: 'auto'
  alert: AutoAlert
}

export function AlertCard(props: ActionAlertCardProps | AutoAlertCardProps) {
  const resolveMutation = useResolveMachine()

  if (props.variant === 'action') {
    const { alert, compact } = props

    if (compact) {
      return (
        <div className="flex items-center gap-2.5 rounded-control border border-alert bg-alert-bg px-3 py-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-alert" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{alert.title}</p>
          <span className="shrink-0 font-mono text-mono-badge font-semibold uppercase tracking-wide text-alert">
            {alert.level}
          </span>
          {alert.ctaTarget && (
            <Link
              to={alert.ctaTarget}
              className="focus-ring shrink-0 text-sm font-semibold text-accent-cta hover:text-accent-cta-hover"
            >
              {alert.ctaLabel}
            </Link>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-2 rounded-card border border-alert bg-alert-bg p-4">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-alert font-mono text-xs font-bold text-white"
            aria-hidden="true"
          >
            !
          </span>
          <p className="font-mono text-mono-badge font-semibold uppercase tracking-wide text-alert">
            Action humaine requise · {alert.level}
          </p>
        </div>
        <h3 className="text-sm font-semibold text-text-primary">{alert.title}</h3>
        <p className="text-sm text-text-secondary">{alert.detail}</p>
        <div className="flex flex-wrap items-center gap-2">
          <ProvenanceBadge value={alert.provenance} />
          <span className="text-sm text-text-tertiary">{alert.basis}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={resolveMutation.isPending}
            onClick={() => resolveMutation.mutate(alert.machineId)}
            className="focus-ring inline-flex min-h-9 w-fit items-center justify-center rounded-control border border-alert px-4 py-2 text-sm font-semibold text-alert transition-colors hover:bg-white disabled:opacity-60"
          >
            {resolveMutation.isPending ? 'Test en cours…' : 'Marquer comme résolu'}
          </button>
          {alert.ctaTarget ? (
            <Link
              to={alert.ctaTarget}
              className="focus-ring inline-flex min-h-9 w-fit items-center justify-center rounded-control bg-accent-cta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-cta-hover"
            >
              {alert.ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              className="focus-ring inline-flex min-h-9 w-fit items-center justify-center rounded-control bg-accent-cta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-cta-hover"
            >
              {alert.ctaLabel}
            </button>
          )}
        </div>
        {resolveMutation.isError && (
          <ApiErrorMessage
            message={resolveMutation.error instanceof ApiError ? resolveMutation.error.message : 'Échec du test.'}
            className="text-right text-sm text-alert"
          />
        )}
        {resolveMutation.isSuccess && resolveMutation.data && !resolveMutation.data.resolved && (
          <p className="text-right text-sm text-alert">
            Nouvelle mesure : température {resolveMutation.data.temperature_c}°C, vibration{' '}
            {resolveMutation.data.vibration_hz} Hz — l&rsquo;anomalie persiste encore. Réessayez une fois
            l&rsquo;intervention terminée.
          </p>
        )}
      </div>
    )
  }

  const { alert } = props
  return (
    <div className="flex flex-col gap-2 rounded-card border border-confirm bg-confirm-bg p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-pill bg-white px-2.5 py-1 font-mono text-mono-badge font-semibold text-confirm">
          auto-exécutée
        </span>
      </div>
      <h4 className="text-sm font-semibold text-text-primary">{alert.title}</h4>
      <p className="text-sm text-text-secondary">{alert.detail}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-tertiary">
        <span className="font-mono text-mono-axis">{alert.timestamp}</span>
        <Link to="/app/journal" className="focus-ring font-semibold text-accent-cta hover:text-accent-cta-hover">
          Voir le journal
        </Link>
      </div>
    </div>
  )
}
