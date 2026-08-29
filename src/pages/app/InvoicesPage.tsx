import { useState } from 'react'
import type { FormEvent } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import { OcrFieldList } from '@/components/upload/OcrFieldList'
import { UploadCard } from '@/components/upload/UploadCard'
import { useAddManualInvoice, useConfirmInvoiceActual, useGenerateForecastInvoice, useInvoices } from '@/hooks/queries/useInvoices'
import { useSessionStore } from '@/store/sessionStore'

export function InvoicesPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const invoicesQuery = useInvoices(profile!)
  const forecastMutation = useGenerateForecastInvoice(profile!)
  const manualMutation = useAddManualInvoice(profile!)
  const confirmMutation = useConfirmInvoiceActual(profile!)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [actualAmount, setActualAmount] = useState('')

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
      {/*
        L'upload de facture par photo (OCR Gemini) sera remplacé par le pipeline
        ReceiptFlow, pas encore branché. En attendant : une vraie prévision
        statistique côté backend, et une saisie manuelle.
      */}
      <UploadCard
        title="Générer une prévision de facture"
        caption="Basée sur l'historique réel de vos factures (moyenne mobile, recalibrée à chaque écart mesuré)."
        onUpload={() => forecastMutation.mutate()}
        isUploading={forecastMutation.isPending}
      />

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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">{invoice.period}</h3>
                  <span className="text-xs font-semibold text-text-secondary">
                    {invoice.status === 'traitee' ? 'Confirmée' : 'Prévision en attente de confirmation'}
                  </span>
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
    </div>
  )
}
