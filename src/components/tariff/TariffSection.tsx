import { tariffShown } from '@/api/tariff'
import { MetricState } from '@/components/state/MetricState'
import { TariffBar } from '@/components/tariff/TariffBar'
import { useTariff } from '@/hooks/queries/useTariff'
import type { Profile } from '@/types/domain'

interface TariffSectionProps {
  profile: Profile
}

/** Barre de paliers tarifaires CIE, dans le bloc KPI — masquée pour l'Admin. */
export function TariffSection({ profile }: TariffSectionProps) {
  if (!tariffShown(profile)) return null
  return <TariffSectionContent profile={profile} />
}

function TariffSectionContent({ profile }: TariffSectionProps) {
  const query = useTariff(profile)

  return (
    <section className="flex flex-col gap-2 rounded-card border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-text-secondary">Paliers tarifaires CIE</h3>
      <MetricState status={query.status}>
        {query.data && <TariffBar nowLabel={query.data.nowLabel} />}
      </MetricState>
    </section>
  )
}
