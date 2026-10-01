export type Profile = 'menage' | 'pme' | 'industrie' | 'admin'

export type Level = 'debutant' | 'amateur' | 'technique'

/**
 * Une donnée est mesurée, estimée, ou synthétique, jamais inventée.
 * `mesure` n'est utilisé nulle part aujourd'hui (aucun capteur physique réel
 * n'alimente encore `sensor_metrics` côté backend) mais doit rester supportée
 * par tous les composants qui affichent une provenance.
 */
export type Provenance = 'mesure' | 'estime' | 'synthetique' | 'telemetrie_systeme'

export interface Session {
  /** UUID du compte côté backend. */
  userId: string
  /** Jeton JWT — envoyé en `Authorization: Bearer <token>` par l'API client. */
  token: string
  profile: Profile
  /** Rôle plateforme brut (distinct de `profile`, qui vaut 'admin' pour admin ET superadmin). */
  platformRole: 'admin' | 'superadmin' | null
  displayName: string
  subtitle: string
  formule: 'eco-essentiel' | 'eco-intelligent' | 'eco-premium' | null
  /**
   * Compte principal d'une équipe PME/Industrie (peut ajouter/retirer des
   * membres) — toujours `false` pour un Ménage ou un Admin, et pour un
   * membre d'équipe (voir `TeamMember.isOwner` pour distinguer les entrées
   * dans la liste elle-même).
   */
  isTeamOwner: boolean
  /**
   * Compte créé via le bouton "Essayer gratuitement" (landing, PricingSection),
   * jamais pour une inscription normale ou une demande d'audit — seul un
   * compte essai voit la bannière "Charger des données de démonstration"
   * (voir DemoDataBanner) sur un dashboard vide.
   */
  isTrial: boolean
}

export interface TeamMember {
  id: string
  nom: string
  email: string
  isOwner: boolean
  createdAt: string
  lastSignInAt: string | null
}

export interface ActionAlert {
  kind: 'action'
  id: string
  machineId: string
  level: string
  title: string
  detail: string
  basis: string
  provenance: Provenance
  ctaLabel: string
  ctaTarget?: string
}

export interface AutoAlert {
  kind: 'auto'
  id: string
  title: string
  detail: string
  timestamp: string
  provenance: Provenance
  journalRef?: string
}

export type Alert = ActionAlert | AutoAlert

export interface AlertHistoryEntry {
  id: string
  date: string
  title: string
  resolution: string
  registre: 'action' | 'auto'
}

export interface KpiWindow {
  label: string
  sampleCount?: number
}

export interface Kpi {
  id: string
  label: string
  value: string
  unit?: string
  note: string
  provenance: Provenance
  window?: KpiWindow
}

export interface PredictionSeriesPoint {
  label: string
  value: number
  displayValue: string
  percent: number
}

export interface Prediction {
  title: string
  value: string
  unit: string
  intervalLabel: string
  modelNote: string
  modelName: string
  provenance: Provenance
  series: PredictionSeriesPoint[]
  yAxisUnit: string
}

/** Heure : prochaines 24h, une barre par heure, en kW (puissance instantanée).
 * Jour : prochains 7 jours, une barre par jour, en kWh (énergie du jour).
 * Semaine : prochaines 4 semaines, une barre par semaine, en kWh. */
export type PredictionGranularity = 'heure' | 'jour' | 'semaine'

export interface PredictionsBundle {
  /** Somme des prédictions de tous les équipements du compte, point par point. `null` tant qu'aucun
   * équipement n'est enregistré (voir fetchPredictionsBundle) : état vide, pas une erreur. */
  global: Prediction | null
  /** Une prédiction par équipement, dans le même ordre que /api/machines. */
  perDevice: Prediction[]
}

export interface Advice {
  rank: string
  title: string
  detail: string
  impactLabel: string
  /** 'gain' : montant en FCFA ; 'severity' : repli sur la sévérité quand le backend ne chiffre aucun gain. */
  impactKind: 'gain' | 'severity'
  provenance: Provenance
  /** Identifiant de la machine concernée côté backend, pour lier une action à son équipement. */
  machineId?: string
  /** Étapes de dépannage concrètes (voir backend/ml/troubleshooting_advice.py) — présent
   * uniquement pour les conseils de type alerte (anomalie/surchauffe/vibration). */
  troubleshooting?: string[]
  /** Référence stable (machine:type:titre) pour « Marquer comme appliquée » (Recommandations, PME/Industrie
   * uniquement) : reprend la recommandation dans le plan d'action puis la passe au statut fait. Présent
   * uniquement quand la recommandation a un gain chiffré (impactKind === 'gain'). */
  sourceRef?: string
  gainFcfa?: number
}

