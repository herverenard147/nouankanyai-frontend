import { LIMITS } from '@/lib/validation'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, Modal, MutationError } from '@/components/ui/Modal'
import { RequiredMark, TextField } from '@/components/ui/TextField'
import { useBoitiers } from '@/hooks/queries/useBoitiers'
import { useCreateSite, useDeleteSite, useSetSiteSubscription, useSites } from '@/hooks/queries/useSites'
import { formatNumberFr } from '@/lib/formatters'
import type { BackendSite, SubscriptionUnit } from '@/types/backend'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'

/** Sites d'un compte PME ou Industrie : liste, ajout, suppression confirmée (DELETE /api/sites/{id}).
 * Les machines du site sont détachées, pas supprimées ; les boîtiers du site sont déconnectés
 * (un boîtier de site n'écoute que ce lieu), et le modal de validation les nomme. */
export function SitesCard() {
  const query = useSites()
  const createMutation = useCreateSite()
  const deleteMutation = useDeleteSite()
  const boitiers = useBoitiers()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ nom: '', localisation: '' })
  const [removing, setRemoving] = useState<{ id: string; nom: string } | null>(null)
  const [subscribing, setSubscribing] = useState<BackendSite | null>(null)

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
                <p className="text-sm text-text-secondary">
                  Puissance souscrite :{' '}
                  {site.souscription_valeur && site.souscription_unite ? (
                    <span className="font-semibold text-text-primary">
                      {formatNumberFr(site.souscription_valeur, site.souscription_valeur < 10 ? 1 : 0)} {site.souscription_unite}
                      {site.souscription_unite !== 'kW' && site.souscription_kw ? `, soit environ ${formatNumberFr(site.souscription_kw, 1)} kW` : ''}
                    </span>
                  ) : (
                    'non renseignée'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className="focus-ring text-sm font-semibold text-accent-cta hover:underline"
                  aria-label={`Puissance souscrite du site ${site.nom}`}
                  onClick={() => setSubscribing(site)}
                >
                  Puissance souscrite
                </button>
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
              </div>
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
              <Button loading={createMutation.isPending} type="submit" form="site-form" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Ajout…' : 'Ajouter le site'}
              </Button>
            </>
          }
        >
          <form id="site-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
            <TextField label="Nom" maxLength={LIMITS.name} value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
            <TextField label="Localisation" maxLength={LIMITS.location} value={form.localisation} onChange={(e) => setForm((f) => ({ ...f, localisation: e.target.value }))} required />
            <MutationError error={createMutation.error} />
          </form>
        </Modal>
      )}

      {subscribing && <SubscriptionModal site={subscribing} onClose={() => setSubscribing(null)} />}

      {removing && (
        <ConfirmDeleteModal
          title={`Supprimer le site « ${removing.nom} » ?`}
          consequences={[
            'Ses équipements restent dans votre compte, sans site.',
            ...(boitiers.data ?? [])
              .filter((row) => row.device.scope === 'site' && row.device.site_id === removing.id)
              .map((row) => `Le boîtier « ${row.device.nom} » sera déconnecté : il ne répondra plus et ne pourra plus éteindre d’appareil. Pour le réutiliser, il faudra demander un nouveau code.`),
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

const UNITS: { value: SubscriptionUnit; label: string }[] = [
  { value: 'A', label: 'Ampères (A) : réglage du disjoncteur, basse tension' },
  { value: 'kVA', label: 'kVA' },
  { value: 'kW', label: 'kW : moyenne tension' },
]

/** Puissance souscrite telle qu'elle figure sur la facture CIE. Le pic de puissance de Conso & coûts la compare aux pics mesurés. */
function SubscriptionModal({ site, onClose }: { site: BackendSite; onClose: () => void }) {
  const mutation = useSetSiteSubscription()
  const [valeur, setValeur] = useState(site.souscription_valeur ? String(site.souscription_valeur).replace('.', ',') : '')
  const [unite, setUnite] = useState<SubscriptionUnit>(site.souscription_unite ?? 'kW')
  const [cosPhi, setCosPhi] = useState(site.cos_phi ? String(site.cos_phi).replace('.', ',') : '')
  const toNumber = (text: string) => (text.trim() === '' ? null : Number(text.replace(',', '.')))

  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({ siteId: site.id, valeur: toNumber(valeur), unite: toNumber(valeur) === null ? null : unite, cos_phi: unite === 'kW' ? null : toNumber(cosPhi) }, { onSuccess: onClose })
  }

  return (
    <Modal
      title={`Puissance souscrite du site « ${site.nom} »`}
      description="Elle figure sur votre facture CIE. Le pic de puissance de Conso & coûts la compare à vos pics mesurés."
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button loading={mutation.isPending} type="submit" form="souscription-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <form id="souscription-form" onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Valeur"
            inputMode="decimal"
            pattern="[0-9]+([,.][0-9]+)?"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            required={site.souscription_valeur == null}
          />
          <div className="flex h-full flex-col gap-1.5">
            <div className="flex flex-1 items-end gap-1">
              <label htmlFor="souscription-unite" className="text-sm font-medium text-text-primary">
                Unité
              </label>
              <RequiredMark />
            </div>
            <select
              id="souscription-unite"
              value={unite}
              onChange={(e) => setUnite(e.target.value as SubscriptionUnit)}
              className="focus-ring min-h-11 rounded-control border border-border bg-card px-3 text-sm"
              required
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {unite !== 'kW' && (
          <TextField
            label="Facteur de puissance (cos φ), facultatif"
            inputMode="decimal"
            pattern="0([,.][0-9]+)?|1"
            placeholder="0,9 si vous ne le connaissez pas"
            value={cosPhi}
            onChange={(e) => setCosPhi(e.target.value)}
          />
        )}
        <p className="text-sm text-text-secondary">
          {unite === 'A'
            ? 'En basse tension, la CIE souscrit l’ampérage du disjoncteur : 10 A font 2,2 kVA (ampères × 220 / 1000).'
            : unite === 'kVA'
              ? 'Les kVA sont ramenés en kW par le cos φ (0,9 si vous ne le connaissez pas).'
              : 'En moyenne tension, la puissance souscrite est en kW sur le contrat et la facture.'}{' '}
          {site.souscription_valeur != null && 'Videz la valeur pour l’effacer.'}
        </p>
        <MutationError error={mutation.error} />
      </form>
    </Modal>
  )
}
