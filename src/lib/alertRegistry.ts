import { levelAtLeast } from '@/lib/levelGating'
import type { BackendAlertEntry } from '@/types/backend'
import type { Level, Provenance } from '@/types/domain'

/**
 * Libellés du registre des alertes (GET /api/v1/alerts) et choix du volet « Qu'avez-vous fait ? ».
 * Les codes viennent du backend (app/alerts/registry.py) : ne pas les renommer ici.
 */

export function resolutionLabel(alert: BackendAlertEntry): string {
  if (alert.is_open) return 'En cours'
  switch (alert.resolution) {
    case 'nouankany':
      return 'Résolue par Nouankany (coupure à distance confirmée)'
    case 'intervention':
      return 'Résolue après intervention'
    case 'seule':
      return 'Revenue à la normale sans intervention'
    case 'fausse_alerte':
      return 'Fausse alerte'
    case 'remplacee':
      return 'Devenue une alerte'
    case 'arrivee':
      return 'Le dépassement prévu est arrivé'
    default:
      return closureLabel(alert)
  }
}

/** Ce qui a fermé l'alerte, tant que l'utilisateur n'a pas dit ce qu'il a fait. */
export function closureLabel(alert: BackendAlertEntry): string {
  if (alert.closure_trigger === 'verification') return 'Fermée après vérification, à documenter'
  if (alert.closure_trigger === 'commande') return 'Fermée après une coupure confirmée'
  if (alert.level === 'anticipee') return 'Le dépassement prévu n’est pas arrivé, à documenter'
  return 'Revenue à la normale seule, à documenter'
}

export function levelLabel(level: BackendAlertEntry['level']): string {
  if (level === 'a_verifier') return 'à vérifier'
  if (level === 'ecart_prevision') return 'écart à la prévision'
  if (level === 'anticipee') return 'dépassement prévu'
  return 'alerte'
}

export interface Choice<T extends string = string> {
  value: T
  label: string
}

/** Problèmes proposés quand l'utilisateur a fait quelque chose. */
export function problemChoices(alert: BackendAlertEntry): Choice[] {
  if (alert.kind === 'ecart_prevision') {
    return [
      { value: 'nouvel_appareil', label: 'Un nouvel appareil branché' },
      { value: 'usage_exceptionnel', label: 'Un usage exceptionnel (production, horaires prolongés)' },
      { value: 'panne', label: 'Une panne de l’appareil' },
      { value: 'chaleur', label: 'Une forte chaleur' },
      { value: 'erreur_mesure', label: 'Une erreur de mesure' },
      { value: 'inconnu', label: 'Je ne sais pas' },
    ]
  }
  return [
    { value: 'cause_indiquee', label: alert.reco.cause ? `La cause indiquée : ${alert.reco.cause}` : 'La cause indiquée' },
    { value: 'autre_cause', label: 'Une autre cause' },
    { value: 'fausse_alerte', label: 'Une fausse alerte (capteur ou mesure erronée)' },
    { value: 'inconnu', label: 'Je ne sais pas' },
  ]
}

/** Quand rien n'a été fait : un pic passager, ou une fausse alerte. */
export const NOTHING_DONE_CHOICES: Choice[] = [
  { value: 'inconnu', label: 'Je ne sais pas, c’est revenu tout seul' },
  { value: 'fausse_alerte', label: 'C’était une fausse alerte' },
]

export const ACTION_CHOICES: Choice<'reco_suivie' | 'autre_action' | 'technicien'>[] = [
  { value: 'reco_suivie', label: 'J’ai suivi la recommandation' },
  { value: 'autre_action', label: 'J’ai fait autre chose' },
  { value: 'technicien', label: 'Un technicien est intervenu' },
]

export const USEFUL_CHOICES: Choice<'oui' | 'en_partie' | 'non'>[] = [
  { value: 'oui', label: 'Oui' },
  { value: 'en_partie', label: 'En partie' },
  { value: 'non', label: 'Non' },
]

/** Ce que le volet de retour montre selon le niveau d'affichage : les étapes conseillées dès « amateur », le coût et
 * la durée d'arrêt au niveau « technique ». */
export function feedbackFieldsForLevel(level: Level): { showSteps: boolean; showCostAndDowntime: boolean } {
  return { showSteps: levelAtLeast(level, 'amateur'), showCostAndDowntime: levelAtLeast(level, 'technique') }
}

/** Provenance affichée d'une alerte : celle de la mesure qui l'a fermée, sinon celle qui l'a ouverte. */
export function alertProvenance(alert: BackendAlertEntry): Provenance | null {
  const p = alert.closure_provenance ?? alert.opened_provenance
  if (p === 'mesure') return 'mesure'
  if (p === 'simulation') return 'synthetique'
  return null
}
