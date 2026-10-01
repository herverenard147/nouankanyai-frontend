import { useState } from 'react'

import { PLAN_STATUS_LABEL } from '@/api/actionPlan'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, ConfirmEditModal, Modal, MutationError, SelectField } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useResolutions } from '@/hooks/queries/useAnomalies'
import { useActionPlan, usePlanMutations, usePlanSummary } from '@/hooks/queries/useActionPlan'
import { formatFcfa } from '@/lib/formatters'
import { planBlocks } from '@/lib/planLevels'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'
import type { ActionPlanItem, PlanStatus } from '@/types/domain'

type Dialog =
  | { kind: 'add' }
  | { kind: 'edit'; item: ActionPlanItem; step: 'form' | 'confirm' }
  | { kind: 'delete'; item: ActionPlanItem }

const STATUS_OPTIONS = (Object.keys(PLAN_STATUS_LABEL) as PlanStatus[]).map((value) => ({ value, label: PLAN_STATUS_LABEL[value] }))

/**
 * Plan d'action (PME, Industrie) : actions chiffrées du mois reprises des recommandations, avec leur avancement.
 * Au niveau technique, l'historique des « Vérifier et résoudre » s'ajoute. Les gains sont des estimations du
 * moteur de recommandation, jamais des économies mesurées (provenance « synthétique »).
 */
