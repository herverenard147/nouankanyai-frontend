/**
 * Appels bruts vers le backend réel, typés avec les formes exactes du wire
 * format (`types/backend.ts`). Les modules `api/*.ts` construisent les types
 * "vue" (`types/domain.ts`) au-dessus de ces fonctions — c'est ici, et
 * seulement ici, que vit la connaissance du contrat HTTP réel.
 */
import { api } from '@/lib/apiClient'
import type {
  BackendAdminMetrics,
  BackendAdminUserAlerts,
  BackendAdminUserPredictions,
  BackendPlatformAlerts,
  BackendAuditEvent,
  BackendAuditPage,
  BackendBillUpdatePayload,
  BackendPlanItem,
  BackendPlanItemPayload,
  BackendPlanItemUpdate,
  BackendPlanStatus,
  BackendPlanSummary,
  BackendResolution,
  BackendAlertThresholds,
  BackendAnomalyResult,
  BackendAuditRequest,
  BackendAuditRequestPayload,
  BackendBillPhoto,
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
export const rawUpdateMe = (payload: { nom: string }) => api.patch<BackendUser>('/api/auth/me', payload)
export const rawChangePassword = (payload: { current_password: string; new_password: string }) =>
  api.post<{ status: string }>('/api/auth/change-password', payload)

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
export const rawDeleteBill = (billId: string) => api.delete<null>(`/api/bills/${billId}`)
export const rawUploadBillPhoto = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.postForm<{ status: string; bill: BackendElectricityBill }>('/api/bills/upload-photo', form)
}
export const rawBillPhoto = (billId: string) => api.get<BackendBillPhoto>(`/api/bills/${billId}/photo`)

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
  api.post<{ response: string }>('/api/chat', { message, context })

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
export const rawSuspendUser = (targetUserId: string, suspended: boolean) =>
  api.patch<BackendUser>(`/api/admin/users/${targetUserId}/suspend`, { suspended })
export const rawDeleteUser = (targetUserId: string) => api.delete<{ deleted: boolean }>(`/api/admin/users/${targetUserId}`)
export const rawAdminResetPassword = (targetUserId: string, newPassword: string) =>
  api.post<{ ok: boolean }>(`/api/admin/users/${targetUserId}/reset-password`, { new_password: newPassword })
export const rawAdminUpdateUserProfile = (targetUserId: string, nom: string) =>
  api.patch<BackendUser>(`/api/admin/users/${targetUserId}/profile`, { nom })
export const rawUserPredictions = (targetUserId: string) =>
  api.get<BackendAdminUserPredictions>(`/api/admin/users/${targetUserId}/predictions`)
export const rawUserAlerts = (targetUserId: string) =>
  api.get<BackendAdminUserAlerts>(`/api/admin/users/${targetUserId}/alerts`)
export const rawPlatformAlerts = () => api.get<BackendPlatformAlerts>('/api/admin/alerts')

/** Formulaire public "Demander un audit" — aucune authentification requise. */
export const rawCreateAuditRequest = (payload: BackendAuditRequestPayload) =>
  api.post<BackendAuditRequest>('/api/v1/leads', payload, false)

/** Réservé aux administrateurs de la plateforme. */
export const rawAuditRequests = () => api.get<BackendAuditRequest[]>('/api/v1/leads')

export const rawUpdateBill = (billId: string, payload: BackendBillUpdatePayload) =>
  api.patch<BackendElectricityBill>(`/api/bills/${billId}`, payload)

// --- Audit, plan d'action, historique des résolutions ---
export interface AuditQuery {
  category?: string
  q?: string
  limit?: number
  offset?: number
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const rawAuditEvents = (query: AuditQuery = {}) =>
  api.get<BackendAuditPage>(`/api/v1/audit/events${toQueryString({ ...query })}`)
export const rawAdminAuditEvents = (query: AuditQuery = {}) =>
  api.get<BackendAuditPage>(`/api/v1/audit/admin/events${toQueryString({ ...query })}`)

export const rawPlanItems = () => api.get<BackendPlanItem[]>('/api/v1/plan/items')
export const rawPlanSummary = () => api.get<BackendPlanSummary>('/api/v1/plan/summary')
export const rawCreatePlanItem = (payload: BackendPlanItemPayload) => api.post<BackendPlanItem>('/api/v1/plan/items', payload)
export const rawImportPlanItems = (items: { source_ref: string; title: string; description?: string; gain_estime_fcfa?: number }[]) =>
  api.post<BackendPlanItem[]>('/api/v1/plan/items/import', { items })
export const rawUpdatePlanItem = (itemId: string, payload: BackendPlanItemUpdate) =>
  api.patch<BackendPlanItem>(`/api/v1/plan/items/${itemId}`, payload)
export const rawDeletePlanItem = (itemId: string) => api.delete<null>(`/api/v1/plan/items/${itemId}`)
export const rawResolutions = () => api.get<BackendResolution[]>('/api/v1/plan/resolutions')

export type { BackendAuditEvent, BackendPlanStatus }

/** Export CSV de la piste d'audit : le navigateur doit envoyer le jeton, donc fetch + Blob (pas un simple lien). */
export async function downloadAuditCsv(): Promise<void> {
  const { useSessionStore } = await import('@/store/sessionStore')
  const base = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001').replace(/\/$/, '')
  const token = useSessionStore.getState().session?.token
  const response = await fetch(`${base}/api/v1/audit/events.csv`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!response.ok) throw new Error(`Export impossible (erreur ${response.status})`)
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = 'audit-nouankany.csv'
  link.click()
  URL.revokeObjectURL(url)
}
