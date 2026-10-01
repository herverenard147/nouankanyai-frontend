import { Link } from 'react-router-dom'

import { MetricState } from '@/components/state/MetricState'
import { useActionAlerts } from '@/hooks/queries/useAlerts'
import type { Profile } from '@/types/domain'

interface AlertsSummaryProps {
  profile: Profile
  /** Nombre d'alertes affichées ; les autres sont comptées (« + N autres »). */
  max?: number
}

/** Alertes nécessitant une action : le compte, les plus graves, et les raccourcis vers Alertes et Conseils. */
export function AlertsSummary({ profile, max = 2 }: AlertsSummaryProps) {
  const query = useActionAlerts(profile)
  const alerts = query.data ?? []
  const shown = alerts.slice(0, max)
  const hidden = alerts.length - shown.length

  return (
    <section aria-label="Alertes" className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-text-primary">
          Alertes
          {query.status === 'success' && alerts.length > 0 && (
            <span className="ml-2 font-mono text-xs text-alert">{alerts.length}</span>
          )}
        </h2>
        <Link to="/app/alertes" className="focus-ring text-[0.8125rem] font-semibold text-accent-cta hover:text-accent-cta-hover">
          Toutes les alertes →
        </Link>
      </div>

      <MetricState status={query.status} isEmpty={alerts.length === 0}>
        <ul>
          {shown.map((alert) => {
            const critical = alert.level.toLowerCase().includes('critique')
            return (
              <li key={alert.id} className="border-t border-border">
                <Link
                  to={alert.ctaTarget ?? '/app/alertes'}
                  className="focus-ring flex items-center gap-2.5 py-2.5 transition-colors hover:bg-bg-elevated"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${critical ? 'bg-alert' : 'bg-text-secondary'}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-text-primary">
                    {alert.title}
                  </span>
                  <span
                    className={`shrink-0 text-xs font-semibold capitalize ${critical ? 'text-alert' : 'text-text-secondary'}`}
                  >
                    {alert.level}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
        {alerts.length > 0 && (
          <div className="flex justify-between border-t border-border pt-2.5">
            <Link to="/app/conseils" className="focus-ring text-[0.8125rem] font-semibold text-accent-cta hover:text-accent-cta-hover">
              Voir les conseils ({alerts.length}) →
            </Link>
            {hidden > 0 && <span className="text-[0.8125rem] text-text-secondary">+ {hidden} autre{hidden > 1 ? 's' : ''}</span>}
          </div>
        )}
      </MetricState>
    </section>
  )
}