export function PlanActionPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'pme')
  const plan = useActionPlan(profile ?? 'pme')
  const summary = usePlanSummary(profile ?? 'pme')
  const resolutions = useResolutions(profile ?? 'pme')
  const { create, update, remove } = usePlanMutations(profile ?? 'pme')
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [form, setForm] = useState({ title: '', description: '', gain: '', status: 'a_faire' as PlanStatus })

  if (!profile) return null
  const blocks = planBlocks(level)

  function openAdd() {
    setForm({ title: '', description: '', gain: '', status: 'a_faire' })
    create.reset()
    setDialog({ kind: 'add' })
  }

  function openEdit(item: ActionPlanItem) {
    setForm({ title: item.title, description: item.detail, gain: item.gain ? String(item.gain) : '', status: item.status })
    update.reset()
    setDialog({ kind: 'edit', item, step: 'form' })
  }

  const fields = (
    <div className="flex flex-col gap-3">
      <TextField label="Titre de l’action" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      <TextField label="Détail" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Gain estimé (FCFA)" type="number" min="0" value={form.gain} onChange={(e) => setForm((f) => ({ ...f, gain: e.target.value }))} />
        <SelectField label="Statut" value={form.status} onChange={(value) => setForm((f) => ({ ...f, status: value as PlanStatus }))} options={STATUS_OPTIONS} />
      </div>
    </div>
  )

  const gainValue = form.gain ? Number(form.gain) : undefined

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-secondary">
        Les actions chiffrées du mois, reprises de vos recommandations, avec leur avancement
        {blocks.showResolutions ? ' et le résultat de chaque vérification lancée sur vos machines.' : '.'}
      </p>

      <MetricState status={summary.status}>
        {summary.data && (
          <section aria-label="Totaux du plan" className="grid grid-cols-1 border-y border-border border-t-2 border-t-text-primary sm:grid-cols-2">
            <div className="flex flex-col gap-1 px-4 py-4 lg:px-5">
              <span className="text-xs font-medium text-text-secondary">Gain estimé restant</span>
              <p className="font-heading text-[2rem] font-bold leading-tight tabular-nums">{summary.data.potentialLabel}</p>
              <p className="text-xs text-text-secondary">{summary.data.openCount} actions à traiter</p>
              <ProvenanceBadge value="synthetique" className="w-fit" />
            </div>
            <div className="flex flex-col gap-1 border-t border-border px-4 py-4 sm:border-l sm:border-t-0 lg:px-5">
              <span className="text-xs font-medium text-text-secondary">Actions faites</span>
              <p className="font-heading text-[2rem] font-bold leading-tight tabular-nums">
                {summary.data.doneCount}
                <span className="ml-1 text-sm font-medium text-text-secondary">/ {summary.data.totalCount}</span>
              </p>
              <p className="text-xs text-text-secondary">{summary.data.doneLabel} de gain estimé</p>
              <ProvenanceBadge value="synthetique" className="w-fit" />
            </div>
          </section>
        )}
      </MetricState>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-section-title font-semibold text-text-primary">Plan du mois</h2>
          <Button type="button" onClick={openAdd}>
            Ajouter une action
          </Button>
        </div>
        <MetricState status={plan.status} isEmpty={plan.data?.length === 0}>
          <ol className="border-t-2 border-text-primary">
            {plan.data?.map((item, index) => (
              <li key={item.id} className="flex flex-col gap-2 border-b border-border py-4">
                <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-x-3">
                  <span className="font-heading text-lg font-semibold text-text-tertiary tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-semibold text-text-primary">{item.title}</h3>
                    {item.detail && <p className="mt-0.5 text-sm text-text-secondary">{item.detail}</p>}
                  </div>
                  <div className="text-right">
                    {item.amountLabel && <p className="font-heading text-lg font-semibold tabular-nums text-confirm">{item.amountLabel}</p>}
                    <ProvenanceBadge value={item.provenance} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pl-[3.25rem] text-sm">
                  <span className="text-text-secondary">Statut : {item.statusLabel.toLowerCase()}</span>
                  {item.status !== 'fait' && (
                    <button
                      type="button"
                      className="focus-ring font-semibold text-accent-cta hover:underline"
                      onClick={() => update.mutate({ id: item.id, payload: { status: 'fait' } })}
                    >
                      Marquer comme fait
                    </button>
                  )}
                  <button type="button" className="focus-ring font-semibold text-accent-cta hover:underline" onClick={() => openEdit(item)} aria-label={`Modifier ${item.title}`}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="focus-ring font-semibold text-alert hover:underline"
                    aria-label={`Retirer ${item.title} du plan`}
                    onClick={() => {
                      remove.reset()
                      setDialog({ kind: 'delete', item })
                    }}
                  >
                    Retirer du plan
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </MetricState>
      </section>

      {blocks.showResolutions && (
        <section className="flex flex-col gap-3">
          <h2 className="text-section-title font-semibold text-text-primary">Historique des résolutions</h2>
          <MetricState status={resolutions.status} isEmpty={resolutions.data?.length === 0}>
            <div className="overflow-x-auto border-t-2 border-text-primary">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    <th className="py-2 pr-4">Heure</th>
                    <th className="py-2 pr-4">Machine</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Résultat</th>
                    <th className="py-2">Provenance</th>
                  </tr>
                </thead>
                <tbody>
                  {resolutions.data?.map((row) => (
                    <tr key={row.id} className="border-b border-border">
                      <td className="whitespace-nowrap py-2.5 pr-4 font-semibold tabular-nums">{row.date}</td>
                      <td className="py-2.5 pr-4">{row.machineLabel}</td>
                      <td className="py-2.5 pr-4">Vérifier et résoudre</td>
                      <td className="py-2.5 pr-4">{row.resultLabel}</td>
                      <td className="py-2.5">
                        <ProvenanceBadge value={row.provenance} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MetricState>
        </section>
      )}

      {dialog?.kind === 'add' && (
        <Modal
          title="Ajouter une action au plan"
          description="Elle apparaîtra dans le plan du mois en cours."
          onClose={() => setDialog(null)}
          width="lg"
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button type="submit" form="plan-add-form" disabled={create.isPending}>
                {create.isPending ? 'Ajout…' : 'Ajouter au plan'}
              </Button>
            </>
          }
        >
          <form
            id="plan-add-form"
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              create.mutate(
                { title: form.title.trim(), description: form.description || undefined, gain_estime_fcfa: gainValue },
                { onSuccess: () => setDialog(null) },
              )
            }}
          >
            {fields}
            <p className="text-xs text-text-secondary">Cette action sera enregistrée dans l’onglet Audit.</p>
            <MutationError error={create.error} />
          </form>
        </Modal>
      )}

      {dialog?.kind === 'edit' && dialog.step === 'form' && (
        <Modal
          title="Modifier l’action"
          description={dialog.item.title}
          onClose={() => setDialog(null)}
          width="lg"
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button type="submit" form="plan-edit-form">
                Enregistrer
              </Button>
            </>
          }
        >
          <form
            id="plan-edit-form"
            onSubmit={(event) => {
              event.preventDefault()
              setDialog({ ...dialog, step: 'confirm' })
            }}
          >
            {fields}
          </form>
        </Modal>
      )}

      {dialog?.kind === 'edit' && dialog.step === 'confirm' && (
        <ConfirmEditModal
          subject={`Vous allez modifier « ${dialog.item.title} ».`}
          changes={[
            { label: 'Titre', before: dialog.item.title, after: form.title.trim() },
            { label: 'Détail', before: dialog.item.detail, after: form.description },
            { label: 'Gain estimé', before: dialog.item.gain ? formatFcfa(dialog.item.gain) : '', after: gainValue ? formatFcfa(gainValue) : '' },
            { label: 'Statut', before: PLAN_STATUS_LABEL[dialog.item.status], after: PLAN_STATUS_LABEL[form.status] },
          ].filter((change) => change.before !== change.after)}
          pending={update.isPending}
          error={update.error}
          onBack={() => setDialog({ ...dialog, step: 'form' })}
          onConfirm={() =>
            update.mutate(
              { id: dialog.item.id, payload: { title: form.title.trim(), description: form.description, gain_estime_fcfa: gainValue, status: form.status } },
              { onSuccess: () => setDialog(null) },
            )
          }
        />
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmDeleteModal
          title="Retirer cette action du plan ?"
          description={dialog.item.title}
          consequences={[
            ...(dialog.item.gain ? [`Gain estimé retiré du total du mois : ${formatFcfa(dialog.item.gain)}.`] : []),
            'La recommandation d’origine reste disponible dans Recommandations.',
          ]}
          confirmLabel="Retirer du plan"
          pending={remove.isPending}
          error={remove.error}
          onCancel={() => setDialog(null)}
          onConfirm={() => remove.mutate(dialog.item.id, { onSuccess: () => setDialog(null) })}
        />
      )}
    </div>
  )
}
