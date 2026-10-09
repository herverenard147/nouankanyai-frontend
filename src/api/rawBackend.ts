/**
 * Appels bruts vers le backend réel, typés avec les formes exactes du wire
 * format (`types/backend.ts`). Les modules `api/*.ts` construisent les types
 * "vue" (`types/domain.ts`) au-dessus de ces fonctions — c'est ici, et
 * seulement ici, que vit la connaissance du contrat HTTP réel.
 */
import { api, saveBlob } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import type {
  BackendAdminDevice,
  BackendAdminDeviceRequest,
  BackendAdminMachineActionResult,
  BackendAdminMetrics,
  BackendAssistantChatResponse,
  BackendAdminUserAlerts,
  BackendAdminUserPredictions,
  BackendPlatformAlerts,
  BackendPlatformConsumption,
  BackendPlatformPredictions,
  BackendAuditEvent,
  BackendAuditPage,
  BackendJournalPage,
  BackendBillUpdatePayload,
  BackendPlanItem,
  BackendPlanItemPayload,
  BackendPlanItemUpdate,
  BackendPlanStatus,
  BackendPlanSummary,
  BackendResolution,
  BackendAlertThresholds,
  BackendAuditRequest,
  BackendAuditRequestPayload,
  BackendBillPhoto,
  BackendBoitierPrice,
  BackendDevice,
  BackendDeviceCommand,
  BackendDeviceCreatePayload,
  BackendDeviceCreated,
  BackendDeviceRequest,
  BackendDeviceRequestPayload,
  BackendDeviceState,
  BackendDeviceUpdatePayload,
  BackendContactMessage,
  BackendContactMessagePayload,
  BackendDemoSeedResult,
  BackendElectricityBill,
  BackendEquipmentCatalog,
  BackendBilling,
  BackendBillingContract,
  BackendBillingStatement,
  BackendContractPayload,
  BackendTierRequest,
  BackendUnpaidStatement,
  BillingTierId,
  BackendGeminiMetrics,
  BackendMachine,
  BackendMachineHistory,
  BackendMachinePhotoExtraction,
  BackendMachineTestResult,
  BackendMachineUpdatePayload,
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
  BackendColdStartSegment,
  BackendDriftReport,
  BackendMediaAnalysis,
  ReportFormat,
  ReportType,
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

/**
 * Même donnée que `rawMachines()`, mais passée par le cache react-query
 * (`['machines']`, `staleTime` par défaut du client) : plusieurs widgets
 * indépendants (KPI, prédiction, alertes, machines suivies) en ont besoin sur
 * le même écran sans se parler entre eux — sans ce partage, chacun relance
 * son propre GET /api/machines et l'Aperçu Industrie en déclenche jusqu'à 4
 * en parallèle pour une donnée identique.
 */
export const getCachedMachines = () => queryClient.fetchQuery({ queryKey: ['machines'], queryFn: rawMachines })

/**
 * Même partage que `getCachedMachines()`, pour `/api/admin/metrics` et
 * `/api/ml/models` : le Portail Admin (KPI, Journal, Utilisateurs) et la page
 * Modèles & observabilité (panneaux XGBoost + Isolation Forest) les
 * interrogent chacun de leur côté, doublant les appels sur un même écran.
 */
export const getCachedAdminMetrics = () => queryClient.fetchQuery({ queryKey: ['admin-metrics'], queryFn: rawAdminMetrics })
export const getCachedMlModels = () => queryClient.fetchQuery({ queryKey: ['ml-models'], queryFn: rawMlModels })
/** `menage` : référentiel domestique seul (sans le catalogue industriel). */
export const rawEquipmentCatalog = (segment?: 'menage') =>
  api.get<BackendEquipmentCatalog>(`/api/equipment-catalog${segment ? `?segment=${segment}` : ''}`, false)
export const rawAddMachine = (payload: BackendNewMachinePayload) =>
  api.post<{ status: string; machines: BackendMachine[] }>('/api/machines', payload)
export const rawUpdateMachine = (machineId: string, payload: BackendMachineUpdatePayload) =>
  api.patch<BackendMachine>(`/api/machines/${machineId}`, payload)
export const rawExtractMachinePhoto = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.postForm<BackendMachinePhotoExtraction>('/api/machines/extract-photo', form)
}
export const rawDeleteMachine = (machineId: string) => api.delete<null>(`/api/machines/${machineId}`)
export const rawSimulateMachine = (machineId: string) => api.post<{ status: string }>(`/api/machines/${machineId}/simulate`)
export const rawResetMachine = (machineId: string) => api.post<{ status: string }>(`/api/machines/${machineId}/reset`)
export const rawTestMachine = (machineId: string) => api.post<BackendMachineTestResult>(`/api/machines/${machineId}/test`)
export const rawMachineHistory = (machineId: string) => api.get<BackendMachineHistory>(`/api/machines/${machineId}/history`)

