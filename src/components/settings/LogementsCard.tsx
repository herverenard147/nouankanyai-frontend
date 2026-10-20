import { useState } from 'react'
import type { FormEvent } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, Modal, MutationError } from '@/components/ui/Modal'
import { RequiredMark, TextField } from '@/components/ui/TextField'
import { useCreateSite, useDeleteSite, useSites, useUpdateLogement } from '@/hooks/queries/useSites'
import { formatNumberFr } from '@/lib/formatters'
import { LIMITS } from '@/lib/validation'
import type { BackendSite, MeterType } from '@/types/backend'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'

export const METER_LABEL: Record<MeterType, string> = {
  postpaye: 'Compteur à facture',
  prepaye: 'Compteur à carte (je recharge)',
}

/** Calibre du disjoncteur en ampères : saisi en A, ou tiré des kVA lus sur la facture (A = kVA × 1000 / 220). */
export function breakerAmperes(site: Pick<BackendSite, 'souscription_valeur' | 'souscription_unite'>): number | null {
  const v = site.souscription_valeur
  if (!v) return null
  if (site.souscription_unite === 'A') return v
  if (site.souscription_unite === 'kVA') return Math.round((v * 1000) / 220)
  return null
}

/**
 * Logements d'un ménage (décision du propriétaire, 2026-10-20) : un seul en Découverte et Essentiel, jusqu'à trois en
 * Optimum (le serveur le vérifie et le dit). Chaque logement a son type de compteur (à facture ou à carte) et le
 * calibre de son disjoncteur. Le mot « site » n'apparaît pas pour le ménage.
 */
export function LogementsCard() {
  const query = useSites()
  const create = useCreateSite()
  const remove = useDeleteSite()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<BackendSite | null>(null)
  const [removing, setRemoving] = useState<BackendSite | null>(null)

  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Mes logements</h2>
      <p className="text-sm text-text-secondary">
        Chaque logement a son compteur CIE : à facture, ou à carte que vous rechargez. Le calibre du disjoncteur sert à savoir si vous approchez de sa
        limite.
      </p>
      <MetricState status={query.status} isEmpty={false}>
        {query.data && query.data.length === 0 ? (
          <p className="border-t border-border py-2.5 text-sm text-text-secondary">
            Aucun logement enregistré pour l’instant. Il est créé tout seul quand vous indiquez le calibre de votre disjoncteur, ou ajoutez-le ici.
          </p>
        ) : (
          <ul>
            {query.data?.map((site) => {
              const amps = breakerAmperes(site)
              return (
                <li key={site.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{site.nom}</p>
                    <p className="text-sm text-text-secondary">
                      {METER_LABEL[site.compteur_type ?? 'postpaye']} · Disjoncteur :{' '}
                      {amps !== null ? <span className="font-semibold text-text-primary">{formatNumberFr(amps, 0)} A</span> : 'calibre non renseigné'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      className="focus-ring text-sm font-semibold text-accent-cta hover:underline"
                      aria-label={`Modifier le logement ${site.nom}`}
                      onClick={() => setEditing(site)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="focus-ring text-sm font-semibold text-alert hover:underline"
                      aria-label={`Supprimer le logement ${site.nom}`}
                      onClick={() => {
                        remove.reset()
                        setRemoving(site)
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </MetricState>
      <Button
        type="button"
        className="w-fit"
        onClick={() => {
          create.reset()
          setAdding(true)
        }}
      >
        Ajouter un logement
      </Button>

      {adding && <LogementModal onClose={() => setAdding(false)} create={create} />}
      {editing && <LogementModal site={editing} onClose={() => setEditing(null)} />}
      {removing && (
        <ConfirmDeleteModal
          title={`Supprimer le logement « ${removing.nom} » ?`}
          consequences={['Ses appareils restent dans votre compte, sans logement.', 'Le calibre de son disjoncteur est effacé.']}
          confirmLabel="Supprimer le logement"
          pending={remove.isPending}
          error={remove.error}
          onCancel={() => setRemoving(null)}
          onConfirm={() => remove.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
        />
      )}
    </section>
  )
}

function LogementModal({ site, onClose, create }: { site?: BackendSite; onClose: () => void; create?: ReturnType<typeof useCreateSite> }) {
  const update = useUpdateLogement()
  const [nom, setNom] = useState(site?.nom ?? '')
  const [meter, setMeter] = useState<MeterType>(site?.compteur_type ?? 'postpaye')
  const initialAmps = site ? breakerAmperes(site) : null
  const [amps, setAmps] = useState(initialAmps !== null ? String(initialAmps) : '')
  const mutation = site ? update : create!
  const ampsNumber = amps.trim() === '' ? null : Number(amps.replace(',', '.'))
  const ampsValid = ampsNumber === null || (Number.isFinite(ampsNumber) && ampsNumber > 0 && ampsNumber <= 1000)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!nom.trim() || !ampsValid) return
    if (site) {
      update.mutate(
        { site, nom, compteur_type: meter, amperes: ampsNumber === initialAmps ? undefined : ampsNumber },
        { onSuccess: onClose },
      )
    } else {
      create!.mutate({ nom: nom.trim(), compteur_type: meter }, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      title={site ? `Modifier « ${site.nom} »` : 'Ajouter un logement'}
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={mutation.isPending} type="submit" form="logement-form" disabled={mutation.isPending || !nom.trim() || !ampsValid}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="logement-form" onSubmit={submit} className="flex flex-col gap-3">
        <TextField label="Nom" placeholder="Ex. Maison, Boutique" maxLength={LIMITS.name} value={nom} onChange={(e) => setNom(e.target.value)} required />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-text-primary">
            Type de compteur <RequiredMark />
          </legend>
          {(Object.keys(METER_LABEL) as MeterType[]).map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm text-text-primary">
              <input type="radio" name="compteur" value={value} checked={meter === value} onChange={() => setMeter(value)} />
              {METER_LABEL[value]}
            </label>
          ))}
        </fieldset>
        {site && (
          <TextField
            label="Calibre du disjoncteur (ampères), facultatif"
            inputMode="decimal"
            placeholder="Case « Réglage disjoncteur » de la facture CIE"
            value={amps}
            onChange={(e) => setAmps(e.target.value)}
            error={ampsValid ? undefined : 'Un nombre entre 1 et 1000.'}
          />
        )}
        <MutationError error={mutation.error} />
      </form>
    </Modal>
  )
}
