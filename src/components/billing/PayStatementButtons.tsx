import { useState } from 'react'

import type { PaymentMethod } from '@/api/rawBackend'
import { Button } from '@/components/ui/Button'
import { MutationError } from '@/components/ui/Modal'
import { usePayStatement } from '@/hooks/queries/usePaiement'

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'wave', label: 'Wave' },
  { id: 'orange', label: 'Orange Money' },
  { id: 'mtn', label: 'MTN Mobile Money' },
  { id: 'moov', label: 'Moov Money' },
  { id: 'djamo', label: 'Djamo' },
]

/** Choix du moyen de paiement d'un relevé « à payer ». Le moyen est fixé à la création de la demande chez Jèko : la page
 * de paiement ne le propose pas. Le montant n'est jamais envoyé : le serveur le lit sur le relevé. */
export function PayStatementButtons({ statementId }: { statementId: string }) {
  const pay = usePayStatement()
  const [chosen, setChosen] = useState<PaymentMethod | null>(null)
  return (
    <div className="flex flex-col gap-2" aria-label="Payer ce relevé">
      <p className="text-xs font-semibold text-text-secondary">Payer avec :</p>
      <div className="flex flex-wrap gap-2">
        {METHODS.map((m) => (
          <Button
            key={m.id}
            type="button"
            variant="outline"
            loading={pay.isPending && chosen === m.id}
            disabled={pay.isPending}
            onClick={() => {
              setChosen(m.id)
              pay.mutate({ statementId, method: m.id })
            }}
          >
            {m.label}
          </Button>
        ))}
      </div>
      <MutationError error={pay.error} />
    </div>
  )
}
