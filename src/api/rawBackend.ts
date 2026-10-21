/**
 * Appels bruts vers le backend réel, typés avec les formes exactes du wire
 * format (`types/backend.ts`). Les modules `api/*.ts` construisent les types
 * "vue" (`types/domain.ts`) au-dessus de ces fonctions : c'est ici, et
 * seulement ici, que vit la connaissance du contrat HTTP réel.
 */
import { api, saveBlob } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import type {
  BackendApplianceDetail,
  BackendPowerPeak,
  SubscriptionUnit,
  BackendCompteur,
  BackendCompteurDemande,
  BackendConsumption,
  ConsumptionGranularity,
  BackendNotification,
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
  BackendAlertEntry,
  BackendAlertFeedbackIn,
  BackendAlertStatus,
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
  BackendContactMessagePage,
  ContactMessageFilter,
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
  MeterType,
  BackendPrepaid,
  BackendRecharge,
  BackendNewTeamMemberPayload,
  BackendTeamMember,
  BackendUser,
  BackendWaitlistEntry,
  BackendWaitlistJoinAck,
  BackendWaitlistPayload,
  BackendColdStartSegment,
  BackendDriftReport,
  BackendMediaAnalysis,
  ReportFormat,
  ReportType,
  BackendPendingBill,
  BackendCollectionMachine,
  BackendMainMeterComparison,
  BackendCollectionStatus,
  BackendForecastReview,
} from '@/types/backend'

export const rawAuthMe = () => api.get<BackendUser>('/api/auth/me')
export const rawUpdateMe = (payload: { nom: string }) => api.patch<BackendUser>('/api/auth/me', payload)
export const rawChangePassword = (payload: { current_password: string; new_password: string }) =>
  api.post<{ status: string; token?: string; refresh_token?: string }>('/api/auth/change-password', payload)

export const rawTeamMembers = () => api.get<BackendTeamMember[]>('/api/v1/team/members')
export const rawCreateTeamMember = (payload: BackendNewTeamMemberPayload) =>
  api.post<BackendTeamMember>('/api/v1/team/members', payload)
export const rawDeleteTeamMember = (memberId: string) => api.delete<null>(`/api/v1/team/members/${memberId}`)

export const rawJoinWaitlist = (payload: BackendWaitlistPayload) =>
  api.post<BackendWaitlistJoinAck>('/api/v1/waitlist', payload, false)

export const rawSendContactMessage = (payload: BackendContactMessagePayload) =>
  api.post<BackendContactMessage>('/api/v1/contact', payload, false)

export const rawSeedDemoData = () => api.post<BackendDemoSeedResult>('/api/v1/demo/seed')

export const rawSites = () => api.get<BackendSite[]>('/api/sites')
export const rawCreateSite = (payload: { nom: string; localisation?: string; compteur_type?: MeterType }) =>
  api.post<BackendSite>('/api/sites', payload)
export const rawRenameSite = (siteId: string, nom: string) => api.put<BackendSite>(`/api/sites/${siteId}`, { nom })
export const rawSetSiteMeter = (siteId: string, compteur_type: MeterType) =>
  api.put<BackendSite>(`/api/sites/${siteId}/compteur`, { compteur_type })

export const rawMachines = () => api.get<BackendMachine[]>('/api/machines')

/**
 * Même donnée que `rawMachines()`, mais passée par le cache react-query
 * (`['machines']`, `staleTime` par défaut du client) : plusieurs widgets
 * indépendants (KPI, prédiction, alertes, machines suivies) en ont besoin sur
 * le même écran sans se parler entre eux : sans ce partage, chacun relance
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
/** Changement d'abonnement par le client, immédiat (2026-10-21) ; pas encore de paiement. */
export const rawChangeTier = (tier: BillingTierId) => api.put<BackendBilling>('/api/v1/billing/tier', { tier })
export const rawAdminUserBilling = (userId: string) => api.get<BackendBilling>(`/api/v1/billing/admin/users/${userId}`)
export const rawAdminSaveContract = (userId: string, payload: BackendContractPayload) =>
  api.put<BackendBillingContract>(`/api/v1/billing/admin/users/${userId}/contract`, payload)
