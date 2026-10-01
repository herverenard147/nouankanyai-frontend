/**
 * Formes brutes exactement telles que renvoyées par le backend réel
 * (herverenard147/NouanKanyAI, feature/merge-steph-ml-subsystem), vérifiées
 * endpoint par endpoint contre /docs et des appels réels. Utilisé uniquement
 * par la couche `api/` pour construire les types "vue" de `types/domain.ts`
 * que le reste de l'app consomme sans changement — voir api/README dans
 * chaque module pour le mapping.
 */

export type BackendPlatformRole = 'admin' | 'superadmin' | null

export interface BackendUser {
  id: string
  email: string
  nom: string
  type_compte: string
  role: string
  platform_role: BackendPlatformRole
  owner_id: string | null
  is_trial: boolean
  created_at: string
  last_sign_in_at: string | null
}

export interface BackendTeamMember {
  id: string
  nom: string
  email: string
  is_owner: boolean
  created_at: string
  last_sign_in_at: string | null
}

export interface BackendNewTeamMemberPayload {
  nom: string
  email: string
  password: string
}

export interface BackendAuthResult {
  token: string
  user: BackendUser
}

export interface BackendSite {
  id: string
  nom: string
  localisation: string
  user_id: string
}

export interface BackendMachine {
  machine_id: string // code_interne
  nom: string
  site_id: string | null
  site_nom: string
  power_kw: number
  temperature_c: number
  vibration_hz: number
  pressure_bar: number
  status: string
  priority: string
  categorie: string | null
  marque: string | null
  modele: string | null
  numero_serie: string | null
}

export interface BackendCatalogModel {
  nom: string
  puissance_kw: number
}
export interface BackendCatalogBrand {
  efficacite: 'faible' | 'haute'
  modeles: BackendCatalogModel[]
}
export type BackendEquipmentCatalog = Record<string, Record<string, BackendCatalogBrand>>

export interface BackendNewMachinePayload {
  nom: string
  power_kw?: number
  categorie?: string
  marque?: string
  modele?: string
  numero_serie?: string
  quantite?: number
  site_id?: string
}

export interface BackendMachineUpdatePayload {
  nom?: string
  power_kw?: number
  categorie?: string
  marque?: string
  modele?: string
  numero_serie?: string
  priority?: string
  site_id?: string
}

export interface BackendWaitlistPayload {
  email: string
  telephone?: string
}

export interface BackendWaitlistEntry {
  id: string
  email: string
  telephone: string | null
  created_at: string
}

export interface BackendMachineTestResult {
  resolved: boolean
  temperature_c: number
  vibration_hz: number
  pressure_bar: number
  power_kw: number
}

export interface BackendDemoSeedResult {
  profile: string
  sites_created: number
  machines_created: number
  bills_created: number
}

export interface BackendContactMessagePayload {
  nom: string
  email: string
  message: string
}

export interface BackendContactMessage {
  id: string
  nom: string
  email: string
  message: string
  created_at: string
}

export interface BackendMachineHistoryPoint {
  recorded_at: string
  power_kw: number
  temperature_c: number
  vibration_hz: number
  pressure_bar: number
}
export interface BackendMachineAlert {
  type_alerte: string
  description: string
  action_recommandee: string
  created_at: string
  is_resolved: boolean
}
export interface BackendMachineHistory {
  machine: {
    nom: string
    code_interne: string
    status: string
    priority: string
    puissance_nominale_kw: number
    created_at: string
  }
  history: BackendMachineHistoryPoint[]
  alerts: BackendMachineAlert[]
}

export interface BackendAlertThresholds {
  temperature_max_c: number
  vibration_max_hz: number
  surconsommation_ratio: number
}

export interface BackendFacturation {
  grossSavings: number
  gainShare: number
  barData: { name: string; savings: number }[]
  auditTrail: { timestamp: string; action: string; ref: string | null; status: string }[]
  invoices: { id: string; month: string; amount: string }[]
}

export type BackendBillSource = 'manuel' | 'ocr' | 'ocr-mock' | 'statistique'
// Renseignés uniquement pour source="ocr"/"ocr-mock" (extraction NouankanyAI, voir
// backend/app/ai/nouankany_vision.py) : le modèle vision détecte lui-même s'il a lu
// une facture CIE papier ou un reçu de paiement numérique (Wave, Mobile Money,
// application CIE). Toujours null pour une saisie manuelle ou une prévision.
export type BackendBillDocumentType = 'facture_papier' | 'recu_paiement_numerique'
export interface BackendElectricityBill {
  id: string
  month: string
  amount: string | null
  amount_xof: number | null
  source: BackendBillSource
  is_forecast: boolean
  actual_amount_xof: number | null
  kwh_consumed: number | null
  document_type: BackendBillDocumentType | null
  payment_operator: string | null
  payment_reference: string | null
  has_photo: boolean
  created_at: string
}
export interface BackendNewManualBill {
  month: string
  amount_xof: number
  kwh_consumed?: number
}
export interface BackendBillPhoto {
  photo_data_url: string
}

export type BackendRecommendationType = 'alerte' | 'optimisation' | 'délestage' | 'efficacite'
export type BackendRecommendationSeverity = 'critique' | 'modérée' | 'faible'
export interface BackendRecommendation {
  machine_id: string
  type: BackendRecommendationType
  severity: BackendRecommendationSeverity
  title: string
  description: string
  action: string
  gain_fcfa: number
  auto_resolu: boolean
  /** Étapes de dépannage concrètes, adaptées à la catégorie de l'équipement — présent
   * seulement sur les recommandations de type "alerte" (anomalie/surchauffe/vibration),
   * absent pour optimisation/délestage/efficacité. */
  troubleshooting?: string[]
}

