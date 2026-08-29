import { ResolutionsList } from '@/components/anomalies/ResolutionsList'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { useOpenAnomalies } from '@/hooks/queries/useAnomalies'

export function AnomaliesPage() {
  const query = useOpenAnomalies('industrie')

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Détections actives</h2>
        <MetricState status={query.status} isEmpty={query.data?.length === 0}>
          <div className="flex flex-col gap-3">
            {query.data?.map((machine) => (
              <Card key={machine.id} className="flex flex-wrap items-center gap-4 border-l-[5px] border-l-alert p-5">
                <div className="min-w-[200px] flex-1">
                  <p className="font-semibold text-text-primary">{machine.machine}</p>
                  <p className="text-sm text-text-secondary">
                    {machine.statut} · température {machine.temperature} · vibration {machine.vibration}
                  </p>
                </div>
                <ProvenanceBadge value={machine.provenance} />
              </Card>
            ))}
          </div>
        </MetricState>
      </section>

      <ResolutionsList profile="industrie" />
    </div>
  )
}
