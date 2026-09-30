import { adminPanelIds } from '@/api/adminModels'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAdminModelPanel, useReloadModels } from '@/hooks/queries/useAdminModelPanel'

function AdminPanelCard({ panelId }: { panelId: string }) {
  const query = useAdminModelPanel(panelId)

  return (
    <Card className="flex flex-col gap-3 p-6">
      <MetricState status={query.status}>
        {query.data && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-section-title font-semibold text-text-primary">{query.data.title}</h2>
                <p className="text-sm text-text-secondary">{query.data.meta}</p>
              </div>
              <span className="rounded-pill bg-badge-synth-bg px-2.5 py-1 font-mono text-mono-badge font-semibold text-badge-synth-text">
                {query.data.badge}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {query.data.rows.map((row) => (
                <div key={row.label} className="rounded-control bg-bg-elevated p-3">
                  <dt className="text-xs text-text-secondary">{row.label}</dt>
                  <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-text-primary">{row.value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </MetricState>
    </Card>
  )
}

export function AdminModelsPage() {
  const reloadMutation = useReloadModels()

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        Modèles de prédiction et de détection actifs, avec leurs métriques d&rsquo;entraînement les plus récentes.
      </p>
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" disabled={reloadMutation.isPending} onClick={() => reloadMutation.mutate()}>
          {reloadMutation.isPending ? 'Rechargement…' : 'Recharger les modèles'}
        </Button>
        {reloadMutation.isSuccess && (
          <p className="text-sm text-confirm">Modèles actifs : {reloadMutation.data.active_models.join(', ')}</p>
        )}
        {reloadMutation.isError && <p className="text-sm text-alert">Échec du rechargement.</p>}
      </div>
      {adminPanelIds().map((id) => (
        <AdminPanelCard key={id} panelId={id} />
      ))}
    </div>
  )
}
