import { useState } from 'react'
import type { FormEvent } from 'react'

import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, ConfirmEditModal, Modal, MutationError, type FieldChange } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { InvoicePhotoModal } from '@/components/upload/InvoicePhotoModal'
import { OcrFieldList } from '@/components/upload/OcrFieldList'
import { UploadCard } from '@/components/upload/UploadCard'
import {
  useAddManualInvoice,
  useAttachInvoicePhoto,
  useConfirmInvoiceActual,
  useDeleteInvoice,
  useGenerateForecastInvoice,
  useInvoices,
  useUpdateInvoice,
  useUploadInvoicePhoto,
} from '@/hooks/queries/useInvoices'
import { ApiError } from '@/lib/apiClient'
import { formatFcfa, formatNumberFr, NARROW_NBSP } from '@/lib/formatters'
import { useSessionStore } from '@/store/sessionStore'
import type { InvoiceRecord } from '@/types/domain'

type Dialog =
  | { kind: 'add' }
  | { kind: 'edit'; invoice: InvoiceRecord; step: 'form' | 'confirm' }
  | { kind: 'delete'; invoice: InvoiceRecord }

/**
 * Factures : ajout manuel (modale), modification (modale + validation avant → après), suppression (modale de
 * validation). Photo et prévision gardent leur parcours. Voir DESIGN.md §8.
 */
