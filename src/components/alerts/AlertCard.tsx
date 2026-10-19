import { Spinner } from '@/components/ui/Button'
import { Link } from 'react-router-dom'

import { AdminVerifyMachineButton } from '@/components/admin/AdminVerifyMachineButton'
import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { useAutoResolveMachine } from '@/hooks/queries/useMachineCrud'
import { ApiError } from '@/lib/apiClient'
import { measureOrigin, measuredReading } from '@/lib/formatters'
import { alertTone } from '@/lib/severity'
import { AllowedLink } from '@/routes/AllowedLink'
import type { ActionAlert, AutoAlert } from '@/types/domain'

interface ActionAlertCardProps {
  variant: 'action'
  alert: ActionAlert
  /** Rendu minimal (une ligne, sans détail ni bouton résoudre) : utilisé sur
   * les pages Vue d'ensemble où les alertes ne sont qu'un aperçu, la liste
   * complète et les actions vivant sur /app/alertes. */
  compact?: boolean
  /** Admin (alertes plateforme, tous comptes confondus) : l'alerte porte sur l'équipement
   * d'un AUTRE compte. "Vérifier maintenant" appelle alors l'action support dédiée
   * (/api/admin/machines/{id}/test), jamais /api/machines/{id}/test (scopé sur le compte
   * Admin lui-même, qui n'a pas cet équipement) : avec une modale de confirmation avant
   * d'agir sur les données d'un autre compte (RGPD : jamais un clic accidentel, l'action
   * reste de toute façon tracée dans l'Audit du client qu'elle soit confirmée ou non). */
  admin?: boolean
}

interface AutoAlertCardProps {
  variant: 'auto'
  alert: AutoAlert
}

export function AlertCard(props: ActionAlertCardProps | AutoAlertCardProps) {
  // Hook appelé sans condition (règle React) : machineId/severity sont inertes
  // pour la variante 'auto', qui ne rend jamais le bouton plus bas.
  const isAction = props.variant === 'action'
  const autoResolve = useAutoResolveMachine(isAction ? props.alert.machineId : '', isAction ? props.alert.severity : 'faible')

  if (props.variant === 'action') {
    const { alert, compact, admin } = props
    const tone = alertTone(alert.severity)
    const diagnostic = autoResolve.lastResult?.diagnostic
    // La carte affiche déjà la cause et le geste conseillé : le retour ne les répète pas.
    const nextStep = diagnostic?.recommended_actions[0]
    const nextStepIsNew = Boolean(nextStep) && !alert.basis?.includes(nextStep as string) && !alert.detail.includes(nextStep as string)

    if (compact) {
      return (
        <div className="flex items-center gap-2.5 border-t border-border py-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${tone.bar}`} aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{alert.title}</p>
          <span className={`shrink-0 text-xs font-semibold ${tone.text}`}>{alert.level}</span>
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
        <span className={`absolute bottom-4 left-0 top-4 w-[3px] ${tone.bar}`} aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] font-bold text-text-primary">{alert.title}</h3>
          <p className={`mt-0.5 text-xs font-semibold ${tone.text}`}>
            {alert.tier === 'a_verifier' ? 'à vérifier · aucun seuil dépassé' : `${alert.level} · une personne doit intervenir`}
          </p>
          <p className="mt-1.5 text-sm text-text-secondary">{alert.detail}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-text-secondary">
            Source : <ProvenanceBadge value={alert.provenance} className="lowercase" />
            {alert.basis && <span>· {alert.basis}</span>}
          </p>
          {!admin && autoResolve.status === 'error' && (
            <ApiErrorMessage
              message={autoResolve.error instanceof ApiError ? autoResolve.error.message : 'Échec de la vérification.'}
              className="mt-2 text-sm text-alert"
            />
          )}
          {!admin && autoResolve.lastResult && !autoResolve.lastResult.resolved && autoResolve.status !== 'needs_human' && (
            <p className="mt-2 text-sm text-alert">
              {measureOrigin(autoResolve.lastResult)} : {measuredReading(autoResolve.lastResult)}. L&rsquo;anomalie est toujours là.{' '}
              {autoResolve.autoEnabled
                ? `Nouvel essai automatique ${autoResolve.attempt + 1}/${autoResolve.maxAttempts}…`
                : 'Elle ne se règle pas à distance : une personne doit intervenir sur l’appareil, puis relancer la vérification.'}
            </p>
          )}
          {!admin && autoResolve.status === 'needs_human' && autoResolve.lastResult && (
            <p className="mt-2 text-sm text-alert">
              Non résolu après {autoResolve.maxAttempts} tentatives automatiques ({measureOrigin(autoResolve.lastResult, true)} :{' '}
              {measuredReading(autoResolve.lastResult)}). Elle ne se règle pas à distance : une personne doit intervenir sur l&rsquo;appareil, puis relancer la vérification.
            </p>
          )}
          {!admin && autoResolve.lastResult && !autoResolve.lastResult.resolved && nextStepIsNew && (
            <p className="mt-2 text-sm text-text-secondary">À faire sur place : {nextStep}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-4">
          {alert.ctaTarget && (
            <Link to={alert.ctaTarget} className="focus-ring text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
              {alert.ctaLabel}
            </Link>
          )}
          {admin ? (
            <AdminVerifyMachineButton machineId={alert.machineId} subject={alert.title} />
          ) : (
            <button
              type="button"
              disabled={autoResolve.status === 'retrying'}
              onClick={() => autoResolve.trigger()}
              aria-busy={autoResolve.status === 'retrying' || undefined}
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 bg-dark-bg px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-bg/90 disabled:opacity-60"
            >
              {autoResolve.status === 'retrying' && <Spinner />}
              {autoResolve.status === 'retrying'
                ? autoResolve.autoEnabled
                  ? `Tentative ${autoResolve.attempt}/${autoResolve.maxAttempts} en cours…`
                  : 'Vérification en cours…'
                : 'Vérifier maintenant'}
            </button>
          )}
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
        <AllowedLink to="/app/journal" className="focus-ring text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
          Voir le journal
        </AllowedLink>
      </div>
    </div>
  )
}
