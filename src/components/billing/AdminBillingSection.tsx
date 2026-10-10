import { useState } from 'react'
import type { FormEvent } from 'react'

import { StatementList } from '@/components/billing/StatementList'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { MutationError, SelectField } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useUserBilling } from '@/hooks/queries/useAdminUsers'
import { useAdminBillingMutations } from '@/hooks/queries/useBilling'
import type { BackendBilling, BillingTierId } from '@/types/backend'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'
const currentMonth = () => new Date().toISOString().slice(0, 7)

/** Fiche utilisateur admin : contrat ou palier, relevés, calcul d'un mois, « Marquer payé ». */
export function AdminBillingSection({ userId }: { userId: string }) {
  const query = useUserBilling(userId)
  const m = useAdminBillingMutations(userId)
  const [month, setMonth] = useState(currentMonth())
  return (
    <section className={SECTION}>
      <h3 className="text-sm font-medium text-text-secondary">Facturation Nouankany</h3>
      <MetricState status={query.status}>
        {query.data && (
          <>
            {query.data.segment === 'menage' ? <TierEditor billing={query.data} userId={userId} /> : <ContractEditor billing={query.data} userId={userId} />}
            <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
              <TextField label="Mois (AAAA-MM)" value={month} onChange={(e) => setMonth(e.target.value)} pattern="\d{4}-\d{2}" />
              <Button type="button" variant="outline" disabled={m.compute.isPending || !query.data.contract} onClick={() => m.compute.mutate(month)}>
                {m.compute.isPending ? 'Calcul…' : 'Calculer le relevé'}
              </Button>
            </div>
            <MutationError error={m.compute.error} />
            <MetricState status="success" isEmpty={query.data.statements.length === 0}>
              <StatementList
                statements={query.data.statements}
                action={(s) =>
                  s.status === 'a_payer' ? (
                    <Button type="button" variant="outline" className="w-fit" disabled={m.markPaid.isPending} onClick={() => m.markPaid.mutate(s.id)}>
                      Marquer payé
                    </Button>
                  ) : null
                }
              />
            </MetricState>
            <MutationError error={m.markPaid.error} />
          </>
        )}
      </MetricState>
    </section>
  )
}

function ContractEditor({ billing, userId }: { billing: BackendBilling; userId: string }) {
  const { saveContract } = useAdminBillingMutations(userId)
  const c = billing.contract
  const d = billing.defaults
  const [form, setForm] = useState({
    baseline_kwh: c?.baseline_kwh != null ? String(c.baseline_kwh) : '',
    baseline_period: c?.baseline_period ?? '',
    start_month: c?.start_month ?? currentMonth(),
    audit_fee_fcfa: String(c?.audit_fee_fcfa ?? d.audit_fee_fcfa),
    saas_fee_fcfa: String(c?.saas_fee_fcfa ?? d.saas_fee_fcfa),
    savings_share_pct: String(c?.savings_share_pct ?? d.savings_share_pct),
    baseline_adjustment_kwh: c?.baseline_adjustment_kwh != null ? String(c.baseline_adjustment_kwh) : '',
    baseline_adjustment_note: c?.baseline_adjustment_note ?? '',
    puissance_souscrite_kva: c?.puissance_souscrite_kva != null ? String(c.puissance_souscrite_kva) : '',
  })
  const field = (key: keyof typeof form) => ({ value: form[key], onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  function submit(event: FormEvent) {
    event.preventDefault()
    saveContract.mutate({
      kind: 'pme_industrie',
      baseline_kwh: Number(form.baseline_kwh),
      baseline_period: form.baseline_period || undefined,
      start_month: form.start_month,
      audit_fee_fcfa: Number(form.audit_fee_fcfa),
      saas_fee_fcfa: Number(form.saas_fee_fcfa),
      savings_share_pct: Number(form.savings_share_pct),
      baseline_adjustment_kwh: form.baseline_adjustment_kwh ? Number(form.baseline_adjustment_kwh) : null,
      baseline_adjustment_note: form.baseline_adjustment_note || undefined,
      puissance_souscrite_kva: form.puissance_souscrite_kva ? Number(form.puissance_souscrite_kva) : null,
    })
  }
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
      <TextField label="Ligne de base (kWh / mois)" type="number" min="1" required {...field('baseline_kwh')} />
      <TextField label="Période de l’audit" {...field('baseline_period')} />
      <TextField label="Premier mois facturé (AAAA-MM)" required pattern="\d{4}-\d{2}" {...field('start_month')} />
      <TextField label="Frais d’audit (FCFA)" type="number" min="0" {...field('audit_fee_fcfa')} />
      <TextField label="Redevance mensuelle (FCFA)" type="number" min="0" {...field('saas_fee_fcfa')} />
      <TextField label="Part des économies (30 à 50 %)" type="number" min="30" max="50" step="1" {...field('savings_share_pct')} />
      <TextField label="Puissance souscrite (kVA)" type="number" min="0" step="any" {...field('puissance_souscrite_kva')} />
      <TextField label="Ajustement de la ligne de base (kWh, IPMVP)" type="number" step="any" {...field('baseline_adjustment_kwh')} />
      <TextField label="Motif de l’ajustement" {...field('baseline_adjustment_note')} required={Boolean(form.baseline_adjustment_kwh)} />
      <div className="flex flex-col gap-2 sm:col-span-3">
        <Button type="submit" className="w-fit" disabled={saveContract.isPending}>
          {saveContract.isPending ? 'Enregistrement…' : c ? 'Enregistrer le contrat' : 'Créer le contrat'}
        </Button>
        <MutationError error={saveContract.error} />
      </div>
    </form>
  )
}

function TierEditor({ billing, userId }: { billing: BackendBilling; userId: string }) {
  const { saveContract, approveTier } = useAdminBillingMutations(userId)
  const requested = billing.contract?.requested_tier
  return (
    <div className="flex flex-col gap-3">
      {requested && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-text-primary">Demande en attente : {billing.tiers.find((t) => t.id === requested)?.nom}</p>
          <Button type="button" variant="outline" disabled={approveTier.isPending} onClick={() => approveTier.mutate()}>
            Valider
          </Button>
          <MutationError error={approveTier.error} />
        </div>
      )}
      <SelectField
        label="Abonnement"
        value={billing.contract?.tier ?? 'decouverte'}
        onChange={(value) => saveContract.mutate({ kind: 'menage', tier: value as BillingTierId })}
        options={billing.tiers.map((t) => ({ value: t.id, label: t.nom }))}
      />
      <MutationError error={saveContract.error} />
    </div>
  )
}
