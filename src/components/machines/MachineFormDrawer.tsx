import { LIMITS } from '@/lib/validation'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { ConfirmEditModal, Modal, MutationError, SelectField, type FieldChange } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useQuery } from '@tanstack/react-query'

import { rawEquipmentCatalog } from '@/api/rawBackend'
import { ComboboxField } from '@/components/ui/ComboboxField'
import { catalogSuggestions } from '@/lib/equipmentCatalog'
import { MachinePhotoCapture } from '@/components/machines/MachinePhotoCapture'
import { useSessionStore } from '@/store/sessionStore'
import { useAddMachine, useUpdateMachine } from '@/hooks/queries/useMachineCrud'
import { useSites } from '@/hooks/queries/useSites'
import { formatNumberFr } from '@/lib/formatters'
import { priorityLabel } from '@/api/backendHelpers'
import type { BackendMachine, BackendMachinePhotoExtraction } from '@/types/backend'

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

/**
 * Modale d'ajout/modification, partagée entre EquipmentPage (PME) et MachinesPage (Industrie) : même
 * ressource backend (`/api/machines`). L'ajout s'enregistre directement ; la modification passe par une
 * seconde modale de validation (avant → après), voir DESIGN.md §8. (Le nom du fichier est historique : c'était
 * un tiroir.)
 */
