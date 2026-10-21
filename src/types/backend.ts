/**
 * Formes brutes exactement telles que renvoyées par le backend réel
 * (herverenard147/NouanKanyAI, feature/merge-steph-ml-subsystem), vérifiées
 * endpoint par endpoint contre /docs et des appels réels. Utilisé uniquement
 * par la couche `api/` pour construire les types "vue" de `types/domain.ts`
 * que le reste de l'app consomme sans changement : voir api/README dans
 * chaque module pour le mapping.
 */

export type BackendPlatformRole = 'admin' | 'superadmin' | 'technicien' | null

export interface BackendUser {
  id: string
  email: string
  nom: string
  type_compte: string
  role: string
  platform_role: BackendPlatformRole
  owner_id: string | null
  is_trial: boolean
  /** Compte de démonstration décidé par le serveur (jamais par l'adresse). */
  is_demo?: boolean
  /** Adresse confirmée par le lien reçu par email. */
  email_verified?: boolean
  /** Avis non indispensables par email (relevé, alerte, abonnement). */
  email_notifications?: boolean
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
  /** Jeton d'accès, valable 30 minutes. */
  token: string
  /** Jeton de renouvellement à usage unique (30 jours), échangé par POST /api/auth/refresh. */
  refresh_token?: string
  user: BackendUser
}

export interface BackendSite {
  id: string
  nom: string
  localisation: string
  user_id: string
  /** Puissance souscrite lue sur la facture CIE (2026-10-20) : ampères (basse tension), kVA ou kW. */
  souscription_valeur?: number | null
  souscription_unite?: SubscriptionUnit | null
  cos_phi?: number | null
  cos_phi_retenu?: number
  souscription_kw?: number | null
  /** Compteur à facture (« postpaye ») ou à carte, qu'on recharge (« prepaye ») : 2026-10-20. */
  compteur_type?: MeterType
}

export type SubscriptionUnit = 'A' | 'kVA' | 'kW'
export type MeterType = 'postpaye' | 'prepaye'

/** GET /api/v1/consumption/pic : pic tenu d'une journée, site par site. */
export interface BackendPowerPeak {
  jour: string
  en_cours: boolean
  fenetres_min: number[]
  sites: BackendSitePeak[]
}

export interface BackendSitePeak {
  site_id: string | null
  site_nom: string
  source: 'compteur_general' | 'somme_appareils'
  appareils: number
  ecart_releves_min: number | null
  /** `amperes` : calibre du disjoncteur (saisi en A, ou tiré des kVA) ; null en kW (moyenne tension). */
  souscription: { valeur: number; unite: SubscriptionUnit; cos_phi: number; kw: number; amperes?: number | null } | null
  /** Basse tension : les pics sont aussi donnés en ampères (A = kW × 1000 / (220 × cos φ)). */
  basse_tension?: boolean
  /** Clés « 10 », « 15 », « 60 » : null si les relevés sont trop espacés pour cette durée, ou absents. */
  pics: Record<string, { kw: number; debut: string; amperes?: number | null } | null>
  quarts_kw: (number | null)[]
  depassements: { debut: string; fin: string; minutes: number; max_kw: number }[]
}

export interface BackendMachine {
  machine_id: string // code_interne
  nom: string
  site_id: string | null
  site_nom: string
  power_kw: number
  /** Puissance de plaque déclarée (power_kw est la dernière mesure quand il y en a une). */
  puissance_nominale_kw?: number | null
  // Vides tant qu'aucun relevé n'existe (le backend n'invente plus de mesures).
  temperature_c: number | null
  vibration_mm_s: number | null
  pressure_bar: number | null
  has_reading?: boolean
  equipment_reference_id?: string | null
  /** Consommation journalière attendue d'après la fiche du référentiel : toujours une estimation. */
  estimation_reference?: { kwh_jour: number; cout_jour_fcfa: number; heures_par_jour: number; puissance_kw: number; provenance: 'estime'; source: string; confiance: string } | null
  status: string
  priority: string
  categorie: string | null
  marque: string | null
  modele: string | null
  numero_serie: string | null
  /** Année de mise en service, facultative : sert à chiffrer le vieillissement. */
  annee_mise_en_service?: number | null
  photo_data_url?: string | null
}

