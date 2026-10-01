import {
  rawAdminUpdateUserProfile,
  rawAdminResetPassword,
  rawDeleteUser,
  rawPlatformAlerts,
  rawSuspendUser,
  rawUserAlerts,
  rawUserPredictions,
} from '@/api/rawBackend'
import { formatFcfaAmount } from '@/api/backendHelpers'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import { formatNumberFr } from '@/lib/formatters'
import type { AdminMachinePrediction } from '@/types/domain'
import type { BackendRecommendation, BackendPlatformAlertItem } from '@/types/backend'

export function suspendUser(targetUserId: string, suspended: boolean) {
  return rawSuspendUser(targetUserId, suspended)
}

export function deleteUser(targetUserId: string) {
  return rawDeleteUser(targetUserId)
}

export function resetUserPassword(targetUserId: string, newPassword: string) {
  return rawAdminResetPassword(targetUserId, newPassword)
}

export function updateUserProfile(targetUserId: string, nom: string) {
  return rawAdminUpdateUserProfile(targetUserId, nom)
}

/** Prédiction compacte (valeur à l'heure suivante) par équipement — vue support, pas le
 * détail complet de la page Prédiction du compte lui-même. */
export async function fetchUserPredictions(targetUserId: string): Promise<AdminMachinePrediction[]> {
  const { machines } = await rawUserPredictions(targetUserId)
  return machines.map((m) => {
    const first = m.predictions?.[0]
    return {
      machineId: m.machine_id,
      nom: m.nom,
      nextHourValue: first ? `${formatNumberFr(first.predicted_kw, 1)} kW` : null,
      error: m.error ?? null,
    }
  })
}

export interface AdminAlertItem {
  id: string
  title: string
  detail: string
  severityOrGain: string
  provenance: 'synthetique'
  ownerNom?: string
}

function toAlertItem(rec: BackendRecommendation, i: number, ownerNom?: string): AdminAlertItem {
  return {
    id: `${rec.machine_id}-${rec.type}-${i}`,
    title: rec.title,
    detail: frenchNumbersWithUnits(rec.description),
    severityOrGain: rec.gain_fcfa > 0 ? `−${formatFcfaAmount(rec.gain_fcfa)}` : rec.severity,
    provenance: 'synthetique',
    ownerNom,
  }
}

/** Alertes/recommandations du compte d'un utilisateur — vue support en lecture seule. */
export async function fetchUserAlerts(targetUserId: string): Promise<AdminAlertItem[]> {
  const { recommendations } = await rawUserAlerts(targetUserId)
  return recommendations.map((rec, i) => toAlertItem(rec, i))
}

/** Alertes agrégées de toute la plateforme (tous comptes), pour la Vue d'ensemble et la
 * page Alertes de l'Admin — remplace l'ancien scope erroné (compte Admin lui-même, qui n'a
 * pas d'équipement en propre, voir api/alerts.ts). */
export async function fetchPlatformAlerts(): Promise<AdminAlertItem[]> {
  const { recommendations } = await rawPlatformAlerts()
  return recommendations.map((rec: BackendPlatformAlertItem, i) => toAlertItem(rec, i, rec.owner_nom))
}
