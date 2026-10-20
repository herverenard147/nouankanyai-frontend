import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { rawPowerPeak, rawSetBreaker } from '@/api/rawBackend'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { MutationError } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { formatNumberFr } from '@/lib/formatters'
import type { BackendSitePeak } from '@/types/backend'

const SECTION = 'flex flex-col gap-4 border-t-2 border-text-primary pt-4'
/** Au-delà de cette part du calibre, le disjoncteur peut sauter au prochain gros appareil allumé. */
const NEAR_LIMIT = 0.8

/** « 2026-10-19T19:40:00 » → « 19 h 40 » (heure d'Abidjan = temps universel). */
function clock(iso: string): string {
  const [h, m] = iso.slice(11, 16).split(':')
  return `${Number(h)} h ${m}`
}

/** Le pic le plus court que les relevés permettent : c'est le plus proche de ce que voit le disjoncteur. */
export function shortestPeak(site: BackendSitePeak) {
  for (const w of ['10', '15', '60']) {
    const p = site.pics[w]
    if (p) return { ...p, minutes: Number(w) }
  }
  return null
}

/**
 * Version simple du pic de puissance pour le ménage (demande du propriétaire, 2026-10-20) : sa plus forte
 * consommation de la journée, en kW et en ampères, face au calibre de son disjoncteur (« Réglage disjoncteur »
 * sur la facture CIE). Pas de tableau ni de trois durées : un chiffre, une part du calibre, un conseil.
 */
export function HouseholdPeakCard({ day }: { day?: string }) {
  const jour = day ?? new Date().toISOString().slice(0, 10)
  const query = useQuery({ queryKey: ['power-peak', jour], queryFn: () => rawPowerPeak(jour) })
  const site = query.data?.sites[0]
  const peakNow = site ? shortestPeak(site) : null

  return (
    <section className={SECTION} aria-labelledby="pic-menage">
      <h2 id="pic-menage" className="text-section-title font-semibold text-text-primary">
        Ma plus forte consommation {day ? 'ce jour-là' : 'aujourd’hui'}
      </h2>
      <MetricState status={query.status} isEmpty={!site}>
        {site && (
          <>
            {peakNow ? (
              <PeakFigures site={site} peak={peakNow} />
            ) : (
              <p className="text-sm text-text-secondary">Pas encore assez de relevés {day ? 'ce jour-là' : 'aujourd’hui'} pour la calculer.</p>
            )}
            <BreakerForm calibre={site.souscription?.amperes ?? null} />
          </>
        )}
      </MetricState>
    </section>
  )
}

function PeakFigures({ site, peak }: { site: BackendSitePeak; peak: NonNullable<ReturnType<typeof shortestPeak>> }) {
  const calibre = site.souscription?.amperes ?? null
  const amps = peak.amperes ?? null
  const share = calibre && amps !== null ? amps / calibre : null
  const pct = share !== null ? Math.round(share * 100) : null

  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-heading text-[2rem] font-bold leading-none text-text-primary">
          {formatNumberFr(peak.kw, 1)}&nbsp;kW
        </span>
        {amps !== null && <span className="text-lg font-semibold text-text-primary">soit environ {formatNumberFr(amps, 0)}&nbsp;A</span>}
        <span className="text-sm text-text-secondary">vers {clock(peak.debut)}</span>
      </p>
      <p className="text-xs text-text-secondary">
        Moyenne sur {peak.minutes === 60 ? '1 h' : `${peak.minutes} min`}, de tous vos appareils suivis.{' '}
        {amps !== null && (
          <>
            Ampères : <ProvenanceBadge value="estime" className="lowercase" />
          </>
        )}
      </p>
      {pct !== null && calibre !== null && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-text-primary">
            Votre disjoncteur : <span className="font-semibold">{formatNumberFr(calibre, 0)}&nbsp;A</span>. Vous en avez utilisé{' '}
            <span className="font-semibold">{pct}&nbsp;%</span>.
          </p>
          <div className="h-2 w-full max-w-md bg-bg-elevated" role="img" aria-label={`${pct} % du calibre du disjoncteur`}>
            <div className={`h-2 ${share! >= NEAR_LIMIT ? 'bg-alert' : 'bg-text-primary'}`} style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          {share! >= 1 ? (
            <p className="text-sm font-semibold text-alert">
              Au-dessus du calibre : le disjoncteur a pu sauter. Évitez d’allumer en même temps vos plus gros appareils.
            </p>
          ) : share! >= NEAR_LIMIT ? (
            <p className="text-sm font-semibold text-alert">
              Proche de la limite : un gros appareil de plus en même temps, et le disjoncteur peut sauter.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

function BreakerForm({ calibre }: { calibre: number | null }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(calibre !== null ? String(calibre) : '')
  const save = useMutation({
    mutationFn: (amperes: number | null) => rawSetBreaker(amperes),
    onSuccess: () => {
      setEditing(false)
      void queryClient.invalidateQueries({ queryKey: ['power-peak'] })
      void queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })

  if (calibre !== null && !editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="focus-ring self-start text-sm font-semibold text-accent-cta hover:underline">
        Modifier le calibre du disjoncteur
      </button>
    )
  }

  const amperes = Number(value.replace(',', '.'))
  const valid = value.trim() !== '' && Number.isFinite(amperes) && amperes > 0 && amperes <= 1000

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) save.mutate(amperes)
      }}
    >
      {calibre === null && (
        <p className="text-sm text-text-secondary">
          Indiquez le calibre de votre disjoncteur pour savoir si vous approchez de sa limite. Il est écrit sur votre facture CIE, case
          « Réglage disjoncteur » (par exemple 5, 10, 15 ou 30&nbsp;A).
        </p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <TextField label="Calibre (ampères)" required inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <Button type="submit" loading={save.isPending} disabled={!valid}>
          Enregistrer
        </Button>
        {editing && (
          <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={save.isPending}>
            Annuler
          </Button>
        )}
      </div>
      <MutationError error={save.error} />
    </form>
  )
}
