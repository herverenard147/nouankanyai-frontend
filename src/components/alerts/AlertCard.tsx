import { Link } from 'react-router-dom'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import type { ActionAlert, AutoAlert } from '@/types/domain'

interface ActionAlertCardProps {
  variant: 'action'
  alert: ActionAlert
}

interface AutoAlertCardProps {
  variant: 'auto'
  alert: AutoAlert
}

export function AlertCard(props: ActionAlertCardProps | AutoAlertCardProps) {
  if (props.variant === 'action') {
    const { alert } = props
    return (
      <div className="flex flex-col gap-3 rounded-card border border-border border-l-[5px] border-l-alert bg-card p-6">
        <div className="flex items-start gap-4">
          <span
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-alert font-mono text-lg font-bold text-white"
            aria-hidden="true"
          >
            !
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-mono-badge font-semibold uppercase tracking-wide text-alert">
              Action humaine requise
            </p>
            <p className="text-sm text-text-secondary">{alert.level}</p>
          </div>
        </div>
        <h3 className="text-alert-title font-semibold text-text-primary">{alert.title}</h3>
        <p className="text-sm text-text-secondary">{alert.detail}</p>
        <div className="flex flex-wrap items-center gap-2">
          <ProvenanceBadge value={alert.provenance} />
          <span className="text-sm text-text-tertiary">{alert.basis}</span>
        </div>
        {alert.ctaTarget ? (
          <Link
            to={alert.ctaTarget}
            className="focus-ring inline-flex min-h-11 w-fit items-center justify-center rounded-control bg-accent-cta px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-cta-hover"
          >
            {alert.ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            className="focus-ring inline-flex min-h-11 w-fit items-center justify-center rounded-control bg-accent-cta px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-cta-hover"
          >
            {alert.ctaLabel}
          </button>
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