export interface BackendCatalogModel {
  nom: string
  puissance_kw: number
  /** Présents sur les modèles du référentiel validé (table equipment_reference). */
  kwh_an?: number | null
  classe?: string | null
  source?: string
  confiance?: 'fabricant' | 'eprel' | 'energystar' | 'etiquette_ci' | 'revendeur' | 'estimee'
  /** Identifiant de la fiche du référentiel, renvoyé à l'ajout pour relier l'appareil. */
  reference_id?: string
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
  annee_mise_en_service?: number
  quantite?: number
  site_id?: string
  photo_data_url?: string
  /** Fiche du référentiel choisie dans le catalogue. */
  reference_id?: string
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
    /** Lu sur la plaque signalétique (test du site, 2026-10-18 : il n'était pas repris). */
    numero_serie?: string | null
    categorie_connue: boolean
    /** Plaque absente ou illisible : estimation à vérifier (fiche du modèle, sinon médiane de la famille). */
    puissance_estimee?: { puissance_kw: number; methode: 'fiche' | 'famille'; detail: string; reference_id?: string } | null
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
  annee_mise_en_service?: number
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

/** Diagnostic déterministe (médiane/MAD/tendance, ml/diagnostic.py) : null tant que
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
  /** « mesure » : dernière mesure réelle du capteur de l'appareil (moins de 15 minutes) ; sinon simulée. */
  provenance: 'simulation' | 'mesure'
  resolved: boolean
  temperature_c: number
  vibration_mm_s: number
  pressure_bar: number
  power_kw: number
  diagnostic: BackendMachineDiagnostic | null
  /** Alertes du registre fermées par cette vérification (elles passent « à documenter »). */
  closed_alert_ids?: string[]
}

/** Une alerte du registre (GET /api/v1/alerts) : jamais supprimée, fermée avec la façon dont elle l'a été. */
export interface BackendAlertEntry {
  id: string
  machine_code: string | null
  machine_nom: string | null
  kind: string | null
  kind_label: string | null
  level: 'alerte' | 'a_verifier' | 'ecart_prevision' | 'anticipee' | null
  source: 'boitier' | 'moteur' | 'photo' | null
  title: string | null
  description: string | null
  action: string | null
  reco: { id: string | null; version: number | null; cause: string | null; steps: string[] }
  opened_provenance: 'mesure' | 'simulation' | 'image' | null
  created_at: string | null
  last_seen_at: string | null
  is_open: boolean
  closed_at: string | null
  closure_trigger: 'auto' | 'verification' | 'commande' | null
  closure_provenance: 'mesure' | 'simulation' | null
  resolution: 'nouankany' | 'intervention' | 'seule' | 'fausse_alerte' | 'remplacee' | 'arrivee' | 'inconnue' | null
  needs_feedback: boolean
  /** Épisodes et suivi (2026-10-20) : revenue dans les 24 h, prise en charge, appareil sans nouveau relevé. */
  reopen_count?: number
  reopened_at?: string | null
  taken_at?: string | null
  taken_by_nom?: string | null
  last_reading_at?: string | null
  mute?: boolean
  feedback: {
    did_something: boolean
    problem: string
    problem_detail: string | null
    action: string
    action_detail: string | null
    reco_useful: string | null
    cost_fcfa: number | null
    downtime_hours: number | null
    learning_eligible: boolean
    /** Documentée par un technicien Nouankany en intervention (2026-10-16). */
    by_technician?: boolean
    created_at: string | null
  } | null
}

export type BackendAlertStatus = 'toutes' | 'ouvertes' | 'fermees' | 'a_documenter'

export interface BackendAlertFeedbackIn {
  did_something: boolean
  problem: string
  problem_detail?: string
  action: 'reco_suivie' | 'autre_action' | 'technicien' | 'rien'
  action_detail?: string
  reco_useful?: 'oui' | 'en_partie' | 'non'
  cost_fcfa?: number
  downtime_hours?: number
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
  handled_at?: string | null
  exported_at?: string | null
}

export type ContactMessageFilter = 'a_traiter' | 'traites' | 'tous'

export interface BackendContactMessagePage {
  items: BackendContactMessage[]
  total: number
  page: number
  per_page: number
}

