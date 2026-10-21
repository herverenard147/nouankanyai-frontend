import type { ReactNode } from 'react'

import { formatFcfa, formatMonth } from '@/lib/formatters'
import type { BackendBillingStatement } from '@/types/backend'

export const STATEMENT_STATUS_LABEL: Record<BackendBillingStatement['status'], string> = {
  en_attente_facture: 'En attente de la facture CIE',
  indicatif: 'Relevé indicatif',
  a_payer: 'À payer',
  paye: 'Payé',
  reporte: 'Reportée sur la part suivante',
  remplacee: 'Remplacée par la part de la facture',
  avoir: 'Avoir, déduit de la part suivante',
}

/** Titre d'un relevé : la période d'une part (1 ou 2 mois, comme la facture CIE), les frais d'audit, ou le mois. */
function title(s: BackendBillingStatement): string {
  if (s.kind === 'audit') return 'Frais d’audit'
  if (s.kind === 'part' || s.kind === 'part_provisoire') {
    const period = s.detail.periode ?? (s.periode_debut && s.periode_debut !== s.periode_fin
      ? `${formatMonth(s.periode_debut)} et ${formatMonth(s.periode_fin ?? s.month)}`
      : formatMonth(s.month))
    return `${s.kind === 'part_provisoire' ? 'Part provisoire' : 'Part des économies'} : ${period}`
  }
  return formatMonth(s.month)
}

/** Relevés avec le détail du calcul, tel que le serveur l'a fait (règle d'or : le client voit
 * comment on arrive au montant). `action` permet à l'admin d'ajouter « Marquer payé ». */
export function StatementList({ statements, action }: { statements: BackendBillingStatement[]; action?: (s: BackendBillingStatement) => ReactNode }) {
  return (
    <ul className="flex flex-col">
      {statements.map((s) => (
        <li key={s.id} id={`releve-${s.id}`} className="flex flex-col gap-2 border-t border-border py-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-text-primary">{title(s)}</span>
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
          {s.status === 'a_payer' && s.due_at && (
            <p className="text-xs text-text-secondary">
              À régler avant le {new Date(s.due_at).toLocaleDateString('fr-FR')}.
              {(s.kind === 'part' || s.kind === 'part_provisoire') && !s.report_fcfa
                ? ' Sans paiement, ce montant s’ajoute à la part suivante ; deux parts impayées de suite suspendent les services.'
                : ''}
            </p>
          )}
          {s.detail.mention && <p className="text-xs font-semibold text-text-secondary">{s.detail.mention}</p>}
          {s.detail.bareme_a_confirmer && s.detail.bareme_note && <p className="text-xs text-text-secondary">{s.detail.bareme_note}</p>}
          {s.detail.palier_nom && <p className="text-text-secondary">Abonnement {s.detail.palier_nom}</p>}
          {action?.(s)}
        </li>
      ))}
    </ul>
  )
}