export function InvoicesPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const invoicesQuery = useInvoices(profile!)
  const uploadMutation = useUploadInvoicePhoto(profile!)
  const forecastMutation = useGenerateForecastInvoice(profile!)
  const manualMutation = useAddManualInvoice(profile!)
  const updateMutation = useUpdateInvoice(profile!)
  const confirmMutation = useConfirmInvoiceActual(profile!)
  const deleteMutation = useDeleteInvoice(profile!)
  const attachMutation = useAttachInvoicePhoto(profile!)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [actualAmount, setActualAmount] = useState('')
  const [viewingPhotoOf, setViewingPhotoOf] = useState<{ id: string; period: string } | null>(null)

  const [month, setMonth] = useState('')
  const [amount, setAmount] = useState('')
  const [kwh, setKwh] = useState('')
  const [bimonthly, setBimonthly] = useState(false)

  if (!profile) return null

  function openAdd() {
    setMonth('')
    setAmount('')
    setKwh('')
    setBimonthly(false)
    manualMutation.reset()
    setDialog({ kind: 'add' })
  }

  function openEdit(invoice: InvoiceRecord) {
    setMonth(invoice.raw.month)
    setAmount(invoice.raw.amountXof != null ? String(invoice.raw.amountXof) : '')
    setKwh(invoice.raw.kwhConsumed != null ? String(invoice.raw.kwhConsumed) : '')
    updateMutation.reset()
    setDialog({ kind: 'edit', invoice, step: 'form' })
  }

  function handleAddSubmit(event: FormEvent) {
    event.preventDefault()
    const amountXof = Number(amount)
    if (!month || !Number.isFinite(amountXof) || amountXof <= 0) return
    manualMutation.mutate(
      { month, amountXof, kwhConsumed: kwh ? Number(kwh) : undefined, periodMonths: bimonthly ? 2 : 1 },
      { onSuccess: () => setDialog(null) },
    )
  }

  function handleConfirmSubmit(event: FormEvent, billId: string) {
    event.preventDefault()
    const actualAmountXof = Number(actualAmount)
    if (!Number.isFinite(actualAmountXof) || actualAmountXof <= 0) return
    confirmMutation.mutate({ billId, actualAmountXof }, { onSuccess: () => { setConfirmingId(null); setActualAmount('') } })
  }

  function editChanges(invoice: InvoiceRecord): FieldChange[] {
    const before = invoice.raw
    return [
      { label: 'Mois', before: before.month, after: month },
      { label: 'Montant TTC', before: before.amountXof != null ? formatFcfa(before.amountXof) : '', after: amount ? formatFcfa(Number(amount)) : '' },
      {
        label: 'Consommation',
        before: before.kwhConsumed != null ? `${formatNumberFr(before.kwhConsumed)}${NARROW_NBSP}kWh` : '',
        after: kwh ? `${formatNumberFr(Number(kwh))}${NARROW_NBSP}kWh` : '',
      },
    ].filter((change) => change.before !== change.after)
  }

  const monthAmountKwhFields = (
    <div className="grid gap-3 sm:grid-cols-3">
      <TextField label="Mois" type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
      <TextField label="Montant TTC (FCFA)" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField label="Consommation (kWh)" type="number" min="0" value={kwh} onChange={(e) => setKwh(e.target.value)} />
    </div>
  )

  return (
    <div className="flex flex-col gap-7">
      <div className="grid gap-7 lg:grid-cols-3 lg:gap-8">
        <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
          <UploadCard
            title="Ajouter une facture par photo"
            caption="Photographiez votre facture CIE : le mois, le montant et la consommation sont extraits automatiquement."
            onFileSelected={(file) => uploadMutation.mutate(file)}
            isUploading={uploadMutation.isPending}
          />
          {uploadMutation.isError && (
            <ApiErrorMessage
              message={uploadMutation.error instanceof ApiError ? uploadMutation.error.message : "Échec de l'envoi de la photo."}
              className="text-sm text-alert"
            />
          )}
        </section>
        <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
          <h2 className="text-section-title font-semibold text-text-primary">Générer une prévision de facture</h2>
          <p className="text-sm text-text-secondary">
            Basée sur l&rsquo;historique réel de vos factures (moyenne mobile, recalibrée à chaque écart mesuré).
          </p>
          <Button type="button" variant="outline" className="w-fit" disabled={forecastMutation.isPending} onClick={() => forecastMutation.mutate()}>
            {forecastMutation.isPending ? 'Génération…' : 'Générer'}
          </Button>
        </section>
        <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
          <h2 className="text-section-title font-semibold text-text-primary">Ajouter une facture manuellement</h2>
          <p className="text-sm text-text-secondary">Saisissez le mois, le montant et la consommation d’une facture que vous avez déjà reçue.</p>
          <Button type="button" className="w-fit" onClick={openAdd}>
            Ajouter une facture
          </Button>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Factures</h2>
        <MetricState status={invoicesQuery.status} isEmpty={invoicesQuery.data?.length === 0}>
          <div className="flex flex-col border-t-2 border-text-primary">
            {invoicesQuery.data?.map((invoice) => (
              <article key={invoice.id} className="flex flex-col gap-3 border-b border-border py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-text-primary">{invoice.period}</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xs font-semibold text-text-secondary">
                      {invoice.isForecast
                        ? invoice.status === 'traitee' ? 'Confirmée' : 'Prévision en attente de confirmation'
                        : invoice.validationLabel}
                    </span>
                    {!invoice.isForecast && !invoice.hasPhoto && !invoice.locked && (
                      <label className="focus-ring cursor-pointer text-sm font-semibold text-accent-cta hover:underline">
                        {attachMutation.isPending && attachMutation.variables?.billId === invoice.id ? 'Envoi…' : 'Joindre le justificatif'}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          aria-label={`Joindre la photo de la facture ${invoice.period}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) attachMutation.mutate({ billId: invoice.id, file })
                            e.target.value = ''
                          }}
                        />
                      </label>
                    )}
                    {invoice.hasPhoto && (
                      <button
                        type="button"
                        onClick={() => setViewingPhotoOf({ id: invoice.id, period: invoice.period })}
                        className="focus-ring text-sm font-semibold text-accent-cta hover:underline"
                      >
                        Voir plus
                      </button>
                    )}
                    {!invoice.isForecast && !invoice.locked && (
                      <button type="button" onClick={() => openEdit(invoice)} className="focus-ring text-sm font-semibold text-accent-cta hover:underline" aria-label={`Modifier la facture ${invoice.period}`}>
                        Modifier
                      </button>
                    )}
                    {!invoice.locked && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteMutation.reset()
                          setDialog({ kind: 'delete', invoice })
                        }}
                        className="focus-ring text-sm font-semibold text-alert hover:underline"
                        aria-label={`Supprimer la facture ${invoice.period}`}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
                <OcrFieldList fields={invoice.fields} />
                {attachMutation.isError && attachMutation.variables?.billId === invoice.id && <MutationError error={attachMutation.error} />}
                {invoice.status === 'en_cours' && (
                  <div className="border-t border-border pt-3">
                    {confirmingId === invoice.id ? (
                      <form onSubmit={(e) => handleConfirmSubmit(e, invoice.id)} className="flex flex-wrap items-end gap-2">
                        <TextField label="Montant réel (FCFA)" type="number" value={actualAmount} onChange={(e) => setActualAmount(e.target.value)} required />
                        <Button type="submit" disabled={confirmMutation.isPending}>
                          {confirmMutation.isPending ? 'Confirmation…' : 'Confirmer'}
                        </Button>
                      </form>
                    ) : (
                      <Button type="button" variant="outline" onClick={() => setConfirmingId(invoice.id)}>
                        La vraie facture est arrivée, confirmer le montant
                      </Button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </MetricState>
      </section>

      {dialog?.kind === 'add' && (
        <Modal
          title="Ajouter une facture"
          description="Saisie manuelle d’une facture que vous avez déjà reçue."
          onClose={() => setDialog(null)}
          width="lg"
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button type="submit" form="invoice-add-form" disabled={manualMutation.isPending}>
                {manualMutation.isPending ? 'Ajout…' : 'Ajouter la facture'}
              </Button>
            </>
          }
        >
          <form id="invoice-add-form" onSubmit={handleAddSubmit} className="flex flex-col gap-3">
            {monthAmountKwhFields}
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input type="checkbox" checked={bimonthly} onChange={(e) => setBimonthly(e.target.checked)} />
              Facture bimestrielle (couvre ce mois et le suivant)
            </label>
            <p className="text-xs text-text-secondary">
              Joignez ensuite la photo de la facture : elle n’entre dans vos relevés Nouankany qu’une fois validée par notre équipe.
              Cette action sera enregistrée dans l’onglet Audit.
            </p>
            <MutationError error={manualMutation.error} />
          </form>
        </Modal>
      )}

      {dialog?.kind === 'edit' && dialog.step === 'form' && (
        <Modal
          title={`Modifier la facture ${dialog.invoice.period}`}
          description="Corrigez une erreur de saisie."
          onClose={() => setDialog(null)}
          width="lg"
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button type="submit" form="invoice-edit-form">
                Enregistrer
              </Button>
            </>
          }
        >
          <form
            id="invoice-edit-form"
            onSubmit={(event) => {
              event.preventDefault()
              setDialog({ ...dialog, step: 'confirm' })
            }}
          >
            {monthAmountKwhFields}
          </form>
        </Modal>
      )}

      {dialog?.kind === 'edit' && dialog.step === 'confirm' && (
        <ConfirmEditModal
          subject={`Vous allez modifier la facture ${dialog.invoice.period}.`}
          changes={editChanges(dialog.invoice)}
          pending={updateMutation.isPending}
          error={updateMutation.error}
          onBack={() => setDialog({ ...dialog, step: 'form' })}
          onConfirm={() =>
            updateMutation.mutate(
              { billId: dialog.invoice.id, payload: { month, amountXof: Number(amount), kwhConsumed: kwh ? Number(kwh) : undefined } },
              { onSuccess: () => setDialog(null) },
            )
          }
        />
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmDeleteModal
          title={`Supprimer la facture ${dialog.invoice.period} ?`}
          consequences={[
            ...(dialog.invoice.raw.amountXof != null
              ? [`Montant : ${formatFcfa(dialog.invoice.raw.amountXof)}${dialog.invoice.raw.kwhConsumed != null ? ` · ${formatNumberFr(dialog.invoice.raw.kwhConsumed)}${NARROW_NBSP}kWh` : ''}.`]
              : []),
            'Les prévisions de facture seront recalculées sans ce mois.',
          ]}
          pending={deleteMutation.isPending}
          error={deleteMutation.error}
          onCancel={() => setDialog(null)}
          onConfirm={() => deleteMutation.mutate(dialog.invoice.id, { onSuccess: () => setDialog(null) })}
        />
      )}

      {viewingPhotoOf && (
        <InvoicePhotoModal billId={viewingPhotoOf.id} period={viewingPhotoOf.period} onClose={() => setViewingPhotoOf(null)} />
      )}
    </div>
  )
}
