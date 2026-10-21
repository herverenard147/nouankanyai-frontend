import { FRENCH_VALIDITY, LIMITS } from '@/lib/validation'
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
import type { HardwareKind } from '@/types/backend'
import type { Profile } from '@/types/domain'

/** Demande de matériel (2026-10-21) : boîtier qui parle, capteur d'un appareil ou passerelle. Le prix vient du backend,
 * détaillé ligne par ligne, et il est figé au moment de la demande. */

/** Même plafond que le serveur (`app/schemas/boitier.py`, quantity ≤ 20). */
const MAX_BOITIERS = 20
export function RequestBoitierModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const sites = useSites()
  const price = useBoitierPrice()
  const { request } = useBoitierMutations()
  const client = useQueryClient()
  const [kind, setKind] = useState<HardwareKind>(profile === 'industrie' ? 'passerelle' : 'vocal')
  const [showDetail, setShowDetail] = useState(false)
  const [site, setSite] = useState(EMPTY_SITE_CHOICE)
  const [quantity, setQuantity] = useState('1')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [siteError, setSiteError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  const siteList = sites.data ?? []
  // Plus de plafond silencieux (test du site, 2026-10-18 : 9 999 devenait 20 sans un mot) : la quantité hors
  // limites est signalée sur le champ et bloque l'envoi.
  const parsed = Number(quantity)
  const quantityError =
    profile === 'menage' || (Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_BOITIERS)
      ? null
      : `Entre 1 et ${MAX_BOITIERS} boîtiers par demande. Pour plus, écrivez-nous dans Précisions.`
  const qty = profile === 'menage' || quantityError ? 1 : parsed
  const catalog = price.data?.materiels ?? []
  const chosen = catalog.find((m) => m.kind === kind)
  const unit = chosen?.prix_fcfa ?? (kind === 'vocal' ? price.data?.unit_price_fcfa : undefined)
  const label = chosen?.nom.toLowerCase() ?? 'boîtier'
  const ready = sites.isSuccess && siteChoiceReady(siteList, site) && contact.trim().length >= 3 && unit !== undefined && !quantityError

  async function submit() {
    setBusy(true)
    setSiteError(null)
    try {
      const siteId = await resolveSiteId(siteList, site)
      if (siteList.length === 0) await client.invalidateQueries({ queryKey: ['sites'] })
      await request.mutateAsync({
        site_id: siteId,
        kind,
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
      title="Commander du matériel"
      description="Choisissez le matériel et dites-nous où il sera installé."
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
        {catalog.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-text-primary">
              Matériel <span className="text-alert" aria-hidden="true">*</span>
            </legend>
            {catalog.map((m) => (
              <label key={m.kind} className={`flex cursor-pointer items-start gap-2.5 border p-3 text-sm ${kind === m.kind ? 'border-text-primary' : 'border-border'}`}>
                <input type="radio" name="materiel" value={m.kind} checked={kind === m.kind} onChange={() => setKind(m.kind)} className="mt-1" />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap justify-between gap-2 font-semibold text-text-primary">
                    {m.nom}
                    <span className="tabular-nums">{formatFcfa(m.prix_fcfa)}</span>
                  </span>
                  <span className="text-xs text-text-secondary">{m.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <SiteFields sites={siteList} value={site} onChange={setSite} label="Où sera-t-il installé ?" />
        {profile !== 'menage' && (
          <TextField
            label="Quantité"
            required
            type="number"
            min={1}
            max={MAX_BOITIERS}
            step={1}
            value={quantity}
            error={quantityError ?? undefined}
            onChange={(e) => setQuantity(e.target.value)}
          />
        )}
        <TextField
          label="Contact pour la livraison"
          required
          maxLength={LIMITS.deliveryContact}
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
          {...FRENCH_VALIDITY}
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
              <span>Prix à l’unité</span>
              <b>{unit === undefined ? '…' : formatFcfa(unit)}</b>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span>{profile === 'menage' ? `Prix du ${label}` : `Total pour ${qty}`}</span>
            <b className="font-heading text-lg">{unit === undefined ? '…' : formatFcfa(unit * qty)}</b>
          </div>
          {chosen && (
            <button type="button" className="focus-ring self-start text-xs font-semibold text-accent-cta hover:underline" aria-expanded={showDetail} onClick={() => setShowDetail((v) => !v)}>
              {showDetail ? 'Masquer le détail du prix' : 'Voir le détail du prix'}
            </button>
          )}
          {chosen && showDetail && (
            <ul className="flex flex-col gap-0.5 border-t border-border pt-2 text-xs text-text-secondary">
              {chosen.lignes.map((l) => (
                <li key={l.libelle} className="flex justify-between gap-3">
                  <span>{l.libelle}</span>
                  <span className="tabular-nums">{formatFcfa(l.fcfa)}</span>
                </li>
              ))}
              {chosen.non_compris.map((n) => (
                <li key={n}>Non compris : {n}</li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-text-secondary">Votre demande est transmise à l’équipe Nouankany, qui vous contacte pour la livraison.</p>
        <MutationError error={siteError} />
      </div>
    </Modal>
  )
}