export interface BackendPredictionPoint {
  hour: number
  predicted_kw: number
  cost_fcfa: number
}

export interface BackendAnomalyResult {
  request_id: string
  is_anomaly: boolean
  anomaly_score: number
  anomaly_probability: number
  confidence: number
  severity: string
  model_name: string
  model_version: string
  metadata: { execution_time_ms: number; timestamp: string; feature_count: number }
}

export interface BackendAdminUserRow {
  id: string
  name: string
  email: string
  role: string
  platform_role: BackendPlatformRole
  last_active: string
  status: 'actif' | 'inactif'
  sites_count: number
  machines_count: number
  owner_id: string | null
  owner_name: string | null
}
export interface BackendRecentActivity {
  type: string
  timestamp: string | null
  user_id: string | null
  user_name: string | null
  ref_id: string | null
  extras: Record<string, unknown>
}
export interface BackendAdminMetrics {
  platform: {
    total_sites: number
    total_machines: number
    active_machines: number
    global_savings_xof: number
    revenue_xof: number
  }
  users: BackendAdminUserRow[]
  recent_activities: BackendRecentActivity[]
  ml_health: { isolation_forest_anomalies_detected: number; model_drift_status: string }
  model_metrics: {
    xgboost: {
      r2: number | null
      mae_kw: number | null
      mape_pct: number | null
      dataset: string | null
      computed_at: string | null
    }
  }
  system: {
    process_uptime_seconds: number
    avg_latency_ms: number | null
    sample_count: number
    database_status: string
  }
}

export interface BackendGeminiEndpointMetrics {
  real_calls_total: number
  real_calls_last_60s: number
  real_calls_last_24h: number
  cache_hits: number
  http_429_count: number
  timeouts_count: number
  rate_limiter_saturations: number
  mock_calls: number
}
export interface BackendGeminiMetrics {
  ai_mode: 'mock' | 'live'
  gemini_model: string
  rate_limit_per_minute: number
  max_queue_wait_seconds: number
  endpoints: Record<'chat' | 'ocr' | 'media', BackendGeminiEndpointMetrics>
}

export interface BackendMlHealth {
  status: string
  timestamp: string
  models_loaded: boolean
  registry_loaded: boolean
  feature_schema_loaded: boolean
  artifacts_ready: boolean
  version: string
  components: Record<string, { status: string; [key: string]: unknown }>
  details?: Record<string, unknown>
}
export interface BackendMlModelInfo {
  name: string
  version: string
  model_type: string
  status: string
  trained_at: string | null
  features: string[]
  metrics: Record<string, number>
  artifact_path: string | null
}
export interface BackendMlAuditEntry {
  audit_id: string
  request_id: string
  timestamp: string
  operation: string
  model_name: string
  model_version: string
  input_hash: string
  input_summary: Record<string, unknown>
  output_summary: Record<string, unknown>
  execution_time_ms: number
  status: string
  error_message: string | null
}
export interface BackendMlReloadResult {
  status: string
  message: string
  timestamp: string
  version: string
  active_models: string[]
}

export type LeadSector = 'pme' | 'industrie'

export interface BackendAuditRequestPayload {
  entreprise: string
  contact_nom: string
  email: string
  telephone?: string
  secteur: LeadSector
  message?: string
}

export interface BackendAuditRequest {
  id: string
  entreprise: string
  contact_nom: string
  email: string
  telephone: string | null
  secteur: LeadSector
  message: string | null
  status: 'nouveau' | 'contacte' | 'qualifie' | 'clos'
  created_at: string
}

export interface BackendJournalEvent {
  id: string
  created_at: string
  type: string
  label: string
  detail: string
  account: string | null
}

export interface BackendJournalPage {
  total: number
  items: BackendJournalEvent[]
}

// --- Piste d'audit, plan d'action, historique des résolutions (PR NouanKanyAI#2) ---
export interface BackendAuditEvent {
  id: string
  created_at: string
  actor_nom: string | null
  action: string
  category: string
  label: string
  detail: string | null
  target_ref: string | null
  owner_nom: string | null
}

export interface BackendAuditPage {
  total: number
  items: BackendAuditEvent[]
  categories: Record<string, number>
}

export type BackendPlanStatus = 'a_faire' | 'en_cours' | 'fait' | 'abandonne'

export interface BackendPlanItem {
  id: string
  month: string
  title: string
  description: string | null
  gain_estime_fcfa: number | null
  status: BackendPlanStatus
  source_ref: string | null
  created_at: string
  updated_at: string | null
  done_at: string | null
}

export interface BackendPlanSummary {
  month: string
  total_items: number
  potential_fcfa: number
  done_fcfa: number
  counts: Record<BackendPlanStatus, number>
}

export interface BackendPlanItemPayload {
  title: string
  description?: string
  gain_estime_fcfa?: number
  source_ref?: string
  month?: string
}

export interface BackendPlanItemUpdate {
  title?: string
  description?: string
  gain_estime_fcfa?: number
  status?: BackendPlanStatus
}

export interface BackendResolution {
  id: string
  created_at: string
  machine_code: string
  machine_nom: string | null
  resolved: boolean
  temperature_c: number | null
  vibration_hz: number | null
  pressure_bar: number | null
  power_kw: number | null
}

export interface BackendBillUpdatePayload {
  month?: string
  amount_xof?: number
  kwh_consumed?: number
}
