import type { ReactNode } from 'react'

import { formatFcfa } from '@/lib/formatters'
import type { BackendBillingStatement } from '@/types/backend'

export const STATEMENT_STATUS_LABEL: Record<BackendBillingStatement['status'], string> = {
  en_attente_facture: 'En attente de la facture CIE',
  a_payer: 'À payer',
  paye: 'Payé',
}

/** Relevés mensuels avec le détail du calcul, tel que le serveur l'a fait (règle d'or : le client voit
 * comment on arrive au montant). `action` permet à l'admin d'ajouter « Marquer payé ». */
export function StatementList({ statements, action }: { statements: BackendBillingStatement[]; action?: (s: BackendBillingStatement) => ReactNode }) {
  return (
    <ul className="flex flex-col">
      {statements.map((s) => (
        <li key={s.id} className="flex flex-col gap-2 border-t border-border py-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-text-primary">{s.month}</span>
            <span className="tabular-nums text-text-primary">{s.total_fcfa !== null ? formatFcfa(s.total_fcfa) : 'Non calculé'}</span>
            <span className={`text-xs font-semibold ${s.status === 'a_payer' ? 'text-alert' : 'text-text-secondary'}`}>{STATEMENT_STATUS_LABEL[s.status]}</span>
          </div>
          {s.detail.etapes && (
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-text-secondary">
              {s.detail.etapes.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {s.detail.raison && <p className="text-text-secondary">{s.detail.raison}</p>}
          {s.detail.palier_nom && <p className="text-text-secondary">Abonnement {s.detail.palier_nom}</p>}
          {action?.(s)}
        </li>
      ))}
    </ul>
  )
}
