import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { rawAdminPricing, rawAdminResetPricing, rawAdminSavePricing } from '@/api/rawBackend'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError } from '@/components/ui/Modal'
import { formatFcfa, formatUtcDateTime } from '@/lib/formatters'
import type { HardwareKind, PricingConfig, PricingKindConfig, PricingLineInput } from '@/types/backend'

const SECTION = 'flex flex-col gap-4 border-t-2 border-text-primary pt-4'
const INPUT = 'focus-ring min-h-10 rounded-control border border-border bg-card px-3 text-sm text-text-primary'
const ROUND_TO = 500
const KINDS: HardwareKind[] = ['vocal', 'capteur', 'passerelle']

/** Même calcul que le serveur (backend/app/boitier/pricing.py) : la page montre le prix avant d'enregistrer. */
export function priceOf(config: PricingConfig, kind: HardwareKind) {
  const spec = config.kinds[kind]
  const round = (v: number) => Math.round(v / ROUND_TO) * ROUND_TO
  const hardware = spec.composants.reduce((s, c) => s + (Number(c.fcfa) || 0), 0)
  const importFee = round(hardware * config.import_rate)
  const cost = hardware + importFee + spec.frais.reduce((s, f) => s + (Number(f.fcfa) || 0), 0)
  const total = round(cost * (1 + config.margin_rate))
  return { hardware, importFee, cost, margin: total - cost, total }
}

function linesValid(lines: PricingLineInput[], min: number) {
  return lines.length >= min && lines.every((l) => l.libelle.trim() !== '' && Number.isInteger(l.fcfa) && l.fcfa >= 0 && l.fcfa <= 10_000_000)
}

export function configValid(config: PricingConfig) {
  const rateOk = (r: number) => Number.isFinite(r) && r >= 0 && r <= 1
  return (
    rateOk(config.import_rate) &&
    rateOk(config.margin_rate) &&
    KINDS.every((k) => {
      const spec = config.kinds[k]
      return spec.nom.trim() !== '' && spec.description.trim() !== '' && linesValid(spec.composants, 1) && linesValid(spec.frais, 0)
    })
  )
}

/**
 * Prix du matériel (demande du propriétaire, 2026-10-21) : l'administrateur change composants, frais, taux de douane
 * et de marge sans toucher au code. Le prix de chaque matériel se recalcule à l'écran ; l'enregistrement demande une
 * confirmation qui montre l'ancien et le nouveau prix. Les demandes déjà faites gardent leur prix.
 */
export function AdminPricingPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin-pricing'], queryFn: rawAdminPricing })
  const [draft, setDraft] = useState<PricingConfig | null>(null)
  const [confirm, setConfirm] = useState<'save' | 'reset' | null>(null)
  const refresh = (view: Awaited<ReturnType<typeof rawAdminPricing>>) => {
    queryClient.setQueryData(['admin-pricing'], view)
    void queryClient.invalidateQueries({ queryKey: ['boitier-price'] })
    setDraft(structuredClone(view.config))
    setConfirm(null)
  }
  const save = useMutation({ mutationFn: rawAdminSavePricing, onSuccess: refresh })
  const reset = useMutation({ mutationFn: rawAdminResetPricing, onSuccess: refresh })

  useEffect(() => {
    if (query.data && draft === null) setDraft(structuredClone(query.data.config))
  }, [query.data, draft])

  const current = query.data?.config
  const dirty = Boolean(draft && current && JSON.stringify(draft) !== JSON.stringify(current))
  const valid = draft ? configValid(draft) : false
  const update = (fn: (c: PricingConfig) => void) =>
    setDraft((d) => {
      if (!d) return d
      const next = structuredClone(d)
      fn(next)
      return next
    })

  return (
    <div className="flex flex-col gap-7">
      <p className="text-sm text-text-secondary">
        Le prix de chaque matériel est la somme de ses composants, du transport et de la douane, des frais (montage, livraison, pose) et de la marge,
        arrondie à 500 FCFA. Le client le voit ligne par ligne avant de commander. Les demandes déjà faites gardent leur prix.
      </p>
      <MetricState status={query.status}>
        {draft && query.data && (
          <>
            <section className={SECTION} aria-label="Taux">
              <h2 className="text-section-title font-semibold text-text-primary">Taux appliqués à tout le matériel</h2>
              <div className="flex flex-wrap gap-4">
                <RateField label="Transport et douane (% des composants)" value={draft.import_rate} onChange={(v) => update((c) => (c.import_rate = v))} />
                <RateField label="Marge Nouankany (%)" value={draft.margin_rate} onChange={(v) => update((c) => (c.margin_rate = v))} />
              </div>
              <p className="text-xs text-text-secondary">
                {query.data.modifie
                  ? `Prix modifiés le ${formatUtcDateTime(query.data.modifie_le)}${query.data.modifie_par ? ` par ${query.data.modifie_par}` : ''}.`
                  : 'Prix par défaut (aucune modification enregistrée).'}
              </p>
            </section>

            {KINDS.map((kind) => (
              <KindEditor
                key={kind}
                kind={kind}
                spec={draft.kinds[kind]}
                price={priceOf(draft, kind)}
                saved={priceOf(current!, kind).total}
                onChange={(fn) => update((c) => fn(c.kinds[kind]))}
              />
            ))}

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button type="button" disabled={!dirty || !valid} onClick={() => setConfirm('save')}>
                Enregistrer les prix
              </Button>
              <Button type="button" variant="outline" disabled={!dirty} onClick={() => setDraft(structuredClone(current!))}>
                Annuler les modifications
              </Button>
              <Button type="button" variant="outline" disabled={!query.data.modifie} onClick={() => setConfirm('reset')}>
                Revenir aux prix par défaut
              </Button>
              {dirty && !valid && <p className="text-sm text-alert">Chaque ligne a besoin d’un libellé et d’un montant entier ; chaque matériel, d’au moins un composant.</p>}
            </div>
          </>
        )}
      </MetricState>

      {confirm && draft && current && query.data && (
        <Modal
          title={confirm === 'save' ? 'Enregistrer les nouveaux prix ?' : 'Revenir aux prix par défaut ?'}
          description="Les nouvelles demandes prendront ces prix ; les demandes déjà faites gardent le leur. Le changement est inscrit dans l’Audit."
          onClose={() => setConfirm(null)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
                Annuler
              </Button>
              <Button
                type="button"
                loading={save.isPending || reset.isPending}
                onClick={() => (confirm === 'save' ? save.mutate(draft) : reset.mutate())}
              >
                {confirm === 'save' ? 'Enregistrer' : 'Revenir aux prix par défaut'}
              </Button>
            </>
          }
        >
          <ul className="flex flex-col gap-1 text-sm">
            {KINDS.map((kind) => {
              const before = priceOf(current, kind).total
              const after = priceOf(confirm === 'save' ? draft : query.data!.defaults, kind).total
              return (
                <li key={kind} className="flex justify-between gap-3">
                  <span>{draft.kinds[kind].nom}</span>
                  <span className={`tabular-nums ${before !== after ? 'font-semibold' : 'text-text-secondary'}`}>
                    {formatFcfa(before)} → {formatFcfa(after)}
                  </span>
                </li>
              )
            })}
          </ul>
          <MutationError error={save.error ?? reset.error} />
        </Modal>
      )}
    </div>
  )
}

