import { kpiIdsFor, kpiSectionTitle } from '@/api/kpis'
import { KpiCard } from '@/components/kpi/KpiCard'
import type { Profile } from '@/types/domain'

interface KpiGridProps {
  profile: Profile
}

export function KpiGrid({ profile }: KpiGridProps) {
  const kpiIds = kpiIdsFor(profile)
  const title = kpiSectionTitle(profile)

  return (
    <section className="flex flex-col gap-3" aria-labelledby="kpi-grid-title">
      <h2 id="kpi-grid-title" className="text-section-title font-semibold text-text-primary">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiIds.map((kpiId) => (
          <KpiCard key={kpiId} profile={profile} kpiId={kpiId} />
        ))}
      </div>
    </section>
  )
}
