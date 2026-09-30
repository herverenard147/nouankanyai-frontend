import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'

import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useAddMachine, useUpdateMachine } from '@/hooks/queries/useMachineCrud'
import { useSites } from '@/hooks/queries/useSites'
import { onEscape } from '@/lib/a11y'
import { ApiError } from '@/lib/apiClient'
import type { BackendMachine } from '@/types/backend'

interface MachineFormDrawerProps {
  /** Machine existante à modifier, ou `null` pour un ajout. */
  machine: BackendMachine | null
  itemLabel: string
  onClose: () => void
}

const PRIORITIES = [
  { value: 'basse', label: 'Basse' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'haute', label: 'Haute' },
]

/** Formulaire d'ajout/modification, partagé entre EquipmentPage (PME) et
 * MachinesPage (Industrie) — même ressource backend (`/api/machines`). */
export function MachineFormDrawer({ machine, itemLabel, onClose }: MachineFormDrawerProps) {
  const isEdit = machine !== null
  const sitesQuery = useSites()
  const addMutation = useAddMachine()
  const updateMutation = useUpdateMachine()
  const mutation = isEdit ? updateMutation : addMutation

  const [form, setForm] = useState({
    nom: machine?.nom ?? '',
    categorie: machine?.categorie ?? '',
    marque: machine?.marque ?? '',
    modele: machine?.modele ?? '',
    numero_serie: machine?.numero_serie ?? '',
    power_kw: machine?.power_kw != null ? String(machine.power_kw) : '',
    priority: machine?.priority ?? 'moyenne',
    site_id: machine?.site_id ?? '',
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const power_kw = form.power_kw ? Number(form.power_kw) : undefined

    if (isEdit && machine) {
      updateMutation.mutate(
        {
          machineId: machine.machine_id,
          payload: {
            nom: form.nom,
            categorie: form.categorie || undefined,
            marque: form.marque || undefined,
            modele: form.modele || undefined,
            numero_serie: form.numero_serie || undefined,
            power_kw,
            priority: form.priority,
            site_id: form.site_id || undefined,
          },
        },
        { onSuccess: onClose },
      )
    } else {
      addMutation.mutate(
        {
          nom: form.nom,
          categorie: form.categorie || undefined,
          marque: form.marque || undefined,
          modele: form.modele || undefined,
          numero_serie: form.numero_serie || undefined,
          power_kw,
          site_id: form.site_id || undefined,
        },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-dark-bg/40 overlay-backdrop">
      <button type="button" aria-label="Fermer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside
        className="relative flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto bg-card p-6 shadow-assistant-panel overlay-panel-right"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? `Modifier ${itemLabel}` : `Ajouter ${itemLabel}`}
        onKeyDown={onEscape(onClose)}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-section-title font-semibold text-text-primary">
            {isEdit ? `Modifier ${itemLabel}` : `Ajouter ${itemLabel}`}
          </h3>
          <button type="button" onClick={onClose} className="focus-ring rounded-control p-1 text-text-secondary hover:text-text-primary" aria-label="Fermer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <TextField
            label="Nom"
            required
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
          />
          <TextField
            label="Catégorie"
            value={form.categorie}
            onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))}
          />
          <TextField
            label="Marque"
            value={form.marque}
            onChange={(e) => setForm((f) => ({ ...f, marque: e.target.value }))}
          />
          <TextField
            label="Modèle"
            value={form.modele}
            onChange={(e) => setForm((f) => ({ ...f, modele: e.target.value }))}
          />
          <TextField
            label="Numéro de série"
            value={form.numero_serie}
            onChange={(e) => setForm((f) => ({ ...f, numero_serie: e.target.value }))}
          />
          <TextField
            label="Puissance (kW)"
            type="number"
            step="0.1"
            min="0"
            value={form.power_kw}
            onChange={(e) => setForm((f) => ({ ...f, power_kw: e.target.value }))}
          />
          {!isEdit && (
            <p className="text-xs text-text-secondary">
              Si le modèle ne correspond à aucun modèle du catalogue, la puissance (kW) est obligatoire.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="machine-site" className="text-sm font-medium text-text-primary">
              Site
            </label>
            <select
              id="machine-site"
              value={form.site_id}
              onChange={(e) => setForm((f) => ({ ...f, site_id: e.target.value }))}
              className="focus-ring min-h-11 rounded-control border border-border bg-card px-3.5 py-3 text-sm text-text-primary"
            >
              <option value="">Non associé</option>
              {sitesQuery.data?.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.nom}
                </option>
              ))}
            </select>
          </div>

          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="machine-priority" className="text-sm font-medium text-text-primary">
                Priorité
              </label>
              <select
                id="machine-priority"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="focus-ring min-h-11 rounded-control border border-border bg-card px-3.5 py-3 text-sm text-text-primary"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button type="submit" disabled={mutation.isPending} className="mt-2 w-fit">
            {mutation.isPending ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Ajouter'}
          </Button>
          {mutation.isError && (
            <ApiErrorMessage
              message={mutation.error instanceof ApiError ? mutation.error.message : "Échec de l'enregistrement."}
              className="text-sm text-alert"
            />
          )}
        </form>
      </aside>
    </div>
  )
}
