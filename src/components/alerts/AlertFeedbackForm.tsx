import { useState } from 'react'
import type { FormEvent } from 'react'

import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useAlertFeedback } from '@/hooks/queries/useAlertRegistry'
import {
  ACTION_CHOICES, NOTHING_DONE_CHOICES, USEFUL_CHOICES, alertProvenance, closureLabel, feedbackFieldsForLevel, problemChoices,
} from '@/lib/alertRegistry'
import type { Choice } from '@/lib/alertRegistry'
import { formatUtcDateTime } from '@/lib/formatters'
import type { BackendAlertEntry, BackendAlertFeedbackIn } from '@/types/backend'
import type { Level } from '@/types/domain'

interface ChoiceGroupProps<T extends string> {
  legend: string
  name: string
  choices: Choice<T>[]
  value: T | null
  onChange: (value: T) => void
}

function ChoiceGroup<T extends string>({ legend, name, choices, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <fieldset className="flex flex-col">
      <legend className="mb-1 text-sm font-semibold text-text-primary">{legend}</legend>
      {choices.map((c) => (
        <label key={c.value} className="flex min-h-11 cursor-pointer items-center gap-3 border-t border-border py-2">
          <input type="radio" name={name} className="h-4 w-4 shrink-0" checked={value === c.value} onChange={() => onChange(c.value)} />
          <span className="text-sm text-text-primary">{c.label}</span>
        </label>
      ))}
    </fieldset>
  )
}

interface AlertFeedbackFormProps {
  alert: BackendAlertEntry
  level: Level
  onLater: () => void
}

/**
 * « Qu'avez-vous fait ? » sur une alerte fermée (registre, POST /api/v1/alerts/{id}/feedback). La réponse dit à
 * Nouankany si sa recommandation a servi, pour l'ajuster. Une alerte fermée sur une mesure synthétique reste
 * documentable, mais le retour n'ajuste rien (le backend le marque non fiable).
 */
export function AlertFeedbackForm({ alert, level, onLater }: AlertFeedbackFormProps) {
  const fields = feedbackFieldsForLevel(level)
  const mutation = useAlertFeedback()
  const [didSomething, setDidSomething] = useState<'oui' | 'non' | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [problemDetail, setProblemDetail] = useState('')
  const [action, setAction] = useState<'reco_suivie' | 'autre_action' | 'technicien' | null>(null)
  const [actionDetail, setActionDetail] = useState('')
  const [useful, setUseful] = useState<'oui' | 'en_partie' | 'non' | null>(null)
  const [cost, setCost] = useState('')
  const [downtime, setDowntime] = useState('')
  const provenance = alertProvenance(alert)
  const did = didSomething === 'oui'
  const ready = didSomething !== null && problem !== null && (!did || action !== null)

  function choose(value: 'oui' | 'non') {
    setDidSomething(value)
    setProblem(null)
    setAction(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ready) return
    const body: BackendAlertFeedbackIn = {
      did_something: did,
      problem: problem!,
      action: did ? action! : 'rien',
    }
    if (problem === 'autre_cause' && problemDetail.trim()) body.problem_detail = problemDetail.trim()
    if (did && action === 'autre_action' && actionDetail.trim()) body.action_detail = actionDetail.trim()
    if (did && useful) body.reco_useful = useful
    const costValue = Number(cost.replace(',', '.'))
    const downtimeValue = Number(downtime.replace(',', '.'))
    if (fields.showCostAndDowntime && cost.trim() && Number.isFinite(costValue) && costValue >= 0) body.cost_fcfa = costValue
    if (fields.showCostAndDowntime && downtime.trim() && Number.isFinite(downtimeValue) && downtimeValue >= 0) body.downtime_hours = downtimeValue
    mutation.mutate({ alertId: alert.id, body })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-border py-4" aria-label={`Retour sur ${alert.kind_label ?? 'l’alerte'}`}>
      <div>
        <h3 className="text-[0.9375rem] font-bold text-text-primary">
          {alert.machine_nom ?? alert.machine_code} : {alert.kind_label ?? alert.title}
        </h3>
        <p className="mt-0.5 text-sm text-text-secondary">
          {closureLabel(alert)}, le {formatUtcDateTime(alert.closed_at)} UTC.
        </p>
        {provenance && (
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-text-secondary">
            Source : <ProvenanceBadge value={provenance} className="lowercase" />
            {provenance === 'synthetique' && <span>· votre réponse est gardée, mais n&rsquo;ajustera pas les recommandations.</span>}
          </p>
        )}
      </div>

      {fields.showSteps && alert.reco.steps.length > 0 && (
        <details className="text-sm text-text-secondary">
          <summary className="focus-ring cursor-pointer font-semibold text-text-primary">Recommandation affichée</summary>
          <ul className="mt-2 list-disc pl-5">
            {alert.reco.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </details>
      )}

      <ChoiceGroup
        legend="Avez-vous fait quelque chose ?"
        name={`did-${alert.id}`}
        choices={[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }]}
        value={didSomething}
        onChange={choose}
      />

      {didSomething === 'non' && (
        <ChoiceGroup legend="Selon vous" name={`problem-${alert.id}`} choices={NOTHING_DONE_CHOICES} value={problem} onChange={setProblem} />
      )}

      {did && (
        <>
          <ChoiceGroup legend="Quel était le problème ?" name={`problem-${alert.id}`} choices={problemChoices(alert)} value={problem} onChange={setProblem} />
          {problem === 'autre_cause' && (
            <TextField label="Laquelle ? (facultatif)" maxLength={200} value={problemDetail} onChange={(e) => setProblemDetail(e.target.value)} />
          )}
          <ChoiceGroup legend="Qu'avez-vous fait ?" name={`action-${alert.id}`} choices={ACTION_CHOICES} value={action} onChange={setAction} />
          {action === 'autre_action' && (
            <TextField label="Quoi ? (facultatif)" maxLength={200} value={actionDetail} onChange={(e) => setActionDetail(e.target.value)} />
          )}
          <ChoiceGroup legend="La recommandation vous a-t-elle aidé ?" name={`useful-${alert.id}`} choices={USEFUL_CHOICES} value={useful} onChange={setUseful} />
          {fields.showCostAndDowntime && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <TextField label="Coût de l'intervention en FCFA (facultatif)" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} className="sm:w-64" />
              <TextField label="Durée d'arrêt en heures (facultatif)" inputMode="decimal" value={downtime} onChange={(e) => setDowntime(e.target.value)} className="sm:w-64" />
            </div>
          )}
        </>
      )}

      {mutation.isError && <ApiErrorMessage message="Votre réponse n'a pas pu être enregistrée." className="text-sm text-alert" />}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!ready} loading={mutation.isPending}>
          Envoyer
        </Button>
        <Button type="button" variant="outline" onClick={onLater}>
          Plus tard
        </Button>
      </div>
    </form>
  )
}
