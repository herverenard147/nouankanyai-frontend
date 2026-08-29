/**
 * Appels bruts vers le backend réel, typés avec les formes exactes du wire
 * format (`types/backend.ts`). Les modules `api/*.ts` construisent les types
 * "vue" (`types/domain.ts`) au-dessus de ces fonctions — c'est ici, et
 * seulement ici, que vit la connaissance du contrat HTTP réel.
 */
import { api } from '@/lib/apiClient'
import type {
  BackendAdminMetrics,
  BackendAlertThresholds,
  BackendAnomalyResult,
  BackendAuditRequest,
  BackendAuditRequestPayload,
  BackendContactMessage,
  BackendContactMessagePayload,
  BackendDemoSeedResult,
  BackendElectricityBill,
  BackendEquipmentCatalog,
  BackendFacturation,
  BackendGeminiMetrics,
  BackendMachine,
  BackendMachineHistory,
  BackendMachineTestResult,
  BackendMachineUpdatePayload,
  BackendMlAuditEntry,
  BackendMlHealth,
  BackendMlModelInfo,
  BackendMlReloadResult,
  BackendNewManualBill,
  BackendNewMachinePayload,
  BackendPlatformRole,
  BackendRecommendation,
  BackendSite,
  BackendNewTeamMemberPayload,
  BackendTeamMember,
  BackendUser,
  BackendWaitlistEntry,
  BackendWaitlistPayload,
} from '@/types/backend'

export const rawAuthMe = () => api.get<BackendUser>('/api/auth/me')
export const rawUpdateMe = (payload: { nom?: string; type_compte?: string }) =>
  api.patch<BackendUser>('/api/auth/me', payload)

export const rawTeamMembers = () => api.get<BackendTeamMember[]>('/api/v1/team/members')
export const rawCreateTeamMember = (payload: BackendNewTeamMemberPayload) =>
  api.post<BackendTeamMember>('/api/v1/team/members', payload)
export const rawDeleteTeamMember = (memberId: string) => api.delete<null>(`/api/v1/team/members/${memberId}`)

export const rawJoinWaitlist = (payload: BackendWaitlistPayload) =>
  api.post<BackendWaitlistEntry>('/api/v1/waitlist', payload, false)

export const rawSendContactMessage = (payload: BackendContactMessagePayload) =>
  api.post<BackendContactMessage>('/api/v1/contact', payload, false)

export const rawSeedDemoData = () => api.post<BackendDemoSeedResult>('/api/v1/demo/seed')

export const rawSites = () => api.get<BackendSite[]>('/api/sites')
export const rawCreateSite = (payload: { nom: string; localisation: string }) =>
  api.post<BackendSite>('/api/sites', payload)

export const rawMachines = () => api.get<BackendMachine[]>('/api/machines')
export const rawEquipmentCatalog = () => api.get<BackendEquipmentCatalog>('/api/equipment-catalog', false)
export const rawAddMachine = (payload: BackendNewMachinePayload) =>
  api.post<{ status: string; machines: BackendMachine[] }>('/api/machines', payload)
export const rawUpdateMachine = (machineId: string, payload: BackendMachineUpdatePayload) =>
  api.patch<BackendMachine>(`/api/machines/${machineId}`, payload)
export const rawDeleteMachine = (machineId: string) => api.delete<null>(`/api/machines/${machineId}`)
export const rawSimulateMachine = (machineId: string) => api.post<{ status: string }>(`/api/machines/${machineId}/simulate`)
export const rawResetMachine = (machineId: string) => api.post<{ status: string }>(`/api/machines/${machineId}/reset`)
export const rawTestMachine = (machineId: string) => api.post<BackendMachineTestResult>(`/api/machines/${machineId}/test`)
export const rawMachineHistory = (machineId: string) => api.get<BackendMachineHistory>(`/api/machines/${machineId}/history`)

export const rawAlertThresholds = () => api.get<BackendAlertThresholds>('/api/alert-thresholds')
export const rawUpdateAlertThresholds = (payload: BackendAlertThresholds) =>
  api.put<BackendAlertThresholds>('/api/alert-thresholds', payload)

