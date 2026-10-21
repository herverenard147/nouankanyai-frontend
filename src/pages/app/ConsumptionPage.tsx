import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { rawConsumption } from '@/api/rawBackend'
import { TimeChart } from '@/components/charts/TimeChart'
import { ConsumptionNewView } from '@/components/consumption/ConsumptionNewView'
import { MainMeterCard } from '@/components/consumption/MainMeterCard'
import { HouseholdPeakCard } from '@/components/consumption/HouseholdPeakCard'
import { PowerPeakSection } from '@/components/consumption/PowerPeakSection'
import { AdminPlatformConsumption } from '@/components/consumption/AdminPlatformConsumption'
import { MetricState } from '@/components/state/MetricState'
import { formatNumberFr } from '@/lib/formatters'
import { levelAtLeast } from '@/lib/levelGating'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendConsumption, ConsumptionGranularity } from '@/types/backend'

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

const todayIso = () => new Date().toISOString().slice(0, 10)
const yesterday = () => new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
/** « 2026-10-19 » → « lundi 19 octobre 2026 » (heure d'Abidjan = temps universel). */
function dayLong(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** « 2026-07 » → « juil. 2026 ». */
function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function ConsumptionPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  const [granularity, setGranularity] = useState<ConsumptionGranularity>('day')
  // Détail d'un jour précis (demande du propriétaire, 2026-10-20) : ce jour-là heure par heure.
  const [day, setDay] = useState<string | null>(null)
  const [machine, setMachine] = useState('')
  const effective: ConsumptionGranularity = day ? 'hour' : granularity
  const query = useQuery({
    queryKey: ['consumption-real', effective, machine, day],
    queryFn: () => rawConsumption(effective, machine || undefined, day ?? undefined),
    enabled: profile !== undefined && profile !== 'admin',
  })
  // Liste des appareils : la vue « tous les appareils » de la même période (déjà en cache quand on en choisit un).
  const all = useQuery({
    queryKey: ['consumption-real', effective, '', day],
    queryFn: () => rawConsumption(effective, undefined, day ?? undefined),
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

  const window = day ? `le ${dayLong(day)}, heure par heure` : (GRANULARITIES.find((g) => g.value === granularity)?.window ?? '')
  return (
    <div className="flex flex-col gap-7">
      <p className="text-sm text-text-secondary">
        Ce que vos appareils ont réellement consommé, calculé à partir de leurs relevés, et ce que cela coûte. Une période sans relevé reste vide :
        rien n’est inventé.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <fieldset className="flex flex-wrap border border-border">
          <legend className="sr-only">Période</legend>
          {GRANULARITIES.map((g) => (
            <button
              key={g.value}
              type="button"
              aria-pressed={!day && granularity === g.value}
              onClick={() => {
                setDay(null)
                setGranularity(g.value)
              }}
              className={`focus-ring min-h-10 flex-auto px-4 text-sm font-semibold ${!day && granularity === g.value ? 'bg-dark-bg text-white' : 'bg-card text-text-primary hover:bg-bg-elevated'}`}
            >
              {g.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={day !== null}
            onClick={() => setDay(day ?? yesterday())}
            className={`focus-ring min-h-10 flex-auto px-4 text-sm font-semibold ${day ? 'bg-dark-bg text-white' : 'bg-card text-text-primary hover:bg-bg-elevated'}`}
          >
            Jour précis
          </button>
        </fieldset>
        {day && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
            Date
            <input
              type="date"
              value={day}
              max={todayIso()}
              onChange={(e) => e.target.value && setDay(e.target.value)}
              className="focus-ring min-h-10 rounded-control border border-border bg-card px-3 text-sm"
            />
          </label>
        )}
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

      <MetricState status={query.status}>
        {query.data && (
          <ConsumptionNewView data={query.data} window={window} granularity={effective} technical={levelAtLeast(level, 'technique')} single={Boolean(machine)}>
            <TariffExplained data={query.data} />
            <BillsChart data={query.data} />
          </ConsumptionNewView>
        )}
      </MetricState>
      {!machine && (profile === 'industrie' || profile === 'pme') && <PowerPeakSection fixedDay={day ?? undefined} />}
      {!machine && profile === 'menage' && <HouseholdPeakCard day={day ?? undefined} />}
      {!machine && !day && profile !== 'technicien' && <MainMeterCard granularity={granularity} window={window} profile={profile} />}
    </div>
  )
}

/** kWh lus sur les factures CIE, mois par mois, avec les axes du site. */
function BillsChart({ data }: { data: BackendConsumption }) {
  if (data.factures_kwh_par_mois.length === 0) return null
  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">D’après vos factures CIE</h2>
      <p className="text-sm text-text-secondary">kWh par mois, lus sur vos factures (une facture de deux mois est partagée entre les deux).</p>
      <TimeChart
        labels={data.factures_kwh_par_mois.map((f) => monthLabel(f.mois))}
        series={[{ name: 'Lu sur les factures', values: data.factures_kwh_par_mois.map((f) => f.kwh), color: 'var(--color-accent)', kind: 'area' }]}
        unit="kWh"
        yAxisLabel="Énergie (kWh par mois)"
        xAxisLabel="Mois"
        height={220}
      />
    </section>
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