export const rawAdminApproveTier = (userId: string) => api.post<BackendBillingContract>(`/api/v1/billing/admin/users/${userId}/approve-tier`)
export const rawAdminComputeStatement = (userId: string, month: string) =>
  api.post<BackendBillingStatement>(`/api/v1/billing/admin/users/${userId}/statements/${month}`)
export const rawAdminMarkPaid = (statementId: string) => api.post<BackendBillingStatement>(`/api/v1/billing/admin/statements/${statementId}/paid`)
export const rawAdminUnpaid = () => api.get<BackendUnpaidStatement[]>('/api/v1/billing/admin/unpaid')
export const rawAdminTierRequests = () => api.get<BackendTierRequest[]>('/api/v1/billing/admin/tier-requests')
export const rawAdminPendingBills = () => api.get<BackendPendingBill[]>('/api/v1/billing/admin/bills/pending')
export const rawAdminBillPhoto = (billId: string) => api.get<{ photo_data_url: string }>(`/api/v1/billing/admin/bills/${billId}/photo`)
export const rawAdminValidateBill = (billId: string, decision: 'validee' | 'rejetee', compteur?: string) =>
  api.post<BackendPendingBill>(`/api/v1/billing/admin/bills/${billId}/validate`, { decision, compteur: compteur || undefined })
/** Justificatif (photo de la facture CIE) joint à une facture saisie à la main. */
export const rawAttachBillPhoto = (billId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.postForm<BackendElectricityBill>(`/api/bills/${billId}/photo`, form)
}

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

/**
 * Un appareil « mesuré » a au moins un relevé : souvent seulement électrique (le capteur prévu mesure la puissance,
 * pas la température ni la vibration, 2026-10-15). Avant, il fallait les trois mesures, et un appareil suivi par un
 * simple capteur électrique disparaissait des prévisions et des alertes.
 */
export function hasReading(machine: BackendMachine): boolean {
  if (machine.has_reading !== undefined) return machine.has_reading
  return machine.temperature_c !== null || machine.vibration_mm_s !== null || machine.pressure_bar !== null
}

function toSensorReading(machine: BackendMachine) {
  return {
    machine_id: machine.machine_id,
    nom: machine.nom,
    categorie: machine.categorie ?? undefined,
    marque: machine.marque ?? undefined,
    modele: machine.modele ?? undefined,
    power_kw: machine.power_kw,
    temperature_c: machine.temperature_c,
    vibration_mm_s: machine.vibration_mm_s,
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
  // Une machine sans relevé n'a rien à diagnostiquer (le backend l'ignore aussi).
  const readings = machines.filter(hasReading).map(toSensorReading)
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
      vibration_mm_s: machine.vibration_mm_s,
      pressure_bar: machine.pressure_bar,
      hours_ahead: hoursAhead,
    },
    // Avec le jeton : sans lui, le serveur ne sait pas à qui est la machine et renvoie une
    // prévision générique, sans sa puissance nominale ni son historique (4 kW pour un four de 120 kW).
  )

// Jeton envoyé : la route est publique mais ne renvoie le détail (composants, versions) qu'à un administrateur.
export const rawMlHealth = () => api.get<BackendMlHealth>('/api/v1/ml/health')
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

/** Formulaire public "Demander un audit" : aucune authentification requise. */
export const rawCreateAuditRequest = (payload: BackendAuditRequestPayload) =>
  api.post<BackendAuditRequest>('/api/v1/leads', payload, false)

/** Réservé aux administrateurs de la plateforme. */
export const rawAuditRequests = () => api.get<BackendAuditRequest[]>('/api/v1/leads')
export const rawUpdateAuditRequest = (id: string, status: BackendAuditRequest['status']) =>
  api.patch<BackendAuditRequest>(`/api/v1/leads/${encodeURIComponent(id)}`, { status })

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