export const rawFacturation = () => api.get<BackendFacturation>('/api/facturation')

export const rawBills = () => api.get<BackendElectricityBill[]>('/api/bills')
export const rawAddManualBill = (payload: BackendNewManualBill) =>
  api.post<BackendElectricityBill>('/api/bills/manual', payload)
export const rawBillForecast = () => api.post<BackendElectricityBill>('/api/bills/forecast')
export const rawConfirmBillActual = (billId: string, actualAmountXof: number) =>
  api.patch<BackendElectricityBill>(`/api/bills/${billId}/actual`, { actual_amount_xof: actualAmountXof })

function toSensorReading(machine: BackendMachine) {
  return {
    machine_id: machine.machine_id,
    nom: machine.nom,
    categorie: machine.categorie ?? undefined,
    marque: machine.marque ?? undefined,
    modele: machine.modele ?? undefined,
    power_kw: machine.power_kw,
    temperature_c: machine.temperature_c,
    vibration_hz: machine.vibration_hz,
    pressure_bar: machine.pressure_bar,
    priority: machine.priority,
  }
}
export const rawRecommend = (machines: BackendMachine[]) =>
  api.post<{ recommendations: BackendRecommendation[]; count: number }>('/api/recommend', machines.map(toSensorReading))

export const rawPredict = (machine: BackendMachine, hoursAhead: number) =>
  api.post<{ machine_id: string; predictions: { hour: number; predicted_kw: number; cost_fcfa: number }[] }>(
    '/api/predict',
    {
      machine_id: machine.machine_id,
      temperature_c: machine.temperature_c,
      vibration_hz: machine.vibration_hz,
      pressure_bar: machine.pressure_bar,
      hours_ahead: hoursAhead,
    },
    false,
  )

export const rawDetectAnomaly = (reading: {
  power_kw: number
  temperature_c: number
  vibration_hz: number
  pressure_bar: number
}) => api.post<BackendAnomalyResult>('/api/v1/ml/detect-anomaly', reading, false)

export const rawMlHealth = () => api.get<BackendMlHealth>('/api/v1/ml/health', false)
export const rawMlModels = () => api.get<BackendMlModelInfo[]>('/api/v1/ml/models')
export const rawMlMetrics = () => api.get<Record<string, unknown>>('/api/v1/ml/metrics')
export const rawMlAudit = () => api.get<BackendMlAuditEntry[]>('/api/v1/ml/audit')
export const rawMlReload = () => api.post<BackendMlReloadResult>('/api/v1/ml/reload')

export const rawChat = (message: string, context: BackendMachine[]) =>
  api.post<{ response: string }>('/api/chat', { message, context }, false)

export const rawAdminMetrics = () => api.get<BackendAdminMetrics>('/api/admin/metrics')
export const rawGeminiMetrics = () => api.get<BackendGeminiMetrics>('/api/admin/gemini-metrics')
export const rawUpdateUserRole = (targetUserId: string, platformRole: BackendPlatformRole) =>
  api.patch<BackendUser>(`/api/admin/users/${targetUserId}/role`, { platform_role: platformRole })
export const rawAdminResetMachine = (machineId: string) => api.post<{ status: string }>(`/api/admin/machines/${machineId}/reset`)
export const rawUserMachines = (targetUserId: string) =>
  api.get<{ id: string; machine_id: string; nom: string; site_nom: string; status: string; puissance_nominale_kw: number }[]>(
    `/api/admin/users/${targetUserId}/machines`,
  )
export const rawUserFacturation = (targetUserId: string) =>
  api.get<{ grossSavingsThisMonth: number; gainShareThisMonth: number; invoiceCount: number; billCount: number }>(
    `/api/admin/users/${targetUserId}/facturation`,
  )

/** Formulaire public "Demander un audit" — aucune authentification requise. */
export const rawCreateAuditRequest = (payload: BackendAuditRequestPayload) =>
  api.post<BackendAuditRequest>('/api/v1/leads', payload, false)

/** Réservé aux administrateurs de la plateforme. */
export const rawAuditRequests = () => api.get<BackendAuditRequest[]>('/api/v1/leads')
