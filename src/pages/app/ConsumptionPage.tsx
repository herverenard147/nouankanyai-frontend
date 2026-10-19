import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { rawConsumption } from '@/api/rawBackend'
import { LineChart, type LineSeries } from '@/components/charts/LineChart'
import { SERIES_COLORS } from '@/lib/chartColors'
import { AdminPlatformConsumption } from '@/components/consumption/AdminPlatformConsumption'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { formatFcfa, formatNumberFr } from '@/lib/formatters'
import { levelAtLeast } from '@/lib/levelGating'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendConsumption, BackendConsumptionProvenance, ConsumptionGranularity } from '@/types/backend'
import type { Provenance } from '@/types/domain'

/**
 * Consommation réelle (correction 7 du test du site, 2026-10-18) : kWh et coût par heure, jour, semaine ou mois,
 * pour tout le compte ou un appareil, en courbes. Avant : les 20 derniers relevés de puissance de la machine la
 * plus puissante, et une barre « heures creuses / pointe » affichée aussi aux ménages (faux en basse tension).
 */
const GRANULARITIES: { value: ConsumptionGranularity; label: string; window: string }[] = [
  { value: 'hour', label: 'Heure', window: '48 dernières heures' },
  { value: 'day', label: 'Jour', window: '30 derniers jours' },
  { value: 'week', label: 'Semaine', window: '12 dernières semaines' },
  { value: 'month', label: 'Mois', window: '12 derniers mois' },
]
const SECTION = 'flex flex-col gap-4 border-t-2 border-text-primary pt-4'
const PROVENANCE: Record<BackendConsumptionProvenance, Provenance> = {
  mesure: 'mesure',
  declare: 'declare',
  demonstration: 'demonstration',
  simulation: 'synthetique',
}
const MAX_CURVES = 5