export const rawConsumption = (granularity: ConsumptionGranularity, machine?: string, jour?: string) =>
  api.get<BackendConsumption>(
    `/api/v1/consumption?granularity=${granularity}${machine ? `&machine=${encodeURIComponent(machine)}` : ''}${jour ? `&jour=${jour}` : ''}`,
  )
export const rawMainMeters = (granularity: ConsumptionGranularity) =>
  api.get<BackendMainMeterComparison>(`/api/v1/consumption/compteur-general?granularity=${granularity}`)
export const rawCreateMainMeter = (siteId?: string) => api.post<{ code: string }>('/api/v1/consumption/compteur-general', { site_id: siteId || null })
export const rawDeleteMainMeter = (code: string) => api.delete<void>(`/api/v1/consumption/compteur-general/${encodeURIComponent(code)}`)
export const rawNotifications = () => api.get<BackendNotification[]>('/api/v1/notifications')

export const rawCompteur = () => api.get<BackendCompteur>('/api/v1/compteur')
export const rawSetCompteur = (numero: string) => api.put<BackendCompteur>('/api/v1/compteur', { numero })
export function rawRequestCompteurChange(nouveau: string, motif: string, justificatif: File) {
  const form = new FormData()
  form.append('nouveau', nouveau)
  if (motif.trim()) form.append('motif', motif.trim())
  form.append('justificatif', justificatif)
  return api.postForm<BackendCompteurDemande>('/api/v1/compteur/demande', form)
}
export const rawAdminCompteurDemandes = () => api.get<BackendCompteurDemande[]>('/api/v1/compteur/admin/demandes')
export const rawAdminDecideCompteur = (id: string, accepte: boolean, note?: string) =>
  api.post<BackendCompteurDemande>(`/api/v1/compteur/admin/demandes/${encodeURIComponent(id)}`, { accepte, note })

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
export const rawAlertRegistry = (status: BackendAlertStatus = 'toutes', limit = 100) =>
  api.get<BackendAlertEntry[]>(`/api/v1/alerts?status=${status}&limit=${limit}`)
export const rawAlertFeedback = (alertId: string, body: BackendAlertFeedbackIn) =>
  api.post<BackendAlertEntry>(`/api/v1/alerts/${encodeURIComponent(alertId)}/feedback`, body)
export const rawAlertTakeCharge = (alertId: string) => api.post<BackendAlertEntry>(`/api/v1/alerts/${encodeURIComponent(alertId)}/prise-en-charge`, {})

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
/** Calibre du disjoncteur d'un ménage, en ampères (null pour l'effacer) : rangé sur son site « Domicile ». */
export const rawSetBreaker = (amperes: number | null, siteId?: string | null) =>
  api.put<{ site_id: string | null; amperes: number | null }>('/api/v1/consumption/disjoncteur', { amperes, site_id: siteId ?? null })
export const rawSetSiteSubscription = (siteId: string, payload: { valeur: number | null; unite: SubscriptionUnit | null; cos_phi: number | null }) =>
  api.put<BackendSite>(`/api/sites/${siteId}/souscription`, payload)
export const rawApplianceDetail = (code: string, periode: '24h' | '7j' | '30j') =>
  api.get<BackendApplianceDetail>(`/api/v1/consumption/appareil/${encodeURIComponent(code)}?periode=${periode}`)
export const rawPowerPeak = (jour?: string) => api.get<BackendPowerPeak>(`/api/v1/consumption/pic${jour ? `?jour=${jour}` : ''}`)
export const rawAnalyzeMachineMedia = (machineId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.postForm<BackendMediaAnalysis>(`/api/machines/${machineId}/analyze-media`, form)
}
export const rawSiteShutdown = (deviceId: string, machineCode: string) =>
  api.post<BackendDeviceCommand>(`/api/v1/boitiers/${deviceId}/commands`, { machine_code: machineCode, type: 'shutdown' })
export const rawGenerateReport = (reportType: ReportType, exportFormat: ReportFormat) =>
  api.postBlob('/api/v1/reports/generate', { report_type: reportType, export_format: exportFormat })
