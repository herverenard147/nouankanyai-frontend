import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { SiteFields } from '@/components/boitier/SiteFields'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useBoitierMutations, useBoitierPrice } from '@/hooks/queries/useBoitiers'
import { useSites } from '@/hooks/queries/useSites'
import { EMPTY_SITE_CHOICE, resolveSiteId, siteChoiceReady } from '@/lib/boitierForms'
import { formatFcfa } from '@/lib/formatters'
import type { Profile } from '@/types/domain'

/** Demande d'un boîtier : le prix vient du backend et il est figé au moment de la demande. */
export function RequestBoitierModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const sites = useSites()
  const price = useBoitierPrice()
  const { request } = useBoitierMutations()
  const client = useQueryClient()
  const [site, setSite] = useState(EMPTY_SITE_CHOICE)
  const [quantity, setQuantity] = useState('1')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [siteError, setSiteError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  const siteList = sites.data ?? []
  const qty = Math.min(20, Math.max(1, Number.parseInt(quantity, 10) || 1))
  const unit = price.data?.unit_price_fcfa
  const ready = sites.isSuccess && siteChoiceReady(siteList, site) && contact.trim().length >= 3 && unit !== undefined

  async function submit() {
    setBusy(true)
    setSiteError(null)
    try {
      const siteId = await resolveSiteId(siteList, site)
      if (siteList.length === 0) await client.invalidateQueries({ queryKey: ['sites'] })
      await request.mutateAsync({
        site_id: siteId,
        quantity: qty,
        contact: contact.trim(),
        notes: notes.trim() || null,
      })
      onClose()
    } catch (error) {
      setSiteError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Demander un boîtier"
      description="Dites-nous où le boîtier sera installé."
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={!ready || busy}>
            {busy ? 'Envoi…' : 'Envoyer la demande'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <SiteFields sites={siteList} value={site} onChange={setSite} label="Où sera-t-il installé ?" />
        {profile !== 'menage' && (
          <TextField label="Nombre de boîtiers" type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        )}
        <TextField
          label="Contact pour la livraison"
          placeholder={profile === 'menage' ? 'Numéro de téléphone' : 'Nom et numéro de téléphone'}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="boitier-notes" className="text-sm font-medium text-text-primary">
            Précisions (facultatif)
          </label>
          <textarea
            id="boitier-notes"
            rows={3}
            maxLength={500}
            placeholder="Ex. pièce, étage, repère pour le livreur"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="focus-ring rounded-control border border-border bg-card px-3.5 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        <div className="flex flex-col gap-1 bg-bg-elevated px-3.5 py-3 text-sm" aria-live="polite">
          {profile !== 'menage' && (
            <div className="flex justify-between">
              <span>Prix par boîtier</span>
              <b>{unit === undefined ? '…' : formatFcfa(unit)}</b>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span>{profile === 'menage' ? 'Prix du boîtier' : `Total pour ${qty} boîtier${qty > 1 ? 's' : ''}`}</span>
            <b className="font-heading text-lg">{unit === undefined ? '…' : formatFcfa(unit * qty)}</b>
          </div>
        </div>
        <p className="text-xs text-text-secondary">Votre demande est transmise à l’équipe Nouankany, qui vous contacte pour la livraison.</p>
        <MutationError error={siteError} />
      </div>
    </Modal>
  )
}