export const rawAlertThresholds = () => api.get<BackendAlertThresholds>('/api/alert-thresholds')
export const rawUpdateAlertThresholds = (payload: BackendAlertThresholds) =>
  api.put<BackendAlertThresholds>('/api/alert-thresholds', payload)

// --- Facturation Nouankany (/api/v1/billing) ---
export const rawBilling = () => api.get<BackendBilling>('/api/v1/billing')
export const rawRequestTier = (tier: BillingTierId) => api.post<BackendBillingContract>('/api/v1/billing/tier-request', { tier })
export const rawAdminUserBilling = (userId: string) => api.get<BackendBilling>(`/api/v1/billing/admin/users/${userId}`)
export const rawAdminSaveContract = (userId: string, payload: BackendContractPayload) =>
  api.put<BackendBillingContract>(`/api/v1/billing/admin/users/${userId}/contract`, payload)
export const rawAdminApproveTier = (userId: string) => api.post<BackendBillingContract>(`/api/v1/billing/admin/users/${userId}/approve-tier`)
export const rawAdminComputeStatement = (userId: string, month: string) =>
  api.post<BackendBillingStatement>(`/api/v1/billing/admin/users/${userId}/statements/${month}`)
export const rawAdminMarkPaid = (statementId: string) => api.post<BackendBillingStatement>(`/api/v1/billing/admin/statements/${statementId}/paid`)
export const rawAdminUnpaid = () => api.get<BackendUnpaidStatement[]>('/api/v1/billing/admin/unpaid')
export const rawAdminTierRequests = () => api.get<BackendTierRequest[]>('/api/v1/billing/admin/tier-requests')

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
/**
 * /api/recommend partagé entre alertes, conseils, recommandations et plan d'action :
 * chaque écran l'appelait séparément (jusqu'à 5 fois par page, avec à chaque fois les
 * actions automatiques côté serveur). La clé contient l'état envoyé, donc un relevé
 * ou une machine qui change relance bien le calcul.
 */
export const getCachedRecommend = (machines: BackendMachine[]) => {
  const readings = machines.map(toSensorReading)
  return queryClient.fetchQuery({
    queryKey: ['recommend', readings],
    queryFn: () => api.post<{ recommendations: BackendRecommendation[]; count: number }>('/api/recommend', readings),
  })
}

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

export const rawMlHealth = () => api.get<BackendMlHealth>('/api/v1/ml/health', false)
export const rawMlModels = () => api.get<BackendMlModelInfo[]>('/api/v1/ml/models')
export const rawMlReload = () => api.post<BackendMlReloadResult>('/api/v1/ml/reload')

export const rawAssistantChat = (message: string) =>
  api.post<BackendAssistantChatResponse>('/api/v1/assistant/chat', { message })

export const rawAdminMetrics = () => api.get<BackendAdminMetrics>('/api/admin/metrics')
export const rawGeminiMetrics = () => api.get<BackendGeminiMetrics>('/api/admin/gemini-metrics')
export const rawUpdateUserRole = (targetUserId: string, platformRole: BackendPlatformRole) =>
  api.patch<BackendUser>(`/api/admin/users/${targetUserId}/role`, { platform_role: platformRole })
export const rawAdminResetMachine = (machineId: string) => api.post<{ status: string }>(`/api/admin/machines/${machineId}/reset`)
export const rawUserMachines = (targetUserId: string) =>
  api.get<{ id: string; machine_id: string; nom: string; site_nom: string; status: string; puissance_nominale_kw: number }[]>(
    `/api/admin/users/${targetUserId}/machines`,
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
export const rawPlatformPredictions = (hoursAhead = 24) =>
  api.get<BackendPlatformPredictions>(`/api/admin/predictions?hours_ahead=${hoursAhead}`)
export const rawPlatformConsumption = () => api.get<BackendPlatformConsumption>('/api/admin/consumption')
export const rawAdminTestMachine = (machineId: string) =>
  api.post<BackendAdminMachineActionResult>(`/api/admin/machines/${machineId}/test`)

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

export const rawJournalEvents = (limit = 100) => api.get<BackendJournalPage>(`/api/v1/journal/events?limit=${limit}`)

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
  const { blob, filename } = await api.getBlob('/api/v1/audit/events.csv')
  saveBlob(blob, filename ?? 'audit-nouankany.csv')
}

