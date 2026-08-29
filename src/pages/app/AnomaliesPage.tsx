import { ResolutionsList } from '@/components/anomalies/ResolutionsList'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { useOpenAnomalies } from '@/hooks/queries/useAnomalies'
import { useResolveMachine } from '@/hooks/queries/useMachineCrud'
import { useLevel } from '@/store/levelStore'
import type { MachineRow } from '@/types/domain'

function AnomalyRow({ machine }: { machine: MachineRow }) {
  const resolveMutation = useResolveMachine()

  return (
    <div className="flex flex-col gap-2 rounded-card border border-alert bg-alert-bg p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <p className="text-sm font-semibold text-text-primary">{machine.machine}</p>
          <p className="text-sm text-text-secondary">
            {machine.statut} · température {machine.temperature} · vibration {machine.vibration}
          </p>
        </div>
        <ProvenanceBadge value={machine.provenance} />
        <button
          type="button"
          disabled={resolveMutation.isPending}
          onClick={() => resolveMutation.mutate(machine.id)}
          className="focus-ring inline-flex min-h-9 w-fit items-center justify-center rounded-control border border-alert px-4 py-2 text-sm font-semibold text-alert transition-colors hover:bg-white disabled:opacity-60"
        >
          {resolveMutation.isPending ? 'Test en cours…' : 'Marquer comme résolu'}
        </button>
      </div>
      {resolveMutation.isError && <p className="text-right text-sm text-alert">Échec du test.</p>}
      {resolveMutation.isSuccess && resolveMutation.data && !resolveMutation.data.resolved && (
        <p className="text-right text-sm text-alert">
          Nouvelle mesure : température {resolveMutation.data.temperature_c}°C, vibration{' '}
          {resolveMutation.data.vibration_hz} Hz — l&rsquo;anomalie persiste encore. Réessayez une fois
          l&rsquo;intervention terminée.
        </p>
      )}
    </div>
  )
}

export function AnomaliesPage() {
  const query = useOpenAnomalies('industrie')
  const level = useLevel('industrie')

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Détections actives</h2>
        <MetricState status={query.status} isEmpty={query.data?.length === 0}>
          <div className="flex flex-col gap-3">
            {query.data?.map((machine) => (
              <AnomalyRow key={machine.id} machine={machine} />
            ))}
          </div>
        </MetricState>
      </section>

      <ResolutionsList profile="industrie" level={level} />
    </div>
  )
}
