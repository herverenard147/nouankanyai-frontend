import {
  rawAdminResetMachine,
  rawAdminTestMachine,
  rawAdminUpdateUserProfile,
  rawAdminResetPassword,
  rawDeleteUser,
  rawPlatformAlerts,
  rawPlatformConsumption,
  rawPlatformPredictions,
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
  machineId: string
  /** true pour "alerte" (anomalie/surchauffe/vibration) : seules celles-là ont une action de
   * vérification qui a un sens — jamais pour une optimisation/efficacité, qui n'est qu'une suggestion. */
  actionable: boolean
}

function toAlertItem(rec: BackendRecommendation, i: number, ownerNom?: string): AdminAlertItem {
  return {
    id: `${rec.machine_id}-${rec.type}-${i}`,
    title: rec.title,
    detail: frenchNumbersWithUnits(rec.description),
    severityOrGain: rec.gain_fcfa > 0 ? `−${formatFcfaAmount(rec.gain_fcfa)}` : rec.severity,
    provenance: 'synthetique',
    ownerNom,
    machineId: rec.machine_id,
    actionable: rec.type === 'alerte',
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

export interface AdminPlatformPredictionRow {
  ownerId: string
  ownerNom: string
  /** Somme des prédictions « heure suivante » de ses équipements, `null` si aucune n'a pu être calculée. */
  totalNextHourKw: number | null
  machines: AdminMachinePrediction[]
}

/** Prédictions agrégées de toute la plateforme, par utilisateur — remplace l'ancien scope
 * erroné (compte Admin lui-même, sans équipement propre) sur la page Prédiction de l'Admin,
 * même correction que fetchPlatformAlerts. */
export async function fetchPlatformPredictions(): Promise<AdminPlatformPredictionRow[]> {
  // hours_ahead=1 : seule la valeur « heure suivante » est affichée ici (voir nextHourValue/
  // totalNextHourKw ci-dessous) — demander les 24h par défaut forcerait le backend à calculer
  // 24× plus de points par équipement pour rien, sur un endpoint qui itère déjà tous les comptes.
  const { users } = await rawPlatformPredictions(1)
  return users.map((u) => {
    const machines = u.machines.map((m) => {
      const first = m.predictions?.[0]
      return {
        machineId: m.machine_id,
        nom: m.nom,
        nextHourValue: first ? `${formatNumberFr(first.predicted_kw, 1)} kW` : null,
        error: m.error ?? null,
      }
    })
    const values = u.machines.map((m) => m.predictions?.[0]?.predicted_kw).filter((v): v is number => v !== undefined)
    return {
      ownerId: u.owner_id,
      ownerNom: u.owner_nom,
      totalNextHourKw: values.length ? values.reduce((sum, v) => sum + v, 0) : null,
      machines,
    }
  })
}

export interface AdminPlatformConsumptionRow {
  ownerId: string
  ownerNom: string
  powerKw: number
  machinesCount: number
  percent: number
}

/** Répartition de la puissance active actuelle de la plateforme, par compte — même correction
 * que fetchPlatformAlerts/fetchPlatformPredictions, pour la page Conso & coûts de l'Admin. */
export async function fetchPlatformConsumption(): Promise<{ totalPowerKw: number; rows: AdminPlatformConsumptionRow[] }> {
  const data = await rawPlatformConsumption()
  return {
    totalPowerKw: data.total_power_kw,
    rows: data.users.map((u) => ({
      ownerId: u.owner_id,
      ownerNom: u.owner_nom,
      powerKw: u.power_kw,
      machinesCount: u.machines_count,
      percent: u.percent,
    })),
  }
}

/** Action support bornée : relance une vraie vérification sur l'équipement d'un utilisateur
 * (nouvelle mesure comparée à ses seuils), jamais une simple remise à zéro — voir
 * _get_manageable_machine côté backend pour les garde-fous (jamais sur soi-même ni sur un
 * superadmin). Toujours auditée sous le compte concerné, visible dans son propre Audit. */
export function verifyUserMachine(machineId: string) {
  return rawAdminTestMachine(machineId)
}

/** Remet un équipement en état actif sans nouvelle mesure (ex: faux positif confirmé par
 * téléphone avec le client) — action support plus légère que verifyUserMachine, même audit. */
export function resetUserMachine(machineId: string) {
  return rawAdminResetMachine(machineId)
}
