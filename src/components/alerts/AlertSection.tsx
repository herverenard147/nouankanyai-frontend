import { AlertCard } from '@/components/alerts/AlertCard'
import { useActionAlerts, useAutoAlerts } from '@/hooks/queries/useAlerts'
import type { Profile } from '@/types/domain'

interface AlertSectionProps {
  profile: Profile
}

/**
 * Les deux registres d'alerte, jamais mélangés dans la même liste : action humaine
 * requise d'abord (élément dominant de la page), puis les actions automatiques déjà
 * exécutées sous leur propre intertitre.
 */
export function AlertSection({ profile }: AlertSectionProps) {
  const actionQuery = useActionAlerts(profile)
  const autoQuery = useAutoAlerts(profile)

  const showAutoBlock = autoQuery.status !== 'success' || (autoQuery.data?.length ?? 0) > 0

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
        (actionQuery.data.length === 0 ? (
          <div className="rounded-card border border-border bg-card p-6 text-sm text-text-secondary">
            Aucune alerte active nécessitant une action.
          </div>
        ) : (
          actionQuery.data.map((alert) => <AlertCard key={alert.id} variant="action" alert={alert} />)
        ))}

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