function RateField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(Math.round(value * 1000) / 10).replace('.', ','))
  useEffect(() => setText(String(Math.round(value * 1000) / 10).replace('.', ',')), [value])
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
      {label}
      <input
        className={`${INPUT} w-32`}
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const n = Number(e.target.value.replace(',', '.'))
          if (Number.isFinite(n) && n >= 0 && n <= 100) onChange(Math.round(n * 10) / 1000)
        }}
      />
    </label>
  )
}

interface KindEditorProps {
  kind: HardwareKind
  spec: PricingKindConfig
  price: ReturnType<typeof priceOf>
  saved: number
  onChange: (fn: (spec: PricingKindConfig) => void) => void
}

function KindEditor({ kind, spec, price, saved, onChange }: KindEditorProps) {
  return (
    <section className={SECTION} aria-label={spec.nom || kind}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-section-title font-semibold text-text-primary">{spec.nom || kind}</h2>
        <p className="text-sm">
          Prix : <span className="font-heading text-lg font-bold tabular-nums">{formatFcfa(price.total)}</span>
          {price.total !== saved && <span className="ml-2 text-xs text-text-secondary">(enregistré : {formatFcfa(saved)})</span>}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Nom affiché
          <input className={INPUT} maxLength={60} value={spec.nom} onChange={(e) => onChange((s) => (s.nom = e.target.value))} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Description
          <input className={INPUT} maxLength={300} value={spec.description} onChange={(e) => onChange((s) => (s.description = e.target.value))} />
        </label>
      </div>
      <LinesEditor title="Composants" lines={spec.composants} onChange={(fn) => onChange((s) => fn(s.composants))} />
      <p className="text-sm text-text-secondary">
        Transport et douane : <span className="tabular-nums">{formatFcfa(price.importFee)}</span> (calculé).
      </p>
      <LinesEditor title="Frais (montage, livraison, pose…)" lines={spec.frais} onChange={(fn) => onChange((s) => fn(s.frais))} />
      <p className="text-sm text-text-secondary">
        Marge : <span className="tabular-nums">{formatFcfa(price.margin)}</span> (calculée, arrondi compris).
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
        Non compris (une ligne par élément, facultatif)
        <textarea
          className={`${INPUT} py-2`}
          rows={2}
          value={spec.non_compris.join('\n')}
          onChange={(e) => onChange((s) => (s.non_compris = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 5)))}
        />
      </label>
    </section>
  )
}

function LinesEditor({ title, lines, onChange }: { title: string; lines: PricingLineInput[]; onChange: (fn: (lines: PricingLineInput[]) => void) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold text-text-primary">{title}</legend>
      {lines.map((line, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input
            aria-label={`${title} : libellé ${i + 1}`}
            className={`${INPUT} min-w-0 flex-1`}
            maxLength={80}
            value={line.libelle}
            onChange={(e) => onChange((ls) => (ls[i].libelle = e.target.value))}
          />
          <input
            aria-label={`${title} : montant ${i + 1} (FCFA)`}
            className={`${INPUT} w-32 text-right tabular-nums`}
            inputMode="numeric"
            value={String(line.fcfa)}
            onChange={(e) => onChange((ls) => (ls[i].fcfa = Number(e.target.value.replace(/\s/g, '')) || 0))}
          />
          <button
            type="button"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-control border border-border text-alert"
            aria-label={`Retirer « ${line.libelle || 'cette ligne'} »`}
            onClick={() => onChange((ls) => void ls.splice(i, 1))}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="focus-ring inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent-cta hover:underline"
        onClick={() => onChange((ls) => void ls.push({ libelle: '', fcfa: 0 }))}
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter une ligne
      </button>
    </fieldset>
  )
}
