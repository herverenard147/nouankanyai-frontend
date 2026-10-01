import { Link } from 'react-router-dom'

import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { useResolveMachine } from '@/hooks/queries/useMachineCrud'
import { ApiError } from '@/lib/apiClient'
import { formatNumberFr, NARROW_NBSP } from '@/lib/formatters'
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
        <div className="flex items-center gap-2.5 border-t border-border py-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-alert" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{alert.title}</p>
          <span className="shrink-0 text-xs font-semibold text-alert">{alert.level}</span>
          {alert.ctaTarget && (
            <Link to={alert.ctaTarget} className="focus-ring shrink-0 text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
              {alert.ctaLabel}
            </Link>
          )}
        </div>
      )
    }

    // Carte sobre (retour du propriétaire : les pastilles colorées, étiquettes en capitales et fonds teintés
    // faisaient « interface générée ») : filet rouge à gauche, texte, provenance en pied de carte.
    return (
      <div className="relative flex flex-col gap-3 border-t border-border py-4 pl-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <span className="absolute bottom-4 left-0 top-4 w-[3px] bg-alert" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] font-bold text-text-primary">{alert.title}</h3>
          <p className="mt-0.5 text-xs font-semibold text-alert">{alert.level} · une personne doit intervenir</p>
          <p className="mt-1.5 text-sm text-text-secondary">{alert.detail}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-text-secondary">
            Source : <ProvenanceBadge value={alert.provenance} className="lowercase" />
            {alert.basis && <span>· {alert.basis}</span>}
          </p>
          {resolveMutation.isError && (
            <ApiErrorMessage
              message={resolveMutation.error instanceof ApiError ? resolveMutation.error.message : 'Échec de la vérification.'}
              className="mt-2 text-sm text-alert"
            />
          )}
          {resolveMutation.isSuccess && resolveMutation.data && !resolveMutation.data.resolved && (
            <p className="mt-2 text-sm text-alert">
              Nouvelle mesure : température {formatNumberFr(resolveMutation.data.temperature_c, 1)}
              {NARROW_NBSP}°C, vibration {formatNumberFr(resolveMutation.data.vibration_hz, 1)}
              {NARROW_NBSP}Hz, l&rsquo;anomalie persiste encore. Réessayez une fois l&rsquo;intervention terminée.
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-4">
          {alert.ctaTarget && (
            <Link to={alert.ctaTarget} className="focus-ring text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
              {alert.ctaLabel}
            </Link>
          )}
          <button
            type="button"
            disabled={resolveMutation.isPending}
            onClick={() => resolveMutation.mutate(alert.machineId)}
            className="focus-ring inline-flex min-h-10 items-center justify-center bg-dark-bg px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-bg/90 disabled:opacity-60"
          >
            {resolveMutation.isPending ? 'Vérification en cours…' : 'Vérifier et résoudre'}
          </button>
        </div>
      </div>
    )
  }

  const { alert } = props
  return (
    <div className="relative flex flex-col gap-1.5 border-t border-border py-4 pl-4">
      <span className="absolute bottom-4 left-0 top-4 w-[3px] bg-confirm" aria-hidden="true" />
      <h4 className="text-sm font-bold text-text-primary">{alert.title}</h4>
      <p className="text-xs font-semibold text-confirm">Exécutée automatiquement</p>
      <p className="text-sm text-text-secondary">{alert.detail}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
        <span className="tabular-nums">{alert.timestamp}</span>
        <Link to="/app/journal" className="focus-ring text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
          Voir le journal
        </Link>
      </div>
    </div>
  )
}
