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
  photo_data_url?: string | null
}

export interface BackendCatalogModel {
  nom: string
  puissance_kw: number
  /** Présents sur les modèles du référentiel validé (table equipment_reference). */
  kwh_an?: number | null
  classe?: string | null
  source?: string
  confiance?: 'fabricant' | 'eprel' | 'etiquette_ci' | 'revendeur' | 'estimee'
}
export interface BackendCatalogBrand {
  efficacite: 'faible' | 'haute' | 'inconnue'
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
  photo_data_url?: string
}

/** Réponse de POST /api/machines/extract-photo : champs potentiellement `null`
 * (jamais devinés) à relire/corriger avant un POST /api/machines classique. */
export interface BackendMachinePhotoExtraction {
  status: string
  extracted: {
    nom_suggere: string | null
    categorie: string | null
    marque: string | null
    modele: string | null
    puissance_nominale_kw: number | null
    categorie_connue: boolean
  }
  photo_data_url: string
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

/** Réponse publique de POST /api/v1/waitlist : identique pour une adresse nouvelle ou déjà inscrite. */
export interface BackendWaitlistJoinAck {
  status: string
  email: string
}

/** Diagnostic déterministe (médiane/MAD/tendance, ml/diagnostic.py) — null tant que
 * l'historique de la machine compte moins de 3 relevés. N'est jamais l'autorité de
 * décision (voir `resolved`, basé sur les seuils) : une information enrichie en plus. */
export interface BackendMachineDiagnostic {
  is_healthy: boolean
  severity: 'normal' | 'surveillance' | 'moyenne' | 'elevee'
  trend: 'hausse' | 'stable' | 'baisse'
  primary_measure: string | null
  since_n_readings: number
  probable_cause: string | null
  recommended_actions: string[]
  family: string
}

export interface BackendMachineTestResult {
  resolved: boolean
  temperature_c: number
  vibration_hz: number
  pressure_bar: number
  power_kw: number
  diagnostic: BackendMachineDiagnostic | null
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
  /** Panneau « Automatisation IA » (Réglages) — jamais activé par défaut. */
  auto_resolve_enabled: boolean
}

/** GET /api/v1/billing : ce que le compte paie à Nouankany (voir backend/billing/). */
export type BillingTierId = 'decouverte' | 'essentiel' | 'optimum'
export interface BackendBillingTier {
  id: BillingTierId
  nom: string
  prix_mensuel_fcfa: number
  max_machines: number | null
  assistant_ia: boolean
  alertes_avancees: boolean
  fonctionnalites: string[]
}
export interface BackendBillingContract {
  id: string
  kind: 'pme_industrie' | 'menage'
  tier: BillingTierId | null
  requested_tier: BillingTierId | null
  audit_fee_fcfa: number | null
  saas_fee_fcfa: number | null
  savings_share_pct: number | null
  baseline_kwh: number | null
  baseline_period: string | null
  start_month: string | null
  end_month: string | null
  status: 'actif' | 'termine'
}
export interface BackendBillingStatement {
  id: string
  month: string
  status: 'en_attente_facture' | 'a_payer' | 'paye'
  baseline_kwh: number | null
  actual_kwh: number | null
  savings_kwh: number | null
  savings_fcfa: number | null
  saas_fee_fcfa: number | null
  savings_share_fcfa: number | null
  audit_fee_fcfa: number | null
  total_fcfa: number | null
  detail: { formule?: string; etapes?: string[]; raison?: string; palier_nom?: string }
  paid_at: string | null
}
export interface BackendBilling {
  segment: 'menage' | 'pme_industrie'
  contract: BackendBillingContract | null
  effective_tier: BillingTierId | null
  tiers: BackendBillingTier[]
  defaults: { audit_fee_fcfa: number; saas_fee_fcfa: number; savings_share_pct: number }
  statements: BackendBillingStatement[]
  estimated_ai_savings: {
    month_total_fcfa: number
    weeks: { name: string; savings: number }[]
    actions: { timestamp: string; action: string; status: string }[]
  }
  legacy_invoices: { id: string; month: string; amount_xof: number | null }[]
}
export type BackendUnpaidStatement = BackendBillingStatement & { user_id: string; user_nom: string; user_email: string }
export type BackendTierRequest = BackendBillingContract & { user_id: string; user_nom: string; user_email: string }
export interface BackendContractPayload {
  kind: 'pme_industrie' | 'menage'
  tier?: BillingTierId
  audit_fee_fcfa?: number
  saas_fee_fcfa?: number
  savings_share_pct?: number
  baseline_kwh?: number
  baseline_period?: string
  start_month?: string
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

export interface BackendAdminUserRow {
  id: string
  name: string
  email: string
  role: string
  platform_role: BackendPlatformRole
  last_active: string
  status: 'actif' | 'suspendu' | 'supprime'
  is_suspended: boolean
  is_deleted: boolean
  sites_count: number
  machines_count: number
  owner_id: string | null
  owner_name: string | null
}
export interface BackendAdminMachinePrediction {
  machine_id: string
  nom: string
  predictions?: BackendPredictionPoint[]
  error?: string
}
export interface BackendAdminUserPredictions {
  machines: BackendAdminMachinePrediction[]
}
export interface BackendAdminUserAlerts {
  recommendations: BackendRecommendation[]
}
export interface BackendPlatformAlertItem extends BackendRecommendation {
  owner_id: string
  owner_nom: string
}
export interface BackendPlatformAlerts {
  recommendations: BackendPlatformAlertItem[]
  count: number
}
export interface BackendPlatformPredictionUser {
  owner_id: string
  owner_nom: string
  machines: BackendAdminMachinePrediction[]
}
export interface BackendPlatformPredictions {
  users: BackendPlatformPredictionUser[]
}
export interface BackendPlatformConsumptionUser {
  owner_id: string
  owner_nom: string
  power_kw: number
  machines_count: number
  percent: number
}
export interface BackendPlatformConsumption {
  total_power_kw: number
  users: BackendPlatformConsumptionUser[]
}
export interface BackendAdminMachineActionResult {
  resolved: boolean
  temperature_c: number
  vibration_hz: number
  pressure_bar: number
  power_kw: number
  owner_id: string
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
  /** Appels Gemini restants : lecture de facture (ocr), analyse photo/vidéo (media), identification de machine. */
  endpoints: Record<'ocr' | 'media' | 'machine-vision', BackendGeminiEndpointMetrics>
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
export interface BackendMlReloadResult {
  status: string
  message: string
  timestamp: string
  version: string
  active_models: string[]
}

export interface BackendAssistantChatResponse {
  response: string
  model_name: string
  latency_ms: number
  session_id: string
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

// --- Boîtier vocal (PR NouanKanyAI#4) ---
export type BackendBoitierLight = 'vert' | 'orange' | 'rouge' | 'aucune_donnee'
export type BackendBoitierMachineState = 'vert' | 'orange' | 'rouge' | 'arrete' | 'inconnu'

export interface BackendDevice {
  id: string
  nom: string
  scope: 'site' | 'account'
  language: 'fr' | 'en'
  site_id: string | null
  site_nom: string | null
  paired: boolean
  online: boolean
  last_seen_at: string | null
  created_at: string | null
}

export interface BackendAdminDevice extends BackendDevice {
  account: string | null
  firmware_version: string | null
  commands_24h: number
}

export interface BackendDeviceCreated extends BackendDevice {
  pairing_code: string
  pairing_expires_at: string
}

export interface BackendDeviceCreatePayload {
  nom: string
  site_id?: string | null
  scope?: 'site' | 'account'
  language?: 'fr' | 'en'
}

export interface BackendDeviceUpdatePayload {
  nom?: string
  scope?: 'site' | 'account'
  language?: 'fr' | 'en'
}

export interface BackendDeviceMachineState {
  code: string
  nom: string
  state: BackendBoitierMachineState
  reason: string
  measure: string | null
  value: number | null
  limit: number | null
  controllable: boolean
}

export interface BackendDeviceCommand {
  id: string
  machine_code: string | null
  machine_nom: string | null
  type: string
  status: 'proposed' | 'confirmed' | 'executed' | 'failed' | 'expired' | 'cancelled'
  requested_via: 'voice' | 'site'
  simulated: boolean
  result: string | null
  created_at: string | null
  expires_at: string | null
  executed_at: string | null
}

export interface BackendDeviceState {
  light: BackendBoitierLight
  summary: string
  language: 'fr' | 'en'
  machines: BackendDeviceMachineState[]
  pending_command: BackendDeviceCommand | null
  unassigned_machines: number
  updated_at: string
}

export interface BackendDeviceRequestPayload {
  site_id: string
  quantity: number
  contact: string
  notes?: string | null
}

export interface BackendDeviceRequest {
  id: string
  site_id: string | null
  site_nom: string | null
  quantity: number
  contact: string
  notes: string | null
  unit_price_fcfa: number
  total_fcfa: number
  status: 'a_livrer' | 'livre'
  created_at: string | null
  delivered_at: string | null
}

export interface BackendAdminDeviceRequest extends BackendDeviceRequest {
  account: string | null
}

export interface BackendBoitierPrice {
  unit_price_fcfa: number
  currency: string
}

/** POST /api/machines/{id}/analyze-media */
export interface BackendMediaAnalysis {
  status: 'NORMAL' | 'ALERTE' | 'ERROR'
  description: string
  message?: string
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'energy_audit' | 'anomaly_report' | 'performance_report'
export type ReportFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx'

/** GET /api/v1/ml/drift (administrateurs) */
export interface BackendDriftFeature {
  feature_name: string
  psi: number
  ks_statistic: number
  ks_pvalue: number
  status: 'stable' | 'warning' | 'critical'
  reference_mean: number
  observed_mean: number
}
export interface BackendDriftReport {
  timestamp: string
  sample_size: number
  features: BackendDriftFeature[]
  global_status: 'stable' | 'warning' | 'critical'
  features_in_warning: number
  features_in_critical: number
}

/** GET /api/v1/ml/cold-start (administrateurs) : bascule par segment vers la prédiction par similarité. */
export interface BackendColdStartSegment {
  segment: 'menage' | 'pme' | 'industrie'
  active: boolean
  changed_at: string | null
  reference_accounts: number
  activate_threshold: number
  deactivate_threshold: number
  category_counts: Record<string, number>
  min_per_category: number
  mape_similarity: number | null
  mape_reference: number | null
  last_test_at: string | null
  reason: string | null
}