export function MachineFormDrawer({ machine, itemLabel, onClose }: MachineFormDrawerProps) {
  const isEdit = machine !== null
  const profile = useSessionStore((s) => s.session?.profile)
  // Catalogue d'équipements pour les suggestions (Ménage : référentiel domestique seul).
  const segment = profile === 'menage' ? 'menage' : undefined
  const catalog = useQuery({
    queryKey: ['equipment-catalog', segment ?? 'tous'],
    queryFn: () => rawEquipmentCatalog(segment),
    staleTime: Infinity,
    enabled: profile !== undefined && profile !== 'admin',
  })
  const sitesQuery = useSites()
  const addMutation = useAddMachine()
  const updateMutation = useUpdateMachine()
  const [step, setStep] = useState<'form' | 'confirm' | 'photo'>('form')
  const [categorieNonReconnue, setCategorieNonReconnue] = useState(false)
  const [errors, setErrors] = useState<{ nom?: string; power?: string; annee?: string }>({})

  const [form, setForm] = useState({
    nom: machine?.nom ?? '',
    categorie: machine?.categorie ?? '',
    marque: machine?.marque ?? '',
    modele: machine?.modele ?? '',
    numero_serie: machine?.numero_serie ?? '',
    annee: machine?.annee_mise_en_service ? String(machine.annee_mise_en_service) : '',
    power_kw: machine?.power_kw != null ? String(machine.power_kw) : '',
    priority: machine?.priority ?? 'moyenne',
    site_id: machine?.site_id ?? '',
    photo_data_url: undefined as string | undefined,
    reference_id: undefined as string | undefined,
  })

  function handlePhotoExtracted(extracted: BackendMachinePhotoExtraction['extracted'], photoDataUrl: string) {
    setForm((f) => ({
      ...f,
      nom: extracted.nom_suggere ?? f.nom,
      categorie: extracted.categorie ?? f.categorie,
      marque: extracted.marque ?? f.marque,
      modele: extracted.modele ?? f.modele,
      power_kw: extracted.puissance_nominale_kw != null ? String(extracted.puissance_nominale_kw) : f.power_kw,
      photo_data_url: photoDataUrl,
    }))
    setCategorieNonReconnue(!extracted.categorie_connue)
    setStep('form')
  }
  const siteName = (id: string) => sitesQuery.data?.find((site) => site.id === id)?.nom ?? 'Non associé'

  const changes: FieldChange[] = machine
    ? [
        { label: 'Nom', before: machine.nom, after: form.nom },
        { label: 'Catégorie', before: machine.categorie ?? '', after: form.categorie },
        { label: 'Marque', before: machine.marque ?? '', after: form.marque },
        { label: 'Modèle', before: machine.modele ?? '', after: form.modele },
        { label: 'Numéro de série', before: machine.numero_serie ?? '', after: form.numero_serie },
        { label: 'Année de mise en service', before: machine.annee_mise_en_service ? String(machine.annee_mise_en_service) : '', after: form.annee },
        { label: 'Puissance', before: `${formatNumberFr(machine.power_kw, 1)} kW`, after: form.power_kw ? `${formatNumberFr(Number(form.power_kw), 1)} kW` : '' },
        { label: 'Priorité', before: priorityLabel(machine.priority), after: priorityLabel(form.priority) },
        { label: 'Site', before: siteName(machine.site_id ?? ''), after: siteName(form.site_id) },
      ].filter((change) => change.before !== change.after)
    : []

  function save() {
    const power_kw = form.power_kw ? Number(form.power_kw.replace(',', '.')) : undefined
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
            annee_mise_en_service: form.annee ? Number(form.annee) : undefined,
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
          annee_mise_en_service: form.annee ? Number(form.annee) : undefined,
          power_kw,
          site_id: form.site_id || undefined,
          photo_data_url: form.photo_data_url,
          reference_id: form.reference_id,
        },
        { onSuccess: onClose },
      )
    }
  }

  /** Contrôle avant l'envoi : le serveur refuse les mêmes cas, mais le dire ici évite un aller-retour. */
  function validate() {
    const found: typeof errors = {}
    if (!form.nom.trim()) found.nom = 'Donnez un nom à cet appareil.'
    const power = Number(form.power_kw.replace(',', '.'))
    if (!form.power_kw.trim()) found.power = 'Indiquez la puissance, ou choisissez un modèle proposé : elle se remplit seule.'
    else if (!Number.isFinite(power) || power <= 0) found.power = 'La puissance doit être un nombre supérieur à 0.'
    else if (power > LIMITS.powerKw) found.power = 'Cette puissance est trop élevée : indiquez-la en kW, pas en W (1 500 W = 1,5 kW).'
    if (form.nom.trim().length > LIMITS.name) found.nom = `Le nom est trop long (${LIMITS.name} caractères au plus).`
    const year = Number(form.annee)
    if (form.annee && (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear()))
      found.annee = `Année entre 1980 et ${new Date().getFullYear()}.`
    setErrors(found)
    return Object.keys(found).length === 0
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return
    if (isEdit) setStep('confirm')
    else save()
  }

  if (step === 'photo') {
    return (
      <Modal title="Ajouter par photo" description="Les champs reconnus pré-rempliront le formulaire ; à vérifier avant l'ajout." onClose={onClose} width="lg" actions={
        <Button type="button" variant="outline" onClick={() => setStep('form')}>
          Revenir au formulaire
        </Button>
      }>
        <MachinePhotoCapture onExtracted={handlePhotoExtracted} />
      </Modal>
    )
  }

  if (step === 'confirm' && machine) {
    return (
      <ConfirmEditModal
        subject={`Vous allez modifier « ${machine.nom} ».`}
        changes={changes}
        pending={updateMutation.isPending}
        error={updateMutation.error}
        onConfirm={save}
        onBack={() => setStep('form')}
      />
    )
  }

  const suggestions = catalogSuggestions(catalog.data, form, profile === 'menage' ? 'menage' : 'autres')
  const applyModel = (choice: NonNullable<ReturnType<typeof suggestions.findModel>>, keepName: boolean) =>
    setForm((f) => ({
      ...f,
      nom: keepName && f.nom ? f.nom : `${choice.categorie} ${choice.marque} ${choice.modele}`,
      categorie: choice.categorie,
      marque: choice.marque,
      modele: choice.modele,
      power_kw: String(choice.puissance_kw),
      reference_id: choice.reference_id,
    }))
  const title = isEdit ? `Modifier « ${machine?.nom} »` : `Ajouter ${itemLabel}`
  const pending = addMutation.isPending

  return (
    <Modal
      title={title}
      description={isEdit ? 'Seuls les champs modifiés sont mis à jour.' : 'La puissance vient du catalogue quand le modèle y figure, sinon saisissez-la.'}
      onClose={onClose}
      width="lg"
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="machine-form" disabled={pending}>
            {pending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
    >
      <form id="machine-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <p className="text-xs text-text-secondary">
          <span aria-hidden="true" className="font-semibold text-alert">*</span> Champ obligatoire. Les autres champs proposent des
          suggestions pendant la saisie ; vous restez libre d&rsquo;écrire autre chose.
        </p>
        {!isEdit && (
          <Button type="button" variant="outline" onClick={() => setStep('photo')} className="self-start">
            Ajouter par photo
          </Button>
        )}
        {categorieNonReconnue && (
          <p className="text-xs text-text-secondary">Catégorie non reconnue automatiquement : vérifiez/complétez les champs.</p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ComboboxField
            label="Nom"
            required
            error={errors.nom}
            value={form.nom}
            onChange={(value) => setForm((f) => ({ ...f, nom: value }))}
            options={isEdit ? [] : suggestions.noms}
            onSelect={(option) => {
              // Un modèle du catalogue choisi par son nom remplit le reste du formulaire.
              const choice = suggestions.findModel(option.value)
              if (choice) applyModel(choice, false)
            }}
          />
          {isEdit ? (
            <SelectField label="Priorité" value={form.priority} onChange={(value) => setForm((f) => ({ ...f, priority: value }))} options={PRIORITIES} />
          ) : (
            <TextField label="Numéro de série" value={form.numero_serie} onChange={(e) => setForm((f) => ({ ...f, numero_serie: e.target.value }))} />
          )}
          <ComboboxField label="Catégorie" value={form.categorie} onChange={(value) => setForm((f) => ({ ...f, categorie: value }))} options={suggestions.categories} />
          <ComboboxField label="Marque" value={form.marque} onChange={(value) => setForm((f) => ({ ...f, marque: value }))} options={suggestions.marques} />
          <ComboboxField
            label="Modèle"
            value={form.modele}
            // Un modèle tapé à la main n'est plus relié à la fiche du référentiel choisie avant.
            onChange={(value) => setForm((f) => ({ ...f, modele: value, reference_id: undefined }))}
            options={suggestions.modeles}
            onSelect={(option) => {
              // Un modèle du catalogue remplit aussi catégorie, marque et puissance.
              const choice = suggestions.findModel(option.value)
              if (choice) applyModel(choice, true)
            }}
          />
          <TextField
            label="Puissance nominale (kW)"
            type="number"
            step="0.1"
            min="0"
            required
            error={errors.power}
            value={form.power_kw}
            onChange={(e) => setForm((f) => ({ ...f, power_kw: e.target.value }))}
          />
          {isEdit && (
            <TextField label="Numéro de série" value={form.numero_serie} onChange={(e) => setForm((f) => ({ ...f, numero_serie: e.target.value }))} />
          )}
          <TextField
            label="Année de mise en service (facultatif)"
            type="number"
            min="1980"
            max={String(new Date().getFullYear())}
            error={errors.annee}
            value={form.annee}
            onChange={(e) => setForm((f) => ({ ...f, annee: e.target.value }))}
          />
          <SelectField
            label="Site"
            value={form.site_id}
            onChange={(value) => setForm((f) => ({ ...f, site_id: value }))}
            options={[{ value: '', label: 'Non associé' }, ...(sitesQuery.data?.map((site) => ({ value: site.id, label: site.nom })) ?? [])]}
          />
        </div>
        {!isEdit && <p className="text-xs text-text-secondary">Cette action sera enregistrée dans l’onglet Audit.</p>}
        <MutationError error={isEdit ? updateMutation.error : addMutation.error} />
      </form>
    </Modal>
  )
}
