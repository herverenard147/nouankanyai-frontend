import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { kpiIdsFor, kpiMeta, kpiSectionTitle } from '@/api/kpis'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { useKpi } from '@/hooks/queries/useKpi'
import type { Profile } from '@/types/domain'

interface KpiStripProps {
  profile: Profile
  /** Page de détail ouverte au clic, par identifiant de KPI. Un KPI sans cible n'est pas cliquable. */
  targets: Record<string, string>
}

/**
 * Les indicateurs clés d'une vue d'ensemble en une seule bande (4 colonnes, 2 sur mobile),
 * chacun étant un raccourci vers la page où l'on agit dessus. Remplace KpiGrid sur les
 * vues d'ensemble : même données (useKpi), même provenance obligatoire, sans cartes.
 */
export function KpiStrip({ profile, targets }: KpiStripProps) {
  const ids = kpiIdsFor(profile)

  return (
    <section
      aria-label={kpiSectionTitle(profile)}
      className="grid grid-cols-2 border-y border-border border-t-2 border-t-text-primary lg:grid-cols-4"
    >
      {ids.map((kpiId, index) => (
        <KpiTile key={kpiId} profile={profile} kpiId={kpiId} to={targets[kpiId]} index={index} />
      ))}
    </section>
  )
}

function KpiTile({ profile, kpiId, to, index }: { profile: Profile; kpiId: string; to?: string; index: number }) {
  const { label, window } = kpiMeta(profile, kpiId)
  const query = useKpi(profile, kpiId)

  // Filets verticaux : entre colonnes (2 par ligne sur mobile, 4 sur bureau) ; horizontal sous la 1re ligne mobile.
  const dividers = [
    index % 2 === 1 ? 'border-l border-border lg:border-l' : '',
    index % 4 !== 0 ? 'lg:border-l lg:border-border' : '',
    index < 2 ? 'border-b border-border lg:border-b-0' : '',
  ].join(' ')
  const className = `flex flex-col gap-1 px-4 py-4 lg:px-5 ${dividers}`

  const content: ReactNode = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        {to && <ArrowRight className="h-4 w-4 shrink-0 text-accent-cta" aria-hidden="true" />}
      </div>
      {window && (
        <p className="font-mono text-mono-axis text-text-tertiary">
          fenêtre {window.label}
          {window.sampleCount !== undefined ? ` · ${window.sampleCount.toLocaleString('fr-FR')} échantillons` : ''}
        </p>
      )}
      <MetricState status={query.status}>
        {query.data && (
          <>
            <p className="font-heading text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-tight tracking-[-0.02em] tabular-nums text-text-primary">
              {query.data.value}
              {query.data.unit && (
                <span className="ml-1 text-sm font-medium tracking-normal text-text-secondary">{query.data.unit}</span>
              )}
            </p>
            <p className="text-xs text-text-secondary">{query.data.note}</p>
            <ProvenanceBadge value={query.data.provenance} className="mt-1 w-fit" />
          </>
        )}
      </MetricState>
    </>
  )

  return to ? (
    <Link to={to} className={`focus-ring transition-colors hover:bg-bg-elevated ${className}`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}