function contactQuery(statut: ContactMessageFilter, q: string, page?: number, perPage?: number): string {
  const params = new URLSearchParams({ statut })
  if (q.trim()) params.set('q', q.trim())
  if (page) params.set('page', String(page))
  if (perPage) params.set('per_page', String(perPage))
  return params.toString()
}

export const rawContactMessages = (statut: ContactMessageFilter, q: string, page: number, perPage = 50) =>
  api.get<BackendContactMessagePage>(`/api/v1/contact?${contactQuery(statut, q, page, perPage)}`)
export const rawMarkContactMessage = (id: string, traite: boolean) =>
  api.patch<BackendContactMessage>(`/api/v1/contact/${encodeURIComponent(id)}`, { traite })
/** Export CSV du filtre affiché : les messages exportés deviennent supprimables. */
export async function downloadContactCsv(statut: ContactMessageFilter, q: string): Promise<void> {
  const { blob, filename } = await api.getBlob(`/api/v1/contact/export.csv?${contactQuery(statut, q)}`)
  saveBlob(blob, filename ?? 'messages-nouankany.csv')
}
export const rawDeleteExportedContactMessages = (q: string) =>
  api.post<{ supprimes: number }>('/api/v1/contact/supprimer', q.trim() ? { q: q.trim() } : { tous: true })
/** Spam évident : suppression sans export, si `confirmation` est exactement le nombre de messages de la recherche. */
export const rawDeleteSpamMessages = (q: string, confirmation: number) =>
  api.post<{ supprimes: number }>('/api/v1/contact/spam', { q: q.trim(), confirmation })
export const rawWaitlistEntries = () => api.get<BackendWaitlistEntry[]>('/api/v1/waitlist')
export const rawMlCollection = () => api.get<BackendCollectionStatus>('/api/v1/ml/collecte')
export const rawMlCollectionMachines = () => api.get<BackendCollectionMachine[]>('/api/v1/ml/collecte/appareils')
export const rawMlForecastReview = (jours = 30) => api.get<BackendForecastReview>(`/api/v1/ml/previsions/bilan?jours=${jours}`)
/** Jeu d'entraînement construit sur les seules mesures réelles, à déposer dans le Drive pour le carnet de réentraînement. */
export async function downloadTrainingCsv(): Promise<void> {
  const { blob, filename } = await api.getBlob('/api/v1/ml/collecte/export.csv')
  saveBlob(blob, filename ?? 'reel.csv')
}
export const rawMlDrift = (window = 500) => api.get<BackendDriftReport>(`/api/v1/ml/drift?window=${window}`)
export const rawMlDriftLog = (window = 500) =>
  api.post<{ status: string; log_file: string; report: BackendDriftReport }>(`/api/v1/ml/drift/log?window=${window}`)
export const rawColdStart = () => api.get<BackendColdStartSegment[]>('/api/v1/ml/cold-start')
export const rawColdStartEvaluate = () => api.post<BackendColdStartSegment[]>('/api/v1/ml/cold-start/evaluate')

/** Compteur à carte (2026-10-20) : crédit restant, prix réel, recharges. */
export const rawPrepaid = () => api.get<BackendPrepaid[]>('/api/v1/prepaye')
export const rawAddRecharge = (payload: { site_id?: string; date: string; montant_fcfa: number; kwh?: number | null }) =>
  api.post<BackendRecharge>('/api/v1/prepaye/recharges', payload)
export const rawDeleteRecharge = (id: string) => api.delete<null>(`/api/v1/prepaye/recharges/${id}`)
export const rawSetPrepaidReading = (siteId: string, creditKwh: number) =>
  api.put<BackendPrepaid>('/api/v1/prepaye/releve', { site_id: siteId, credit_kwh: creditKwh })
export const rawUploadRechargePhoto = (siteId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  form.append('site_id', siteId)
  return api.postForm<BackendRecharge>('/api/v1/prepaye/recharges/photo', form)
}
