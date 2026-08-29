import { Link } from 'react-router-dom'

import { AlertCard } from '@/components/alerts/AlertCard'
import { useActionAlerts, useAutoAlerts } from '@/hooks/queries/useAlerts'
import { levelAtLeast } from '@/lib/levelGating'
import type { Level, Profile } from '@/types/domain'

interface AlertSectionProps {
  profile: Profile
  level: Level
  /** Limite le nombre d'alertes "action" affichées, avec un lien "Voir plus"
   * vers /app/alertes au-delà — utilisé sur les pages Vue d'ensemble pour ne
   * pas écraser les métriques KPI qui suivent. Sans cette prop (page
   * /app/alertes elle-même), la liste complète s'affiche. */
  maxActionAlerts?: number
}

/**
 * Les deux registres d'alerte, jamais mélangés dans la même liste : action humaine
 * requise d'abord (élément dominant de la page), puis les actions automatiques déjà
 * exécutées sous leur propre intertitre. Ce second registre est un détail
 * d'audit, pas une action à traiter — masqué au niveau "débutant" pour ne pas
 * noyer l'essentiel (voir src/lib/levelGating.ts), et masqué également dès que
 * la liste d'action est plafonnée (Vue d'ensemble) : ce n'est déjà plus le
 * détail à montrer en priorité là où le plafond s'applique.
 */
export function AlertSection({ profile, level, maxActionAlerts }: AlertSectionProps) {
  const actionQuery = useActionAlerts(profile)
  const autoQuery = useAutoAlerts(profile)
  const allowAutoBlock = levelAtLeast(level, 'amateur') && maxActionAlerts === undefined

  const showAutoBlock = allowAutoBlock && (autoQuery.status !== 'success' || (autoQuery.data?.length ?? 0) > 0)
  const visibleActionAlerts =
    maxActionAlerts !== undefined ? actionQuery.data?.slice(0, maxActionAlerts) : actionQuery.data
  const hiddenActionAlertsCount = (actionQuery.data?.length ?? 0) - (visibleActionAlerts?.length ?? 0)

  return (
    <section className="flex flex-col gap-4" aria-label="Alertes">
      {actionQuery.status === 'pending' && (
        <div className="animate-pulse rounded-card border border-border bg-card p-6">
          <div className="h-5 w-1/2 rounded bg-bg-elevated" />
        </div>
      )}
      {actionQuery.status === 'error' && (
        <div className="rounded-card border border-border bg-card p-6 text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">Alertes indisponibles.</span> Le reste de la page
          continue de fonctionner.
        </div>
      )}
      {actionQuery.status === 'success' &&
        (visibleActionAlerts!.length === 0 ? (
          <div className="rounded-card border border-border bg-card p-6 text-sm text-text-secondary">
            Aucune alerte active nécessitant une action.
          </div>
        ) : (
          visibleActionAlerts!.map((alert) => <AlertCard key={alert.id} variant="action" alert={alert} />)
        ))}

      {hiddenActionAlertsCount > 0 && (
        <Link
          to="/app/alertes"
          className="focus-ring self-end text-sm font-semibold text-accent-cta hover:text-accent-cta-hover"
        >
          Voir plus ({hiddenActionAlertsCount}) →
        </Link>
      )}

      {showAutoBlock && (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-mono-axis font-semibold uppercase tracking-wide text-text-secondary">
            Registre distinct : actions automatiques déjà exécutées
          </p>
          {autoQuery.status === 'pending' && (
            <div className="animate-pulse rounded-card border border-border bg-card p-6">
              <div className="h-5 w-1/2 rounded bg-bg-elevated" />
            </div>
          )}
          {autoQuery.status === 'error' && (
            <div className="rounded-card border border-border bg-card p-6 text-sm text-text-secondary">
              Indisponible pour le moment.
            </div>
          )}
          {autoQuery.status === 'success' &&
            autoQuery.data.map((alert) => <AlertCard key={alert.id} variant="auto" alert={alert} />)}
        </div>
      )}
    </section>
  )
}
