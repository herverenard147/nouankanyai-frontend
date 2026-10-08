import { useMutation, useQuery } from '@tanstack/react-query'

import { adminPanelIds } from '@/api/adminModels'
import { rawMlDrift, rawMlDriftLog, rawMlHealth } from '@/api/rawBackend'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { MutationError } from '@/components/ui/Modal'
import { useAdminModelPanel, useReloadModels } from '@/hooks/queries/useAdminModelPanel'
import type { BackendDriftReport } from '@/types/backend'

const HEALTH_LABEL: Record<string, string> = { healthy: 'Opérationnel', degraded: 'Dégradé', unhealthy: 'Indisponible' }
const DRIFT_LABEL: Record<string, string> = { stable: 'Stable', warning: 'À surveiller', critical: 'Critique' }
const FEATURE_LABEL: Record<string, string> = {
  power_kw: 'Puissance',
  temperature_c: 'Température',
  vibration_hz: 'Vibration',
  pressure_bar: 'Pression',
}

/** GET /api/v1/ml/health : ce que le service de prédiction a réellement chargé. */
function MlHealthPanel() {
  const query = useQuery({ queryKey: ['ml-health'], queryFn: rawMlHealth })
  const yesNo = (value: boolean) => (value ? 'Oui' : 'Non')
  return (
    <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
      <MetricState status={query.status}>
        {query.data && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-section-title font-semibold text-text-primary">Santé du service de prédiction</h2>
                <p className="text-sm text-text-secondary">version du registre {query.data.version}</p>
              </div>
              <span className="text-xs font-semibold text-text-secondary">{HEALTH_LABEL[query.data.status] ?? query.data.status}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3 sm:grid-cols-4">
              {[
                ['Modèles chargés', yesNo(query.data.models_loaded)],
                ['Registre lu', yesNo(query.data.registry_loaded)],
                ['Schéma des mesures', yesNo(query.data.feature_schema_loaded)],
                ['Fichiers présents', yesNo(query.data.artifacts_ready)],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-xs text-text-secondary">{label}</dt>
                  <dd className="text-sm font-semibold text-text-primary">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </MetricState>
    </section>
  )
}

/** Indicateurs statistiques : plus de décimales que formatNumberFr n'en propose. */
const decimal = (value: number, digits: number) => value.toFixed(digits).replace('.', ',')

function DriftTable({ report }: { report: BackendDriftReport }) {
  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead className="bg-bg-elevated">
          <tr>
            {['Mesure', 'PSI', 'KS', 'Moyenne de référence', 'Moyenne observée', 'État'].map((label) => (
              <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.features.map((f) => (
            <tr key={f.feature_name} className="border-t border-border">
              <td className="px-4 py-3 text-text-primary">{FEATURE_LABEL[f.feature_name] ?? f.feature_name}</td>
              <td className="px-4 py-3 tabular-nums text-text-secondary">{decimal(f.psi, 3)}</td>
              <td className="px-4 py-3 tabular-nums text-text-secondary">{decimal(f.ks_statistic, 3)}</td>
              <td className="px-4 py-3 tabular-nums text-text-secondary">{decimal(f.reference_mean, 2)}</td>
              <td className="px-4 py-3 tabular-nums text-text-secondary">{decimal(f.observed_mean, 2)}</td>
              <td className={`px-4 py-3 text-xs font-semibold ${f.status === 'stable' ? 'text-text-secondary' : 'text-alert'}`}>
                {DRIFT_LABEL[f.status] ?? f.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** GET /api/v1/ml/drift et POST /drift/log : les relevés récents ressemblent-ils encore aux
 * données d'entraînement ? (PSI < 0,10 stable, 0,10 à 0,25 à surveiller, au-delà critique.) */
function DriftPanel() {
  const query = useQuery({ queryKey: ['ml-drift'], queryFn: () => rawMlDrift(), retry: false })
  const archive = useMutation({ mutationFn: () => rawMlDriftLog() })
  return (
    <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-section-title font-semibold text-text-primary">Dérive des données</h2>
          <p className="text-sm text-text-secondary">500 derniers relevés comparés à la distribution d&rsquo;entraînement.</p>
        </div>
        {query.data && (
          <span className="text-xs font-semibold text-text-secondary">
            {DRIFT_LABEL[query.data.global_status] ?? query.data.global_status} · {query.data.sample_size} relevés
          </span>
        )}
      </div>
      <MetricState status={query.status}>{query.data && <DriftTable report={query.data} />}</MetricState>
      {query.isError && <MutationError error={query.error} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" disabled={archive.isPending || !query.data} onClick={() => archive.mutate()}>
          {archive.isPending ? 'Archivage…' : 'Archiver ce rapport'}
        </Button>
        {archive.isSuccess && <p className="text-sm text-confirm">Rapport archivé dans l&rsquo;historique de dérive.</p>}
        <MutationError error={archive.error} />
      </div>
    </section>
  )
}

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
      <MlHealthPanel />
      <DriftPanel />
      {adminPanelIds().map((id) => (
        <AdminPanel key={id} panelId={id} />
      ))}
    </div>
  )
}