export interface BackendMachineHistoryPoint {
  recorded_at: string
  power_kw: number
  temperature_c: number
  vibration_mm_s: number
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
  vibration_max_mm_s: number
  surconsommation_ratio: number
  /** Panneau « Automatisation IA » (Réglages) : jamais activé par défaut. */
  auto_resolve_enabled: boolean
}

/** GET /api/v1/billing : ce que le compte paie à Nouankany (voir backend/billing/). */
export type BillingTierId = 'decouverte' | 'essentiel' | 'optimum' | 'decouverte_pro'
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
  /** Ajustement IPMVP de la ligne de base (kWh), avec son motif. */
  baseline_adjustment_kwh?: number | null
  baseline_adjustment_note?: string | null
  puissance_souscrite_kva?: number | null
  start_month: string | null
  end_month: string | null
  status: 'actif' | 'termine'
}
export interface BackendBillingStatement {
  id: string
  month: string
  /** « indicatif » : relevé calculé, pas une facture (facturation réelle pas encore ouverte). */
  status: 'en_attente_facture' | 'indicatif' | 'a_payer' | 'paye'
  baseline_kwh: number | null
  actual_kwh: number | null
  savings_kwh: number | null
  savings_fcfa: number | null
  saas_fee_fcfa: number | null
  savings_share_fcfa: number | null
  audit_fee_fcfa: number | null
  total_fcfa: number | null
  detail: { formule?: string; etapes?: string[]; raison?: string; palier_nom?: string; mention?: string; bareme_a_confirmer?: boolean; bareme_note?: string }
  paid_at: string | null
  /** Échéance du relevé à payer (billing/payment.py). */
  due_at?: string | null
}
export interface BackendBilling {
  segment: 'menage' | 'pme_industrie'
  /** Services coupés pour impayé, 15 jours après l'échéance (décision du propriétaire, 2026-10-19). */
  services?: { coupes: boolean; detail: string | null; releve_id: string | null }
  contract: BackendBillingContract | null
  effective_tier: BillingTierId | null
  /** Ce que le compte peut faire maintenant. `tier` : formule du contrat (celle qui reste après un essai). */
  access?: {
    tier: BillingTierId | null
    reason: 'demonstration' | 'essai' | null
    max_machines: number | null
    /** Droits par formule (2026-10-21) : logements, appareils prévus, détection d'anomalies. null : sans limite. */
    max_logements?: number | null
    max_previsions?: number | null
    assistant_ia: boolean
    alertes_avancees: boolean
    detection_anomalies?: boolean
    /** Codes des appareils dont la consommation est prévue ; null : tous. */
    appareils_prevus?: string[] | null
    trial_ends_at?: string
  }
  tiers: BackendBillingTier[]
  /** Palier gratuit d'une PME sans contrat. */
  pme_free_tier?: BackendBillingTier
  real_billing_enabled?: boolean
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
  baseline_adjustment_kwh?: number | null
  baseline_adjustment_note?: string
  puissance_souscrite_kva?: number | null
  start_month?: string
}

export type BackendBillSource = 'manuel' | 'ocr' | 'ocr-mock' | 'statistique' | 'demo'
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
  /** 2 pour une facture bimestrielle : ses kWh sont répartis sur deux mois. */
  period_months?: number
  /** Une facture n'entre dans un relevé qu'une fois validée par un administrateur. */
  validation_status?: 'en_attente' | 'validee' | 'rejetee'
  created_at: string
  /** Puissance souscrite lue sur la facture et ce qui en a été fait (2026-10-20). */
  souscription_lue?: { valeur: number; unite: SubscriptionUnit; enregistree: boolean; site: string | null; raison: string | null } | null
}
export interface BackendNewManualBill {
  month: string
  amount_xof: number
  kwh_consumed?: number
  period_months?: number
}
export interface BackendPendingBill {
  id: string
  month: string
  period_months: number
  kwh_consumed: number | null
  amount_xof: number | null
  source: BackendBillSource
  document_type: BackendBillDocumentType | null
  has_photo: boolean
  validation_status: 'en_attente' | 'validee' | 'rejetee'
  user_id: string
  user_nom: string
  user_email: string
  /** Contrôle du justificatif à l'envoi ; null pour une facture envoyée avant ce contrôle. */
  verification: BackendBillVerification | null
  compteur_cie: string | null
}
export interface BackendBillVerification {
  document: 'facture_cie' | 'inconnu' | null
  numero: 'ok' | 'a_verifier' | 'sans_numero_compte' | 'non_lu'
  numero_lu: string | null
  chiffres: 'ok' | 'non_lu' | 'lus_sur_photo'
}
export interface BackendBillPhoto {
  photo_data_url: string
}

