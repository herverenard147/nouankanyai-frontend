import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { rawCreateMainMeter, rawDeleteMainMeter, rawMainMeters, rawSites } from '@/api/rawBackend'
import { LineChart } from '@/components/charts/LineChart'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, MutationError } from '@/components/ui/Modal'
import { SERIES_COLORS } from '@/lib/chartColors'
import { formatNumberFr } from '@/lib/formatters'
import type { ConsumptionGranularity } from '@/types/backend'
import type { Profile } from '@/types/domain'

const SECTION = 'flex flex-col gap-4 border-t-2 border-text-primary pt-4'
const kwh = (v: number) => `${formatNumberFr(v, v < 100 ? 1 : 0)} kWh`

/**
 * Compteur général (demande du propriétaire, 2026-10-19) : le capteur posé sur le compteur du site mesure tout ce que le
 * site consomme. Comparé à la somme des appareils suivis, il montre si nos mesures tiennent et quelle part n'est pas
 * suivie.
 */
export function MainMeterCard({ granularity, window, profile }: { granularity: ConsumptionGranularity; window: string; profile: Profile }) {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['main-meters', granularity], queryFn: () => rawMainMeters(granularity) })
  const hasSites = profile === 'pme' || profile === 'industrie'
  const sites = useQuery({ queryKey: ['sites'], queryFn: rawSites, enabled: hasSites })
  const [siteId, setSiteId] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const refresh = () => client.invalidateQueries({ queryKey: ['main-meters'] })
  const create = useMutation({ mutationFn: () => rawCreateMainMeter(siteId || sites.data?.[0]?.id), onSuccess: refresh })
  const remove = useMutation({ mutationFn: (code: string) => rawDeleteMainMeter(code), onSuccess: () => { setRemoving(null); void refresh() } })
  const meters = query.data?.compteurs ?? []
  const every = Math.max(1, Math.ceil((query.data?.labels.length ?? 0) / 12))

  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Compteur général, {window}</h2>
      <p className="text-sm text-text-secondary">
        Un capteur posé sur le compteur général mesure tout ce que le site consomme. Comparé à la somme de vos appareils suivis, il montre la part
        de consommation qui n’est pas suivie et vérifie nos mesures.
      </p>
      <MetricState status={query.status}>
        {meters.length === 0 ? (
          <div className="flex flex-wrap items-end gap-3">
            {hasSites && (sites.data?.length ?? 0) > 1 && (
              <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
                Site du compteur
                <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="focus-ring min-h-10 rounded-control border border-border bg-card px-3 text-sm">
                  {sites.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button type="button" variant="outline" loading={create.isPending} onClick={() => create.mutate()}>
              Déclarer le compteur général
            </Button>
            <p className="w-full text-xs text-text-secondary">
              Le technicien relie ensuite le capteur du compteur à ce point de mesure, dans la page de vos sources de mesures.
            </p>
          </div>
        ) : (
          meters.map((m) => (
            <div key={m.code} className="flex flex-col gap-3">
              <h3 className="font-semibold text-text-primary">
                {m.nom} <span className="font-normal text-text-secondary">({m.site}, {m.appareils_suivis} appareils suivis)</span>
              </h3>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-text-secondary">Mesuré au compteur</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-text-primary">{kwh(m.compteur_kwh)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-text-secondary">Somme des appareils</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-text-primary">{kwh(m.appareils_kwh)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-text-secondary">Non suivi</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-text-primary">
                    {m.ecart_pct === null ? 'n.d.' : `${formatNumberFr(m.ecart_pct, 1)} %`}
                  </dd>
                </div>
              </dl>
              <p className={`text-sm font-semibold ${m.ecart_pct !== null && Math.abs(m.ecart_pct) >= 10 ? 'text-alert' : 'text-text-primary'}`}>{m.verdict}</p>
              <p className="text-xs text-text-secondary">
                Temps couvert par des relevés : compteur {formatNumberFr(m.couverture_compteur_pct, 0)} %, appareils {formatNumberFr(m.couverture_appareils_pct, 0)} %.
              </p>
              {m.points_compteur.some((p) => p !== null) && query.data && (
                <LineChart
                  labels={query.data.labels}
                  unit="kWh"
                  xLabelEvery={every}
                  series={[
                    { name: 'Compteur général', values: m.points_compteur },
                    { name: 'Somme des appareils', values: m.points_appareils, color: SERIES_COLORS[1] },
                  ]}
                />
              )}
              <Button type="button" variant="outline" className="w-fit" onClick={() => setRemoving(m.code)}>
                Retirer ce compteur
              </Button>
            </div>
          ))
        )}
      </MetricState>
      <MutationError error={create.error} />
      {removing && (
        <ConfirmDeleteModal
          title="Retirer le compteur général ?"
          consequences={['Ses relevés sont supprimés avec lui.', 'La comparaison avec vos appareils disparaît.']}
          pending={remove.isPending}
          error={remove.error}
          onConfirm={() => remove.mutate(removing)}
          onCancel={() => setRemoving(null)}
        />
      )}
    </section>
  )
}