export interface EquipmentRow {
  id: string
  categorie: string
  marque: string
  modele: string
  site: string
  priorite: 'Haute' | 'Moyenne' | 'Basse'
  statut: string
  provenance: Provenance
}

export interface MachineRow {
  id: string
  machine: string
  temperature: string
  vibration: string
  pression: string
  statut: string
  priorite: 'Haute' | 'Moyenne' | 'Basse'
  provenance: Provenance
}

/** Résultat d'un « Vérifier et résoudre » (relevé refait puis comparé aux seuils d'alerte). */
export interface AnomalyResolution {
  id: string
  /** Horodatage UTC déjà formaté (jj/mm/aaaa hh:mm:ss). */
  date: string
  machineLabel: string
  resolved: boolean
  /** « Résolue : 24,9 °C · 45,8 Hz, sous les seuils » ou « L’anomalie persiste : … ». */
  resultLabel: string
  provenance: Provenance
}

export type PlanStatus = 'a_faire' | 'en_cours' | 'fait' | 'abandonne'

export interface ActionPlanItem {
  id: string
  title: string
  detail: string
  /** Gain estimé (FCFA) tel que calculé par le moteur de recommandation : une estimation, jamais une mesure. */
  gain: number
  amountLabel: string
  status: PlanStatus
  statusLabel: string
  provenance: Provenance
}

export interface ActionPlanSummary {
  potentialLabel: string
  doneLabel: string
  openCount: number
  doneCount: number
  totalCount: number
}

export interface AuditEvent {
  id: string
  /** Horodatage UTC déjà formaté. */
  time: string
  actor: string
  action: string
  /** Détail avec nombres à la française. */
  detail: string
  category: string
  categoryLabel: string
  /** Compte concerné (vue Admin uniquement). */
  account?: string
  provenance: Provenance
}

export interface AuditPageData {
  total: number
  events: AuditEvent[]
  categories: { id: string; label: string; count: number }[]
}

export interface OcrField {
  key: string
  label: string
  value: string
  provenance: Provenance
  editable: boolean
}

export interface InvoiceRecord {
  id: string
  period: string
  status: 'traitee' | 'en_cours'
  fields: OcrField[]
  /** true si cette facture vient d'une photo uploadée (source ocr/ocr-mock) —
   * seul ce cas a une photo à montrer via le bouton "Voir plus". */
  hasPhoto: boolean
  /** Valeurs brutes pour pré-remplir la modale « Modifier ». */
  raw: { month: string; amountXof: number | null; kwhConsumed: number | null }
  /** Prévision statistique (non saisie par l'utilisateur). */
  isForecast: boolean
}

export interface AdminPanel {
  id: string
  title: string
  meta: string
  badge: string
  rows: { label: string; value: string }[]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  profile: Profile
  status: 'actif' | 'suspendu' | 'supprime'
  isSuspended: boolean
  isDeleted: boolean
  lastLogin: string
  provenance: Provenance
  platformRole: 'admin' | 'superadmin' | null
  /** Compte d'équipe (voir app/api/v1/team/, backend) : null si compte principal. */
  ownerId: string | null
  ownerName: string | null
  /** Libellé affiché tel quel dans le tableau admin : "Compte principal", "Membre — {entreprise}", ou "—" (Ménage/Admin, non applicable). */
  accountLabel: string
}

/** Prédiction compacte d'un équipement, pour la fiche détail d'un utilisateur côté Admin
 * (pas besoin du détail complet de Prediction — juste la valeur à l'heure suivante). */
export interface AdminMachinePrediction {
  machineId: string
  nom: string
  nextHourValue: string | null
  error: string | null
}

export interface JournalEntry {
  id: string
  /** Horodatage UTC déjà formaté. */
  time: string
  type: string
  detail: string
  /** Compte concerné (vue Admin uniquement). */
  account?: string
}

export type Thresholds =
  | { kind: 'global'; kwh: number }
  | { kind: 'per-equipment'; items: { equipmentId: string; label: string; kwh: number }[] }
  | { kind: 'multi-level'; warningPct: number; criticalPct: number; urgentPct: number }

export interface ConsumptionPost {
  label: string
  percent: number
  provenance: Provenance
}

export interface ConsumptionSeries {
  granularity: 'quotidien'
  points: PredictionSeriesPoint[]
  yAxisUnit: string
  provenance: Provenance
  byPost: ConsumptionPost[]
}

export interface Report {
  id: string
  period: string
  headline: string
  body: string
  provenance: Provenance
}

export interface TariffInfo {
  rateLabel: string
  nowLabel?: string
}

export interface LandingChartBar {
  x: string
  value: number
  tip: string
}

export interface LandingChart {
  id: string
  headline: string
  label: string
  axisY: string
  axisX: string
  source: string
  ticks: string[]
  min: number
  max: number
  gapPx: number
  bars: LandingChartBar[]
}
