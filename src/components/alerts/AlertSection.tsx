import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { AlertCard } from '@/components/alerts/AlertCard'
import { useActionAlerts, useAutoAlerts } from '@/hooks/queries/useAlerts'
import { levelAtLeast } from '@/lib/levelGating'
import { useNotificationStore } from '@/store/notificationStore'
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
  const markAlertsSeen = useNotificationStore((s) => s.markAlertsSeen)
  // Le registre "actions automatiques" n'a de sens que pour un compte précis (délestage sur
  // SES machines) : pour l'Admin (alertes plateforme, tous comptes), pas de registre distinct.
  const allowAutoBlock = profile !== 'admin' && levelAtLeast(level, 'amateur') && maxActionAlerts === undefined

  // Page dédiée /app/alertes (jamais l'aperçu plafonné de Vue d'ensemble) :
  // visiter cette page marque tout ce qui est actuellement actif comme vu,
  // ce qui remet le badge de la sidebar à 0 (voir useNotificationBadges).
  useEffect(() => {
    if (maxActionAlerts === undefined && actionQuery.status === 'success') {
      markAlertsSeen(actionQuery.data.map((alert) => alert.id))
    }
  }, [maxActionAlerts, actionQuery.status, actionQuery.data, markAlertsSeen])

  const showAutoBlock = allowAutoBlock && (autoQuery.status !== 'success' || (autoQuery.data?.length ?? 0) > 0)
  const visibleActionAlerts =
    maxActionAlerts !== undefined ? actionQuery.data?.slice(0, maxActionAlerts) : actionQuery.data
  const hiddenActionAlertsCount = (actionQuery.data?.length ?? 0) - (visibleActionAlerts?.length ?? 0)

  return (
    <section className="flex flex-col gap-4" aria-label="Alertes">
      {actionQuery.status === 'pending' && (
        <div className={`animate-pulse border-t border-border ${maxActionAlerts !== undefined ? 'py-3' : 'py-6'}`}>
          <div className="h-5 w-1/2 rounded bg-bg-elevated" />
        </div>
      )}
      {actionQuery.status === 'error' && (
        <div className="border-t border-border py-6 text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">Alertes indisponibles.</span> Le reste de la page
          continue de fonctionner.
        </div>
      )}
      {actionQuery.status === 'success' &&
        (visibleActionAlerts!.length === 0 ? (
          <div className="border-t border-border py-6 text-sm text-text-secondary">
            Aucune alerte active nécessitant une action.
          </div>
        ) : (
          visibleActionAlerts!.map((alert) => (
            <AlertCard
              key={alert.id}
              variant="action"
              alert={alert}
              compact={maxActionAlerts !== undefined}
              readOnly={profile === 'admin'}
            />
          ))
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
        <div className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
          <p className="text-sm font-semibold text-text-primary">Registre distinct : actions automatiques déjà exécutées</p>
          {autoQuery.status === 'pending' && (
            <div className="animate-pulse border-t border-border py-6">
              <div className="h-5 w-1/2 rounded bg-bg-elevated" />
            </div>
          )}
          {autoQuery.status === 'error' && (
            <div className="border-t border-border py-6 text-sm text-text-secondary">Indisponible pour le moment.</div>
          )}
          {autoQuery.status === 'success' &&
            autoQuery.data.map((alert) => <AlertCard key={alert.id} variant="auto" alert={alert} />)}
        </div>
      )}
    </section>
  )
}
