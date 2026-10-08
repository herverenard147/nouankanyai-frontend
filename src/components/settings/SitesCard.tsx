import { useState } from 'react'
import type { FormEvent } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, Modal, MutationError } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useCreateSite, useDeleteSite, useSites } from '@/hooks/queries/useSites'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'

/** Sites d'un compte PME ou Industrie : liste, ajout, suppression confirmée (DELETE /api/sites/{id}).
 * Les machines du site sont détachées, pas supprimées ; un site qui a un boîtier actif est refusé
 * par le serveur avec un message explicite. */
export function SitesCard() {
  const query = useSites()
  const createMutation = useCreateSite()
  const deleteMutation = useDeleteSite()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ nom: '', localisation: '' })
  const [removing, setRemoving] = useState<{ id: string; nom: string } | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMutation.mutate(form, {
      onSuccess: () => {
        setForm({ nom: '', localisation: '' })
        setAdding(false)
      },
    })
  }

  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Sites</h2>
      <p className="text-sm text-text-secondary">Les lieux où se trouvent vos équipements. Un boîtier écoute un site.</p>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <ul>
          {query.data?.map((site) => (
            <li key={site.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2.5">
              <div>
                <p className="text-sm font-semibold text-text-primary">{site.nom}</p>
                <p className="text-sm text-text-secondary">{site.localisation}</p>
              </div>
              <button
                type="button"
                className="focus-ring text-sm font-semibold text-alert hover:underline"
                aria-label={`Supprimer le site ${site.nom}`}
                onClick={() => {
                  deleteMutation.reset()
                  setRemoving({ id: site.id, nom: site.nom })
                }}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      </MetricState>
      <Button
        type="button"
        className="w-fit"
        onClick={() => {
          createMutation.reset()
          setAdding(true)
        }}
      >
        Ajouter un site
      </Button>

      {adding && (
        <Modal
          title="Ajouter un site"
          onClose={() => setAdding(false)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                Annuler
              </Button>
              <Button type="submit" form="site-form" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Ajout…' : 'Ajouter le site'}
              </Button>
            </>
          }
        >
          <form id="site-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
            <TextField label="Nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
            <TextField label="Localisation" value={form.localisation} onChange={(e) => setForm((f) => ({ ...f, localisation: e.target.value }))} required />
            <MutationError error={createMutation.error} />
          </form>
        </Modal>
      )}

      {removing && (
        <ConfirmDeleteModal
          title={`Supprimer le site « ${removing.nom} » ?`}
          consequences={[
            'Ses équipements restent dans votre compte, sans site.',
            'Un boîtier rattaché à ce site doit d’abord être déconnecté.',
          ]}
          confirmLabel="Supprimer le site"
          pending={deleteMutation.isPending}
          error={deleteMutation.error}
          onCancel={() => setRemoving(null)}
          onConfirm={() => deleteMutation.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
        />
      )}
    </section>
  )
}