/** 'alerte' : un seuil est franchi sur la dernière mesure ; 'a_verifier' : un écart à l'habitude SOUS le seuil, pas un
 * danger établi (niveaux de signalement, 2026-10-15, ml/recommendation_engine.py). */
export type BackendRecommendationType = 'alerte' | 'a_verifier' | 'optimisation' | 'délestage' | 'efficacite'
export type BackendRecommendationSeverity = 'critique' | 'modérée' | 'faible'
export interface BackendRecommendation {
  machine_id: string
  type: BackendRecommendationType
  severity: BackendRecommendationSeverity
  title: string
  description: string
  action: string
  gain_fcfa: number
  /** Période du gain : par action menée, par jour, par mois. Absente sur une ancienne réponse. */
  gain_periode?: 'action' | 'jour' | 'mois'
  auto_resolu: boolean
  /** Conseils tirés du référentiel d'équipements : une estimation, pas une donnée simulée. */
  alternative?: { marque: string; modele: string; inverter: boolean; source: string; confiance: string }
  vieillissement?: { age_ans: number; surconsommation_pct: number }
  /** Étapes de dépannage concrètes, adaptées à la catégorie de l'équipement : présent
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
  /** Appareils sans prévision (pas de relevé, mesures absentes). */
  sans_prevision?: number
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
  provenance: 'simulation' | 'mesure'
  resolved: boolean
  temperature_c: number | null
  vibration_mm_s: number | null
  pressure_bar: number | null
  power_kw: number | null
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
    /** Modèle v2 (prévisions avec historique) : le gain sur la moyenne de chaque machine est la
     * vraie mesure de son apport, le R² seul est trompeur. */
    xgboost_v2?: {
      r2?: number | null
      mae_kw?: number | null
      mae_moyenne_machine_kw?: number | null
      gain_vs_moyenne_machine?: number | null
      trained_at?: string | null
      peak_hours?: number[] | null
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
  status?: BackendPlanStatus
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
  vibration_mm_s: number | null
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

/** Type de source de mesures (backend `devices.kind`, 2026-10-16). */
export type BackendSourceKind = 'vocal' | 'passerelle' | 'logiciel' | 'fichier' | 'capteur'

export interface BackendDevice {
  id: string
  nom: string
  kind?: BackendSourceKind
  /** Capteur d'un appareil (2026-10-16) : l'appareil mesuré et ce que porte le capteur. */
  machine_code?: string | null
  machine_nom?: string | null
  has_relay?: boolean
  has_temperature_probe?: boolean
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
  /** Boîtier ou passerelle : code d'appairage, montré une seule fois. */
  pairing_code: string | null
  pairing_expires_at: string | null
  /** Logiciel du client ou fichiers : clé remise une seule fois. */
  secret?: string | null
}

export interface BackendDeviceCreatePayload {
  nom: string
  site_id?: string | null
  scope?: 'site' | 'account'
  language?: 'fr' | 'en'
  kind?: BackendSourceKind
  machine_code?: string
  relay?: boolean
  temperature_probe?: boolean
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
  // « sent » : ordre envoyé au capteur de l'appareil, en attente de son acquittement (2026-10-16).
  status: 'proposed' | 'confirmed' | 'sent' | 'executed' | 'failed' | 'expired' | 'cancelled'
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
  /** Matériel demandé (2026-10-21). */
  kind?: HardwareKind
  site_id: string
  quantity: number
  contact: string
  notes?: string | null
}

export interface BackendDeviceRequest {
  id: string
  site_id: string | null
  site_nom: string | null
  kind?: HardwareKind
  kind_nom?: string | null
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

export type HardwareKind = 'vocal' | 'capteur' | 'passerelle'

/** Prix d'un matériel, somme de ses lignes (composants, frais, marge), 2026-10-21. */
export interface BackendHardwarePrice {
  kind: HardwareKind
  nom: string
  description: string
  prix_fcfa: number
  lignes: { libelle: string; fcfa: number; groupe: 'materiel' | 'frais' | 'marge' }[]
  non_compris: string[]
}

export interface BackendBoitierPrice {
  unit_price_fcfa: number
  currency: string
  materiels?: BackendHardwarePrice[]
}

/** POST /api/machines/{id}/analyze-media */
export interface BackendMediaAnalysis {
  /** "simulation" en mode AI_MODE=mock : rien n'a été analysé ni enregistré. */
  provenance?: 'ia' | 'simulation'
  status: 'NORMAL' | 'ALERTE' | 'ERROR'
  description: string
  message?: string
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'energy_audit' | 'anomaly_report' | 'performance_report'
export type ReportFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx'

/** GET /api/v1/ml/collecte : mesures réelles envoyées par les boîtiers, seules à servir au réentraînement. */
export interface BackendCollectionStatus {
  releves_reels: number
  machines_mesurees: number
  machines_avec_un_mois: number
  seuil_reentrainement: { machines: number; heures_par_machine: number; couverture: number }
  pret_pour_reentrainement: boolean
}
/** GET /api/v1/ml/collecte/appareils (administrateurs) */
export interface BackendCollectionMachine {
  code: string
  nom: string
  categorie: string | null
  type_compte: string | null
  releves: number
  debut: string | null
  fin: string | null
  heures_periode: number
  heures_mesurees: number
  /** Part des heures de la période qui ont au moins une mesure, de 0 à 1. */
  couverture: number
  pret: boolean
}
/** GET /api/v1/ml/previsions/bilan (administrateurs) */
export interface BackendForecastReview {
  periode_jours: number
  previsions_servies: number
  lignes: {
    methode: string
    modele: string | null
    famille: string | null
    previsions: number
    heures_mesurees: number
    erreur_moyenne_kw: number
    erreur_relative: number | null
  }[]
}

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
  /** « insuffisant » : trop peu de vrais relevés (2026-10-21), la dérive ne se mesure que sur les boîtiers des clients. */
  global_status: 'stable' | 'warning' | 'critical' | 'insuffisant'
  features_in_warning: number
  features_in_critical: number
  min_sample_size?: number
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


// --- Sources de mesures (passerelle, logiciel du client, fichiers) et accès technicien (2026-10-16) ---

export interface BackendMeterTemplate {
  key: string
  label: string
  measures: string[]
}

export type BackendMeterStatus = 'a_tester' | 'actif' | 'a_verifier'

export interface BackendMeterPoint {
  id: string
  machine_code: string | null
  machine_nom: string | null
  template: string
  template_label: string
  protocol: 'rtu' | 'tcp'
  slave_id: number
  host: string | null
  port: number | null
  baudrate: number | null
  status: BackendMeterStatus
  last_test_at: string | null
  last_test_detail: string | null
}

export interface BackendMeterRegister {
  address: number
  scale: number
  abs?: boolean
}

export interface BackendCustomMeterMap {
  function: 3 | 4
  data_type: 'float32' | 'float32_swapped' | 'int32' | 'uint32' | 'int16' | 'uint16'
  registers: Partial<Record<'power_kw' | 'energy_kwh' | 'voltage_v' | 'current_a' | 'power_factor', BackendMeterRegister>>
}

export interface BackendMeterPointCreate {
  machine_code: string
  template: string
  protocol: 'rtu' | 'tcp'
  slave_id: number
  host?: string | null
  port?: number | null
  baudrate?: number | null
  custom_map?: BackendCustomMeterMap | null
}

export interface BackendSourceAlias {
  external_ref: string
  machine_code: string
}

export interface BackendKeyRenewed {
  device_id: string
  secret: string
}

export interface BackendFileMapping {
  date_column: string
  appliance_column?: string | null
  machine_code?: string | null
  utc_offset_hours?: number
  power?: { column: string; unit: 'W' | 'kW' | 'MW' } | null
  energy?: { column: string; unit: 'Wh' | 'kWh' | 'MWh'; kind: 'index' | 'intervalle'; interval_minutes?: number } | null
  power_factor?: { column: string; percent: boolean } | null
  voltage_column?: string | null
  current_column?: string | null
  temperature_column?: string | null
  vibration_column?: string | null
  pressure_column?: string | null
}

export interface BackendFilePreview {
  columns: string[]
  rows: string[][]
  total_rows: number
  mapping: BackendFileMapping | null
}

export interface BackendSourceFile {
  id: string
  filename: string | null
  via: 'depot_automatique' | 'plateforme'
  status: 'traite' | 'refuse'
  lines: number
  accepted: number
  rejected: number
  /** JSON : {"raison": "..."} pour un fichier refusé, {"refus": [{ligne, raison}]} sinon. */
  detail: string | null
  received_at: string | null
}

export interface BackendTechnicianAccess {
  active: boolean
  starts_at: string | null
  expires_at: string | null
  note: string | null
}

export interface BackendInterventionAccount {
  id: string
  nom: string
  type_compte: string | null
  expires_at: string
  note: string | null
}

export interface BackendInstallation {
  sites: { id: string; nom: string }[]
  appareils: { code: string; nom: string; categorie: string | null; puissance_nominale_kw: number | null; site_id: string | null }[]
}

/** GET /api/v1/consumption : consommation réelle calculée à partir des relevés (correction 7, 2026-10-19). */
export type ConsumptionGranularity = 'hour' | 'day' | 'week' | 'month'
export type BackendConsumptionProvenance = 'mesure' | 'declare' | 'demonstration' | 'simulation'

export interface BackendConsumptionMachine {
  code: string
  nom: string
  categorie: string | null
  kwh: number
  cout_fcfa: number
  couverture_pct: number
  part_pct: number | null
  provenance: BackendConsumptionProvenance | null
  points: (number | null)[]
}

export interface BackendConsumptionBand {
  plage: 'creuses' | 'pleines' | 'pointe'
  heures: string
  prix_fcfa_kwh: number
  kwh: number
  part_pct: number | null
}

export interface BackendConsumptionTariff {
  kind: 'plages_horaires' | 'tranches_bimestre'
  explication: string
  plages?: BackendConsumptionBand[]
  tranches?: { tranche: number; prix_fcfa_kwh: number; jusqu_a_kwh_par_kva?: number; au_dela?: boolean }[]
  prime_fixe_bimestre_fcfa?: number
  kwh_61_derniers_jours?: number
}

export interface BackendConsumption {
  /** Compteur à carte : prix réellement payé par kWh d'après les recharges ; null sinon (barème). */
  prix_reel_kwh?: number | null
  granularity: ConsumptionGranularity
  since: string
  until: string
  segment: 'menage' | 'pme' | 'industrie'
  labels: string[]
  starts: string[]
  total: { kwh: number; cout_fcfa: number; couverture_pct: number; points: (number | null)[]; couts: (number | null)[] }
  machines: BackendConsumptionMachine[]
  tarif: BackendConsumptionTariff
  prix_note: string
  factures_kwh_par_mois: { mois: string; kwh: number }[]
  /** Puissance moyenne (kW) par jour de la semaine (lundi d'abord) et par heure, sur les 4 dernières semaines. */
  habitudes?: BackendConsumptionHabits | null
}

export interface BackendConsumptionHabits {
  semaines: number
  /** 7 lignes (lundi à dimanche) de 24 valeurs ; `null` : aucune mesure à cette heure-là. */
  kw: (number | null)[][]
}

/** GET /api/v1/notifications : tout ce qui notifie le compte (correction 8, 2026-10-19). */
export interface BackendNotification {
  id: string
  kind: 'alerte' | 'retour' | 'facture' | 'releve' | 'plan' | 'boitier' | 'conseil' | 'collecte' | 'prepaye' | 'admin'
  title: string
  detail: string
  at: string | null
  /** Page et ancre de l'élément, par exemple « /app/factures#facture-<id> ». */
  link: string
  level: string
  /** Code de l'appareil concerné (alertes), pour ne pas répéter la même panne en conseil. */
  machine?: string | null
}

/** Numéro de compteur CIE du compte, verrouillé (décision du propriétaire, 2026-10-19). */
export interface BackendCompteurDemande {
  id: string
  user_id: string
  ancien: string | null
  nouveau: string
  motif: string | null
  status: 'en_attente' | 'acceptee' | 'refusee'
  created_at: string | null
  decided_at: string | null
  note: string | null
  justificatif_data_url?: string
  user_nom?: string
  user_email?: string
}

export interface BackendCompteur {
  numero: string | null
  source: 'saisie' | 'facture' | 'admin' | null
  fixe_le: string | null
  verrouille: boolean
  demande: BackendCompteurDemande | null
}

/** GET /api/v1/consumption/compteur-general : compteur général d'un site comparé à la somme des appareils. */
export interface BackendMainMeter {
  code: string
  nom: string
  site: string
  appareils_suivis: number
  compteur_kwh: number
  appareils_kwh: number
  ecart_kwh: number
  /** Part de la consommation du compteur que les appareils ne voient pas (négative : les appareils le dépassent). */
  ecart_pct: number | null
  couverture_compteur_pct: number
  couverture_appareils_pct: number
  verdict: string
  points_compteur: (number | null)[]
  points_appareils: (number | null)[]
}
export interface BackendMainMeterComparison {
  granularity: ConsumptionGranularity
  labels: string[]
  compteurs: BackendMainMeter[]
}

/** GET /api/v1/consumption/appareil/{code} : page d'un appareil (2026-10-20). */
export interface BackendApplianceDetail {
  code: string
  nom: string
  categorie: string | null
  puissance_nominale_kw: number | null
  periode: '24h' | '7j' | '30j'
  pas_min: number
  starts: string[]
  puissance_kw: (number | null)[]
  temperature_c: (number | null)[]
  vibration_mm_s: (number | null)[]
  pression_bar: (number | null)[]
  seuils: { puissance_kw: number | null; temperature_max_c: number | null; vibration_max_mm_s: number | null }
  jours: { jour: string; kwh: number; cout_fcfa: number }[]
  kwh: number
  cout_fcfa: number
  couverture_pct: number
  heures_marche_par_jour: number | null
  part_compte_pct: number | null
  attendu_kwh_jour: number | null
  attendu_source: string | null
  kwh_par_jour: number | null
  ecart_attendu_pct: number | null
  habitude: { semaine: (number | null)[]; weekend: (number | null)[] }
  derniere_mesure_at: string | null
}

/** Compteur à carte (2026-10-20) : GET /api/v1/prepaye, un élément par logement à carte. */
export interface BackendRecharge {
  id: string
  site_id: string
  date: string
  montant_fcfa: number
  kwh: number | null
  prix_kwh: number | null
  source: 'manuel' | 'photo'
}

export interface BackendPrepaid {
  site_id: string
  nom: string
  credit: {
    kwh: number | null
    jours: number | null
    epuise_le: string | null
    rythme_kwh_jour: number | null
    source_rythme: 'compteur_general' | 'recharges' | 'appareils' | 'factures' | 'appareils_declares' | null
    reference: 'releve' | 'recharge' | null
    reference_le: string | null
  }
  bientot_epuise: boolean
  releve: { kwh: number; le: string } | null
  prix_kwh_reel: number | null
  /** Prévision sur 30 jours au rythme estimé (2026-10-21). */
  prevision_30j: { kwh: number; fcfa: number | null; recharges: number | null; montant_habituel_fcfa: number | null } | null
  recharges: BackendRecharge[]
}

/** Prix du matériel réglés par un administrateur (2026-10-21) : GET/PUT/DELETE /api/v1/boitiers/admin/prix. */
export interface PricingLineInput {
  libelle: string
  fcfa: number
}

export interface PricingKindConfig {
  nom: string
  description: string
  composants: PricingLineInput[]
  frais: PricingLineInput[]
  non_compris: string[]
}

export interface PricingConfig {
  import_rate: number
  margin_rate: number
  kinds: Record<HardwareKind, PricingKindConfig>
}

export interface BackendPricingView {
  config: PricingConfig
  defaults: PricingConfig
  materiels: BackendHardwarePrice[]
  modifie: boolean
  modifie_le: string | null
  modifie_par: string | null
}
