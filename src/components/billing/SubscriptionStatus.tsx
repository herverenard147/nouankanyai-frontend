import { formatFcfa } from '@/lib/formatters'
import type { BackendSubscription } from '@/types/backend'

const MODES: Record<string, string> = {
  especes: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  moov_money: 'Moov Money',
  virement: 'Virement',
  autre: 'Autre',
}
export const SUBSCRIPTION_MODES = Object.entries(MODES).map(([value, label]) => ({ value, label }))
const day = (iso: string) => new Date(iso).toLocaleDateString('fr-FR')

/**
 * Abonnement payé d'avance (décision du propriétaire, 2026-10-21) : 30 jours à partir du paiement, ou à la suite de la
 * période en cours s'il arrive avant sa fin. Un retard ne fait jamais payer les jours sans abonnement.
 */
export function SubscriptionStatus({ abonnement, menage = false }: { abonnement: BackendSubscription; menage?: boolean }) {
  if (abonnement.montant_fcfa === null && abonnement.paiements.length === 0) return null
  const lapsedEffect = menage
    ? 'votre formule repasse en Découverte jusqu’au paiement'
    : 'les analyses, l’assistant, les alertes, les prévisions et les boîtiers sont suspendus jusqu’au paiement'
  return (
    <div className="flex flex-col gap-2" id="abonnement">
      {abonnement.actif && abonnement.jusqu_au ? (
        <p className="text-sm text-text-primary" role="status">
          Abonnement payé jusqu’au <strong>{day(abonnement.jusqu_au)}</strong> ({abonnement.jours_restants} jour
          {abonnement.jours_restants > 1 ? 's' : ''}). Renouvelé avant cette date, la nouvelle période suit l’actuelle, sans perdre un
          jour.
        </p>
      ) : (
        <p className={`text-sm ${abonnement.exige ? 'text-alert' : 'text-text-secondary'}`} role="status">
          {abonnement.termine_le ? `Abonnement terminé le ${day(abonnement.termine_le)}. ` : 'Aucun paiement d’abonnement enregistré. '}
          {abonnement.exige
            ? `Sans abonnement, ${lapsedEffect} ; votre historique, vos factures et vos relevés restent accessibles. `
            : ''}
          Dès le paiement{abonnement.montant_fcfa ? ` (${formatFcfa(abonnement.montant_fcfa)})` : ''}, {abonnement.duree_jours} jours
          commencent à la date du paiement : les jours sans abonnement ne sont pas facturés.
        </p>
      )}
      {abonnement.paiements.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-text-secondary">
          {abonnement.paiements.slice(0, 6).map((p) => (
            <li key={p.id} className="tabular-nums">
              Payé le {day(p.paye_le)} ({MODES[p.mode] ?? p.mode}) : {formatFcfa(p.montant_fcfa)}, du {day(p.debut)} au {day(p.fin)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