export function ConsumptionPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  const [granularity, setGranularity] = useState<ConsumptionGranularity>('day')
  const [machine, setMachine] = useState('')
  const query = useQuery({
    queryKey: ['consumption-real', granularity, machine],
    queryFn: () => rawConsumption(granularity, machine || undefined),
    enabled: profile !== undefined && profile !== 'admin',
  })
  // Liste des appareils : la vue « tous les appareils » de la même période (déjà en cache quand on en choisit un).
  const all = useQuery({
    queryKey: ['consumption-real', granularity, ''],
    queryFn: () => rawConsumption(granularity),
    enabled: profile !== undefined && profile !== 'admin',
  })
  const deviceList = all.data?.machines ?? []

  if (!profile) return null
  if (profile === 'admin') {
    return (
      <div className="flex flex-col gap-7">
        <p className="text-sm text-text-secondary">Répartition de la puissance active, pour tous les comptes de la plateforme.</p>
        <AdminPlatformConsumption />
      </div>
    )
  }

  const window = GRANULARITIES.find((g) => g.value === granularity)?.window ?? ''
  return (
    <div className="flex flex-col gap-7">
      <p className="text-sm text-text-secondary">
        Ce que vos appareils ont réellement consommé, calculé à partir de leurs relevés, et ce que cela coûte. Une période sans relevé reste vide :
        rien n’est inventé.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <fieldset className="flex border border-border">
          <legend className="sr-only">Période</legend>
          {GRANULARITIES.map((g) => (
            <button
              key={g.value}
              type="button"
              aria-pressed={granularity === g.value}
              onClick={() => setGranularity(g.value)}
              className={`focus-ring min-h-10 px-4 text-sm font-semibold ${granularity === g.value ? 'bg-dark-bg text-white' : 'bg-card text-text-primary hover:bg-bg-elevated'}`}
            >
              {g.label}
            </button>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Appareil
          <select
            value={machine}
            onChange={(e) => setMachine(e.target.value)}
            className="focus-ring min-h-10 rounded-control border border-border bg-card px-3 text-sm"
          >
            <option value="">Tous les appareils</option>
            {deviceList.map((m) => (
              <option key={m.code} value={m.code}>
                {m.nom}
              </option>
            ))}
          </select>
        </label>
      </div>

      <MetricState status={query.status}>{query.data && <ConsumptionView data={query.data} window={window} technical={levelAtLeast(level, 'technique')} single={Boolean(machine)} />}</MetricState>
    </div>
  )
}

function ConsumptionView({ data, window, technical, single }: { data: BackendConsumption; window: string; technical: boolean; single: boolean }) {
  const hasReadings = data.total.points.some((p) => p !== null)
  const series: LineSeries[] = [{ name: single ? (data.machines[0]?.nom ?? 'Appareil') : 'Tout le compte', values: data.total.points }]
  if (!single && data.machines.length > 1) {
    ;[...data.machines]
      .sort((a, b) => b.kwh - a.kwh)
      .slice(0, MAX_CURVES)
      .forEach((m, i) => series.push({ name: m.nom, values: m.points, color: SERIES_COLORS[(i + 1) % SERIES_COLORS.length] }))
  }
  const every = Math.max(1, Math.ceil(data.labels.length / 12))

  return (
    <div className="flex flex-col gap-7">
      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Consommation, {window}</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-text-secondary">Énergie consommée</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-primary">{formatNumberFr(data.total.kwh, data.total.kwh < 100 ? 1 : 0)} kWh</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Coût estimé</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-primary">{formatFcfa(data.total.cout_fcfa)}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Temps couvert par des relevés</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-primary">{formatNumberFr(data.total.couverture_pct, 0)} %</dd>
          </div>
        </dl>
        <p className="text-xs text-text-secondary">{data.prix_note}</p>
        {hasReadings ? (
          <LineChart labels={data.labels} series={series} unit="kWh" xLabelEvery={every} />
        ) : (
          <p className="text-sm text-text-secondary">
            Aucun relevé sur cette période. Reliez un boîtier ou <Link to="/app/parametres" className="font-semibold text-accent-cta hover:underline">importez des relevés</Link> pour voir la consommation réelle.
          </p>
        )}
      </section>

      {data.machines.length > 0 && (
        <section className={SECTION}>
          <h2 className="text-section-title font-semibold text-text-primary">Par appareil</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-secondary">
                  <th className="py-2 font-medium">Appareil</th>
                  <th className="py-2 text-right font-medium">kWh</th>
                  <th className="py-2 text-right font-medium">Part</th>
                  <th className="py-2 text-right font-medium">Coût estimé</th>
                  {technical && <th className="py-2 text-right font-medium">Temps couvert</th>}
                  <th className="py-2 text-right font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.machines.map((m) => (
                  <tr key={m.code} className="border-b border-border">
                    <td className="py-2 text-text-primary">{m.nom}</td>
                    <td className="py-2 text-right tabular-nums">{formatNumberFr(m.kwh, m.kwh < 100 ? 1 : 0)}</td>
                    <td className="py-2 text-right tabular-nums">{m.part_pct === null ? '-' : `${formatNumberFr(m.part_pct, 0)} %`}</td>
                    <td className="py-2 text-right tabular-nums">{formatFcfa(m.cout_fcfa)}</td>
                    {technical && <td className="py-2 text-right tabular-nums">{formatNumberFr(m.couverture_pct, 0)} %</td>}
                    <td className="py-2 text-right">{m.provenance ? <ProvenanceBadge value={PROVENANCE[m.provenance]} /> : <span className="text-xs text-text-secondary">aucun relevé</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <TariffExplained data={data} />

      {data.factures_kwh_par_mois.length > 0 && (
        <section className={SECTION}>
          <h2 className="text-section-title font-semibold text-text-primary">D’après vos factures CIE</h2>
          <p className="text-sm text-text-secondary">kWh par mois, lus sur vos factures (une facture de deux mois est partagée entre les deux).</p>
          <LineChart
            labels={data.factures_kwh_par_mois.map((f) => f.mois)}
            series={[{ name: 'Factures', values: data.factures_kwh_par_mois.map((f) => f.kwh) }]}
            unit="kWh"
            height={180}
          />
        </section>
      )}
    </div>
  )
}

const BAND_LABEL = { creuses: 'Heures creuses', pleines: 'Heures pleines', pointe: 'Heures de pointe' } as const

function TariffExplained({ data }: { data: BackendConsumption }) {
  const t = data.tarif
  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Votre tarif CIE</h2>
      <p className="text-sm text-text-secondary">{t.explication}</p>
      {t.kind === 'plages_horaires' && t.plages && (
        <ul className="grid gap-3 sm:grid-cols-3">
          {t.plages.map((p) => (
            <li key={p.plage} className="flex flex-col gap-1 border border-border p-3">
              <span className="text-sm font-semibold text-text-primary">{BAND_LABEL[p.plage]}</span>
              <span className="text-xs text-text-secondary">{p.heures}, {formatNumberFr(p.prix_fcfa_kwh, 1)} FCFA/kWh</span>
              <span className="text-lg font-semibold tabular-nums text-text-primary">
                {formatNumberFr(p.kwh, 0)} kWh{p.part_pct !== null ? ` (${formatNumberFr(p.part_pct, 0)} %)` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {t.kind === 'tranches_bimestre' && t.tranches && (
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="flex flex-col gap-1 border border-border p-3">
            <span className="text-sm font-semibold text-text-primary">Tranche 1</span>
            <span className="text-xs text-text-secondary">jusqu’à {formatNumberFr(t.tranches[0].jusqu_a_kwh_par_kva ?? 0, 0)} kWh par kVA et par bimestre</span>
            <span className="text-lg font-semibold tabular-nums">{formatNumberFr(t.tranches[0].prix_fcfa_kwh, 1)} FCFA/kWh</span>
          </li>
          <li className="flex flex-col gap-1 border border-border p-3">
            <span className="text-sm font-semibold text-text-primary">Tranche 2</span>
            <span className="text-xs text-text-secondary">au-delà</span>
            <span className="text-lg font-semibold tabular-nums">{formatNumberFr(t.tranches[1]?.prix_fcfa_kwh ?? 0, 1)} FCFA/kWh</span>
          </li>
          <li className="flex flex-col gap-1 border border-border p-3">
            <span className="text-sm font-semibold text-text-primary">Vos 61 derniers jours</span>
            <span className="text-xs text-text-secondary">la durée d’une facture CIE</span>
            <span className="text-lg font-semibold tabular-nums">{formatNumberFr(t.kwh_61_derniers_jours ?? 0, 0)} kWh mesurés</span>
          </li>
        </ul>
      )}
    </section>
  )
}
