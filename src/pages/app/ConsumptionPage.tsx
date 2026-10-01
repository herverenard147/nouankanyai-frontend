import { AdminPlatformConsumption } from '@/components/consumption/AdminPlatformConsumption'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { TariffSection } from '@/components/tariff/TariffSection'
import { BarChart, type ChartBar } from '@/components/charts/BarChart'
import { SingleMeasureChart } from '@/components/charts/SingleMeasureChart'
import { useConsumptionSeries } from '@/hooks/queries/useConsumptionSeries'
import { computeYTicks } from '@/lib/formatters'
import { useSessionStore } from '@/store/sessionStore'

export function ConsumptionPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  // L'Admin n'a pas d'équipement en propre (voir fetchConsumptionSeries) : sa page Conso & coûts
  // appelait /api/machines sur son propre compte, toujours vide (bug trouvé par audit, 2026-10-01).
  const query = useConsumptionSeries(profile!, { enabled: profile !== 'admin' })

  if (!profile) return null

  if (profile === 'admin') {
    return (
      <div className="flex flex-col gap-7">
        <p className="text-sm text-text-secondary">Répartition de la puissance active, pour tous les comptes de la plateforme.</p>
        <AdminPlatformConsumption />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-7">
      <p className="text-sm text-text-secondary">
        Répartition de votre consommation par période et par poste, à partir de vos données mesurées ou estimées.
      </p>
      <TariffSection profile={profile} />

      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        {query.data?.map((series) => {
          const maxPoint = series.points.reduce((max, p) => (p.percent > max.percent ? p : max), series.points[0])
          const yTicks = maxPoint ? computeYTicks(maxPoint.value, maxPoint.percent) : ['0', '0', '0']
          const bars: ChartBar[] = series.points.map((point, i) => ({
            key: `cons-${i}`,
            x: point.label,
            percent: point.percent,
            tip: `${point.displayValue} ${series.yAxisUnit}`,
          }))

          return (
            <section key={series.granularity} className="flex flex-col gap-4 border-t-2 border-text-primary pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-section-title font-semibold text-text-primary">Consommation (suivi quotidien)</h2>
                <ProvenanceBadge value={series.provenance} />
              </div>
              {series.points.length === 1 ? (
                <SingleMeasureChart label={series.points[0].label} percent={series.points[0].percent} tip={`${series.points[0].displayValue} ${series.yAxisUnit}`} />
              ) : (
                <>
                  <div className="hidden sm:block">
                    <BarChart bars={bars} yTicks={yTicks} size="dashboard" yAxisLabel={series.yAxisUnit} xAxisLabel="jour" />
                  </div>
                  <div className="sm:hidden">
                    <BarChart bars={bars} yTicks={yTicks} size="dashboardMobile" yAxisLabel={series.yAxisUnit} xAxisLabel="jour" />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <h3 className="text-sm font-medium text-text-secondary">Répartition</h3>
                {series.byPost.map((post) => (
                  <div key={post.label} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-sm text-text-primary">{post.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-elevated">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${post.percent}%` }} />
                    </div>
                    <span className="w-12 shrink-0 text-right text-sm tabular-nums text-text-secondary">
                      {post.percent}%
                    </span>
                    <ProvenanceBadge value={post.provenance} />
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </MetricState>
    </div>
  )
}
