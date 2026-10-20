import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { rawAddRecharge, rawDeleteRecharge, rawPrepaid, rawSetPrepaidReading, rawUploadRechargePhoto } from '@/api/rawBackend'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, Modal, MutationError } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { formatFcfa, formatNumberFr } from '@/lib/formatters'
import type { BackendPrepaid, BackendRecharge } from '@/types/backend'

const SECTION = 'flex scroll-mt-24 flex-col gap-4 border-t-2 border-text-primary pt-4'
const KEYS = ['prepaid', 'notifications', 'consumption']

/** « 2026-10-22T14:00:00 » → « 22/10/2026 ». */
function day(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

const WEEKDAY = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

const RATE_SOURCE: Record<NonNullable<BackendPrepaid['credit']['source_rythme']>, string> = {
  compteur_general: 'mesuré au compteur général',
  recharges: 'd’après vos recharges successives',
  appareils: 'd’après vos appareils suivis seulement : les autres ne sont pas comptés, le crédit peut baisser plus vite',
}

/**
 * Compteurs à carte du compte (décision du propriétaire, 2026-10-20) : un bloc par logement à carte, avec le crédit
 * restant estimé, le prix réellement payé par kWh, les recharges (à la main ou par photo du reçu) et le chiffre lu sur
 * le compteur pour corriger l'estimation. Rien si le compte n'a pas de compteur à carte.
 */
export function PrepaidSection() {
  const query = useQuery({ queryKey: ['prepaid'], queryFn: rawPrepaid })
  if (!query.data?.length) return null
  return (
    <>
      {query.data.map((p) => (
        <PrepaidMeter key={p.site_id} meter={p} />
      ))}
    </>
  )
}

function useRefresh() {
  const queryClient = useQueryClient()
  return () => {
    for (const key of KEYS) void queryClient.invalidateQueries({ queryKey: [key] })
  }
}

function PrepaidMeter({ meter }: { meter: BackendPrepaid }) {
  const refresh = useRefresh()
  const [adding, setAdding] = useState(false)
  const [reading, setReading] = useState(false)
  const [removing, setRemoving] = useState<BackendRecharge | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const photo = useMutation({ mutationFn: (file: File) => rawUploadRechargePhoto(meter.site_id, file), onSuccess: refresh })
  const remove = useMutation({ mutationFn: (id: string) => rawDeleteRecharge(id), onSuccess: () => { setRemoving(null); refresh() } })
  const c = meter.credit
  const known = meter.recharges.filter((r) => r.kwh).length

  return (
    <section id={`prepaye-${meter.site_id}`} className={SECTION} aria-labelledby={`prepaye-titre-${meter.site_id}`}>
      <h2 id={`prepaye-titre-${meter.site_id}`} className="text-section-title font-semibold text-text-primary">
        Compteur à carte : {meter.nom}
      </h2>

      {c.kwh !== null ? (
        <div className="flex flex-col gap-1.5">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`font-heading text-[2rem] font-bold leading-none ${meter.bientot_epuise ? 'text-alert' : 'text-text-primary'}`}>
              ≈ {formatNumberFr(c.kwh, 0)}&nbsp;kWh
            </span>
            <span className="text-sm text-text-secondary">restants</span>
            <ProvenanceBadge value={c.source_rythme === 'compteur_general' ? 'mesure' : 'estime'} className="lowercase" />
          </p>
          {c.jours !== null && c.epuise_le && (
            <p className={`text-sm ${meter.bientot_epuise ? 'font-semibold text-alert' : 'text-text-primary'}`}>
              {c.jours < 1 ? 'Moins d’un jour' : `Environ ${formatNumberFr(c.jours, 0)} jour${c.jours >= 2 ? 's' : ''}`} de consommation : rechargez avant
              le {WEEKDAY[new Date(c.epuise_le).getUTCDay()]} {day(c.epuise_le).slice(0, 5)}.
            </p>
          )}
          <p className="text-xs text-text-secondary">
            {c.rythme_kwh_jour !== null && c.source_rythme && (
              <>
                Rythme : {formatNumberFr(c.rythme_kwh_jour, 1)}&nbsp;kWh par jour, {RATE_SOURCE[c.source_rythme]}.{' '}
              </>
            )}
            {c.reference === 'releve' && c.reference_le && <>Point de départ : le chiffre lu sur votre compteur le {day(c.reference_le)}.</>}
            {c.reference === 'recharge' && c.reference_le && (
              <>Point de départ : votre recharge du {day(c.reference_le)}, compteur supposé presque vide à ce moment. Corrigez avec le chiffre affiché.</>
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">Ajoutez une recharge avec ses kWh pour estimer le crédit restant.</p>
      )}

      {meter.prix_kwh_reel !== null && (
        <p className="text-sm text-text-primary">
          Prix réellement payé : <span className="font-semibold">{formatNumberFr(meter.prix_kwh_reel, 0)}&nbsp;FCFA le kWh</span>, redevances et taxes
          comprises (d’après {known > 1 ? `vos ${Math.min(known, 5)} dernières recharges` : 'votre recharge'}). Vos coûts sont calculés avec ce prix.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => setAdding(true)}>
          Ajouter une recharge
        </Button>
        <Button type="button" variant="outline" loading={photo.isPending} onClick={() => fileRef.current?.click()}>
          Photo du reçu
        </Button>
        <Button type="button" variant="outline" onClick={() => setReading(true)}>
          J’ai lu mon compteur
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label={`Photo du reçu de recharge pour ${meter.nom}`}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) photo.mutate(file)
            e.target.value = ''
          }}
        />
      </div>
      <MutationError error={photo.error} />
      {photo.isSuccess && <p className="text-sm text-confirm">Recharge lue sur le reçu et ajoutée. Vérifiez-la dans la liste.</p>}

      {meter.recharges.length > 0 && (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Payé</th>
                <th className="py-2 pr-3 font-medium">kWh obtenus</th>
                <th className="py-2 pr-3 font-medium">Prix du kWh</th>
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {meter.recharges.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="py-2 pr-3 tabular-nums">{day(r.date)}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatFcfa(r.montant_fcfa)}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.kwh !== null ? `${formatNumberFr(r.kwh, 1)} kWh` : 'non indiqué'}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.prix_kwh !== null ? `${formatNumberFr(r.prix_kwh, 0)} FCFA` : '-'}</td>
                  <td className="py-2 pr-3">{r.source === 'photo' ? 'Lue sur le reçu' : 'Saisie à la main'}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="focus-ring text-sm font-semibold text-alert hover:underline"
                      aria-label={`Supprimer la recharge du ${day(r.date)}`}
                      onClick={() => {
                        remove.reset()
                        setRemoving(r)
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && <RechargeModal siteId={meter.site_id} onClose={() => setAdding(false)} />}
      {reading && <ReadingModal meter={meter} onClose={() => setReading(false)} />}
      {removing && (
        <ConfirmDeleteModal
          title={`Supprimer la recharge du ${day(removing.date)} ?`}
          consequences={[`${formatFcfa(removing.montant_fcfa)}${removing.kwh ? `, ${formatNumberFr(removing.kwh, 1)} kWh` : ''} : le crédit restant et le prix réel seront recalculés.`]}
          confirmLabel="Supprimer la recharge"
          pending={remove.isPending}
          error={remove.error}
          onCancel={() => setRemoving(null)}
          onConfirm={() => remove.mutate(removing.id)}
        />
      )}
    </section>
  )
}

function toNumber(text: string): number | null {
  const n = Number(text.replace(/\s/g, '').replace(',', '.'))
  return text.trim() !== '' && Number.isFinite(n) ? n : null
}

function RechargeModal({ siteId, onClose }: { siteId: string; onClose: () => void }) {
  const refresh = useRefresh()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [montant, setMontant] = useState('')
  const [kwh, setKwh] = useState('')
  const add = useMutation({ mutationFn: rawAddRecharge, onSuccess: () => { refresh(); onClose() } })
  const m = toNumber(montant)
  const k = toNumber(kwh)
  const valid = Boolean(date) && date <= today && m !== null && m > 0 && (kwh.trim() === '' || (k !== null && k > 0))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (valid) add.mutate({ site_id: siteId, date, montant_fcfa: m!, kwh: k })
  }

  return (
    <Modal
      title="Ajouter une recharge"
      description="Le montant payé et les kWh obtenus figurent sur le reçu ou le SMS de recharge."
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="recharge-form" loading={add.isPending} disabled={!valid || add.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="recharge-form" onSubmit={submit} className="flex flex-col gap-3">
        <TextField label="Date de la recharge" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} required />
        <TextField label="Montant payé (FCFA)" inputMode="numeric" value={montant} onChange={(e) => setMontant(e.target.value)} required />
        <TextField
          label="kWh obtenus (conseillé)"
          inputMode="decimal"
          placeholder="Sans eux, ni crédit ni prix réel"
          value={kwh}
          onChange={(e) => setKwh(e.target.value)}
        />
        <MutationError error={add.error} />
      </form>
    </Modal>
  )
}

function ReadingModal({ meter, onClose }: { meter: BackendPrepaid; onClose: () => void }) {
  const refresh = useRefresh()
  const [value, setValue] = useState('')
  const save = useMutation({ mutationFn: (kwh: number) => rawSetPrepaidReading(meter.site_id, kwh), onSuccess: () => { refresh(); onClose() } })
  const n = toNumber(value)
  const valid = n !== null && n >= 0

  return (
    <Modal
      title={`Crédit affiché sur le compteur : ${meter.nom}`}
      description="Le chiffre affiché sur votre compteur remplace l’estimation et sert de nouveau point de départ."
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="releve-form" loading={save.isPending} disabled={!valid || save.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form
        id="releve-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) save.mutate(n!)
        }}
        className="flex flex-col gap-3"
      >
        <TextField label="Crédit affiché (kWh)" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} required />
        <MutationError error={save.error} />
      </form>
    </Modal>
  )
}
