import { adminPanelIds } from '@/api/adminModels'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { useAdminModelPanel, useReloadModels } from '@/hooks/queries/useAdminModelPanel'

function AdminPanel({ panelId }: { panelId: string }) {
  const query = useAdminModelPanel(panelId)

  return (
    <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
      <MetricState status={query.status}>
        {query.data && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-section-title font-semibold text-text-primary">{query.data.title}</h2>
                <p className="text-sm text-text-secondary">{query.data.meta}</p>
              </div>
              <span className="text-xs font-semibold text-text-secondary">{query.data.badge}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3 sm:grid-cols-4">
              {query.data.rows.map((row) => (
                <div key={row.label} className="flex flex-col gap-1">
                  <dt className="text-xs text-text-secondary">{row.label}</dt>
                  <dd className="text-sm font-semibold tabular-nums text-text-primary">{row.value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </MetricState>
    </section>
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
        <AdminPanel key={id} panelId={id} />
      ))}
    </div>
  )
}
