import { AlertSection } from '@/components/alerts/AlertSection'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
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
      <AlertSection profile={profile} level={level} />

      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Historique des alertes passées</h2>
        <MetricState status={historyQuery.status} isEmpty={historyQuery.data?.length === 0}>
          <div className="flex flex-col gap-3">
            {historyQuery.data?.map((entry) => (
              <Card key={entry.id} className="flex flex-wrap items-center gap-4 p-5">
                <span className="font-mono text-sm text-text-tertiary">{entry.date}</span>
                <div className="min-w-[200px] flex-1">
                  <p className="font-semibold text-text-primary">{entry.title}</p>
                  <p className="text-sm text-text-secondary">{entry.resolution}</p>
                </div>
                <span className="rounded-pill bg-bg-elevated px-2.5 py-1 font-mono text-mono-badge font-semibold text-text-secondary">
                  {entry.registre === 'action' ? 'action requise' : 'auto-exécutée'}
                </span>
              </Card>
            ))}
          </div>
        </MetricState>
      </section>
    </div>
  )
}
