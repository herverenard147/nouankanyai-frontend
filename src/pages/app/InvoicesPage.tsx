import { useState } from 'react'
import type { FormEvent } from 'react'

import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import { InvoicePhotoModal } from '@/components/upload/InvoicePhotoModal'
import { OcrFieldList } from '@/components/upload/OcrFieldList'
import { UploadCard } from '@/components/upload/UploadCard'
import {
  useAddManualInvoice,
  useConfirmInvoiceActual,
  useDeleteInvoice,
  useGenerateForecastInvoice,
  useInvoices,
  useUploadInvoicePhoto,
} from '@/hooks/queries/useInvoices'
import { ApiError } from '@/lib/apiClient'
import { useSessionStore } from '@/store/sessionStore'

export function InvoicesPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const invoicesQuery = useInvoices(profile!)
  const uploadMutation = useUploadInvoicePhoto(profile!)
  const forecastMutation = useGenerateForecastInvoice(profile!)
  const manualMutation = useAddManualInvoice(profile!)
  const confirmMutation = useConfirmInvoiceActual(profile!)
  const deleteMutation = useDeleteInvoice(profile!)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [actualAmount, setActualAmount] = useState('')
  const [viewingPhotoOf, setViewingPhotoOf] = useState<{ id: string; period: string } | null>(null)

  const [month, setMonth] = useState('')
  const [amount, setAmount] = useState('')
  const [kwh, setKwh] = useState('')

  if (!profile) return null

  function handleManualSubmit(event: FormEvent) {
    event.preventDefault()
    const amountXof = Number(amount)
    if (!month || !Number.isFinite(amountXof) || amountXof <= 0) return
    manualMutation.mutate(
      { month, amountXof, kwhConsumed: kwh ? Number(kwh) : undefined },
      { onSuccess: () => { setMonth(''); setAmount(''); setKwh('') } },
    )
  }

  function handleConfirmSubmit(event: FormEvent, billId: string) {
    event.preventDefault()
    const actualAmountXof = Number(actualAmount)
    if (!Number.isFinite(actualAmountXof) || actualAmountXof <= 0) return
    confirmMutation.mutate({ billId, actualAmountXof }, { onSuccess: () => { setConfirmingId(null); setActualAmount('') } })
  }

  return (
    <div className="flex flex-col gap-7">
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

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-section-title font-semibold text-text-primary">Générer une prévision de facture</h2>
          <p className="text-sm text-text-secondary">
            Basée sur l&rsquo;historique réel de vos factures (moyenne mobile, recalibrée à chaque écart mesuré).
          </p>
        </div>
        <Button type="button" variant="ghost" disabled={forecastMutation.isPending} onClick={() => forecastMutation.mutate()}>
          {forecastMutation.isPending ? 'Génération…' : 'Générer'}
        </Button>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-section-title font-semibold text-text-primary">Ajouter une facture manuellement</h2>
        <form onSubmit={handleManualSubmit} className="grid gap-3 sm:grid-cols-3">
          <TextField label="Mois" placeholder="Août 2026" value={month} onChange={(e) => setMonth(e.target.value)} required />
          <TextField label="Montant (FCFA)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <TextField label="Consommation (kWh)" type="number" value={kwh} onChange={(e) => setKwh(e.target.value)} />
          <Button type="submit" disabled={manualMutation.isPending} className="sm:col-span-3 sm:w-fit">
            {manualMutation.isPending ? 'Ajout…' : 'Ajouter'}
          </Button>
        </form>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Factures</h2>
        <MetricState status={invoicesQuery.status} isEmpty={invoicesQuery.data?.length === 0}>
          <div className="flex flex-col gap-4">
            {invoicesQuery.data?.map((invoice) => (
              <Card key={invoice.id} className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-text-primary">{invoice.period}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-text-secondary">
                      {invoice.status === 'traitee' ? 'Confirmée' : 'Prévision en attente de confirmation'}
                    </span>
                    {invoice.hasPhoto && (
                      <button
                        type="button"
                        onClick={() => setViewingPhotoOf({ id: invoice.id, period: invoice.period })}
                        className="focus-ring text-xs font-semibold text-accent-cta hover:underline"
                      >
                        Voir plus
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(invoice.id)}
                      className="focus-ring text-xs font-semibold text-alert hover:underline disabled:opacity-60"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <OcrFieldList fields={invoice.fields} />
                {invoice.status === 'en_cours' && (
                  <div className="border-t border-border pt-3">
                    {confirmingId === invoice.id ? (
                      <form onSubmit={(e) => handleConfirmSubmit(e, invoice.id)} className="flex flex-wrap items-end gap-2">
                        <TextField
                          label="Montant réel (FCFA)"
                          type="number"
                          value={actualAmount}
                          onChange={(e) => setActualAmount(e.target.value)}
                          required
                        />
                        <Button type="submit" disabled={confirmMutation.isPending}>
                          {confirmMutation.isPending ? 'Confirmation…' : 'Confirmer'}
                        </Button>
                      </form>
                    ) : (
                      <Button type="button" variant="ghost" onClick={() => setConfirmingId(invoice.id)}>
                        La vraie facture est arrivée — confirmer le montant
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </MetricState>
      </section>

      {viewingPhotoOf && (
        <InvoicePhotoModal
          billId={viewingPhotoOf.id}
          period={viewingPhotoOf.period}
          onClose={() => setViewingPhotoOf(null)}
        />
      )}
    </div>
  )
}