// --- Boîtier vocal : routes du site (le boîtier lui-même parle à /api/v1/boitier, avec son propre jeton) ---
export const rawBoitiers = () => api.get<BackendDevice[]>('/api/v1/boitiers')
export const rawCreateBoitier = (payload: BackendDeviceCreatePayload) => api.post<BackendDeviceCreated>('/api/v1/boitiers', payload)
export const rawUpdateBoitier = (id: string, payload: BackendDeviceUpdatePayload) => api.patch<BackendDevice>(`/api/v1/boitiers/${id}`, payload)
export const rawRevokeBoitier = (id: string) => api.delete<{ status: string }>(`/api/v1/boitiers/${id}`)
export const rawBoitierState = (id: string) => api.get<BackendDeviceState>(`/api/v1/boitiers/${id}/state`)
export const rawBoitierCommands = (id: string) => api.get<BackendDeviceCommand[]>(`/api/v1/boitiers/${id}/commands`)
export const rawSetMachineControl = (machineCode: string, controllable: boolean) =>
  api.patch<{ machine_code: string; controllable: boolean; control_channel: string | null }>(`/api/v1/boitiers/machines/${machineCode}`, {
    controllable,
    control_channel: controllable ? 'simulated' : null,
  })
export const rawBoitierPrice = () => api.get<BackendBoitierPrice>('/api/v1/boitiers/price')
export const rawBoitierRequests = () => api.get<BackendDeviceRequest[]>('/api/v1/boitiers/requests')
export const rawCreateBoitierRequest = (payload: BackendDeviceRequestPayload) => api.post<BackendDeviceRequest>('/api/v1/boitiers/requests', payload)
export const rawCancelBoitierRequest = (id: string) => api.delete<{ status: string }>(`/api/v1/boitiers/requests/${id}`)

export const rawAdminBoitiers = () => api.get<BackendAdminDevice[]>('/api/v1/boitiers/admin/all')
export const rawAdminBoitierState = (id: string) => api.get<BackendDeviceState>(`/api/v1/boitiers/admin/${id}/state`)
export const rawAdminBoitierCommands = (id: string) => api.get<BackendDeviceCommand[]>(`/api/v1/boitiers/admin/${id}/commands`)
export const rawAdminRevokeBoitier = (id: string) => api.delete<{ status: string }>(`/api/v1/boitiers/admin/${id}`)
export const rawAdminBoitierRequests = () => api.get<BackendAdminDeviceRequest[]>('/api/v1/boitiers/admin/requests')
export const rawAdminSetRequestStatus = (id: string, status: 'a_livrer' | 'livre') =>
  api.patch<BackendAdminDeviceRequest>(`/api/v1/boitiers/admin/requests/${id}`, { status })

// --- Routes gardées sans écran jusqu'ici (voir lib/navConfig.ts pour qui y accède) ---
export const rawDeleteSite = (siteId: string) => api.delete<null>(`/api/sites/${siteId}`)
export const rawAnalyzeMachineMedia = (machineId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.postForm<BackendMediaAnalysis>(`/api/machines/${machineId}/analyze-media`, form)
}
export const rawSiteShutdown = (deviceId: string, machineCode: string) =>
  api.post<BackendDeviceCommand>(`/api/v1/boitiers/${deviceId}/commands`, { machine_code: machineCode, type: 'shutdown' })
export const rawGenerateReport = (reportType: ReportType, exportFormat: ReportFormat) =>
  api.postBlob('/api/v1/reports/generate', { report_type: reportType, export_format: exportFormat })
export const rawContactMessages = () => api.get<BackendContactMessage[]>('/api/v1/contact')
export const rawWaitlistEntries = () => api.get<BackendWaitlistEntry[]>('/api/v1/waitlist')
export const rawMlDrift = (window = 500) => api.get<BackendDriftReport>(`/api/v1/ml/drift?window=${window}`)
export const rawMlDriftLog = (window = 500) =>
  api.post<{ status: string; log_file: string; report: BackendDriftReport }>(`/api/v1/ml/drift/log?window=${window}`)
export const rawColdStart = () => api.get<BackendColdStartSegment[]>('/api/v1/ml/cold-start')
export const rawColdStartEvaluate = () => api.post<BackendColdStartSegment[]>('/api/v1/ml/cold-start/evaluate')
