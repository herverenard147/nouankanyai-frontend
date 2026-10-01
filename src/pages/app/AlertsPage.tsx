import { AlertSection } from '@/components/alerts/AlertSection'
import { MetricState } from '@/components/state/MetricState'
import { useAlertHistory } from '@/hooks/queries/useAlerts'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

export function AlertsPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const historyQuery = useAlertHistory(profile!)
  const level = useLevel(profile ?? 'menage')

  if (!profile) return null

  return (
    <div className="flex flex-col gap-7">
      <p className="text-sm text-text-secondary">
        {profile === 'admin'
          ? 'Dérives détectées sur les équipements de tous les comptes de la plateforme.'
          : 'Dérives détectées sur vos équipements : actions déjà résolues automatiquement ou en attente de votre validation.'}
      </p>
      <AlertSection profile={profile} level={level} />

      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Historique des alertes passées</h2>
        <MetricState status={historyQuery.status} isEmpty={historyQuery.data?.length === 0}>
          <div className="flex flex-col border-t-2 border-text-primary">
            {historyQuery.data?.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center gap-4 border-b border-border py-4">
                <span className="text-sm tabular-nums text-text-tertiary">{entry.date}</span>
                <div className="min-w-[200px] flex-1">
                  <p className="font-semibold text-text-primary">{entry.title}</p>
                  <p className="text-sm text-text-secondary">{entry.resolution}</p>
                </div>
                <span className="text-xs font-semibold text-text-secondary">
                  {entry.registre === 'action' ? 'Action requise' : 'Auto-exécutée'}
                </span>
              </div>
            ))}
          </div>
        </MetricState>
      </section>
    </div>
  )
}
