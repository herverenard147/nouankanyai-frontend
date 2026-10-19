import { formatFcfa } from '@/lib/formatters'
import { getCachedAdminMetrics, rawBilling, getCachedMachines, getCachedRecommend, hasReading } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { Kpi, KpiWindow, Profile } from '@/types/domain'

const CLIENT_KPI_IDS = ['puissance-totale', 'machines-actives', 'economies-mois', 'anomalies-actives'] as const
const ADMIN_KPI_IDS = ['base-donnees', 'uptime', 'latence-moyenne', 'machines-plateforme'] as const

const CLIENT_LABELS: Record<(typeof CLIENT_KPI_IDS)[number], string> = {
  'puissance-totale': 'Puissance active totale',
  'machines-actives': 'Machines actives',
  'economies-mois': 'Économies estimées ce mois',
  'anomalies-actives': 'Machines en anomalie',
}

/** Vocabulaire du quotidien pour le seul profil Ménage (partie H1) : « appareils » plutôt que
 * « machines », « à surveiller » plutôt qu'« anomalie ». PME, Industrie et Admin gardent les leurs. */
const MENAGE_LABELS: typeof CLIENT_LABELS = {
  'puissance-totale': 'Consommation en ce moment',
  // « En marche » laissait croire à une mesure : c'est le nombre d'appareils sans alerte (test du site, 2026-10-18).
  'machines-actives': 'Appareils sans alerte',
  'economies-mois': 'Économies estimées ce mois',
  'anomalies-actives': 'Appareils à surveiller',
}

/** PME : « équipements », comme partout ailleurs dans son espace (test du site, 2026-10-18 : « machines » ici seulement). */
const PME_LABELS: typeof CLIENT_LABELS = {
  'puissance-totale': 'Puissance active totale',
  'machines-actives': 'Équipements sans alerte',
  'economies-mois': 'Économies estimées ce mois',
  'anomalies-actives': 'Équipements en anomalie',
}

const ADMIN_LABELS: Record<(typeof ADMIN_KPI_IDS)[number], string> = {
  'base-donnees': 'Base de données',
  uptime: 'Uptime du processus',
  'latence-moyenne': 'Latence API moyenne',
  'machines-plateforme': 'Machines actives (plateforme)',
}

/** Vitrine synchrone : le titre (et la fenêtre, pour l'admin) reste affiché même
 * pendant le chargement ou en cas d'échec de la query de valeur : voir CLAUDE.md
 * du backend, `LATENCY_WINDOW_SECONDS = 300` dans main.py pour la fenêtre admin. */
export function kpiIdsFor(profile: Profile): string[] {
  return profile === 'admin' ? [...ADMIN_KPI_IDS] : [...CLIENT_KPI_IDS]
}

export function kpiMeta(profile: Profile, kpiId: string): { label: string; window?: KpiWindow } {
  if (profile === 'admin') {
    const label = ADMIN_LABELS[kpiId as (typeof ADMIN_KPI_IDS)[number]]
    const window = kpiId === 'latence-moyenne' ? { label: '5 min' } : undefined
    return { label, window }
  }
  const labels = profile === 'menage' ? MENAGE_LABELS : profile === 'pme' ? PME_LABELS : CLIENT_LABELS
  return { label: labels[kpiId as (typeof CLIENT_KPI_IDS)[number]] }
}

export function kpiSectionTitle(profile: Profile): string {
  return profile === 'admin' ? 'Santé de la plateforme' : 'Consommation et économies'
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return days > 0 ? `${days} j ${hours} h` : `${hours} h`
}

async function fetchClientKpiSet(profile: Profile): Promise<Record<string, Kpi>> {
  const labels = profile === 'menage' ? MENAGE_LABELS : profile === 'pme' ? PME_LABELS : CLIENT_LABELS
  const noun = profile === 'menage' ? 'appareil' : profile === 'pme' ? 'équipement' : 'machine'
  const plural = (count: number) => (count > 1 ? 's' : '')
  // Les 4 indicateurs client viennent des 2 mêmes requêtes (machines, facturation) : une seule fois pour
  // toute la bande, pas une fois par indicateur (KpiStrip montait 4 KpiTile, chacun refetchait tout).
  const [machines, billing] = await Promise.all([getCachedMachines(), rawBilling()])
  const lastStatement = billing.statements.find((s) => s.total_fcfa !== null)
  const activeMachines = machines.filter((m) => m.status === 'actif')
  // Une machine est en anomalie si son statut le dit OU si le diagnostic liste une alerte pour elle :
  // la vue d'ensemble affichait « Aucune alerte active » à côté d'une alerte listée (audit du 2026-10-12).
  const diagnosed = await alertedMachineIds(machines)
  const alerteMachines = machines.filter((m) => m.status === 'alerte' || diagnosed.has(m.machine_id))
  // Seulement les appareils qui ont un relevé : sans relevé, power_kw est la puissance de plaque, pas une mesure
  // (test du site, 2026-10-18 : « 1,4 kW en ce moment » pour un foyer sans aucune mesure).
  const measured = machines.filter(hasReading)
  const totalPower = measured.reduce((sum, m) => sum + m.power_kw, 0)

  return {
    'puissance-totale': {
      id: 'puissance-totale',
      label: labels['puissance-totale'],
      value: measured.length ? formatNumberFr(totalPower, 1) : '-',
      unit: measured.length ? 'kW' : '',
      note: measured.length
        ? `${measured.length} ${noun}${plural(measured.length)} mesuré${plural(measured.length)} sur ${machines.length}`
        : 'Aucune mesure : reliez un boîtier ou importez des relevés',
      provenance: 'synthetique',
    },
    'machines-actives': {
      id: 'machines-actives',
      label: labels['machines-actives'],
      value: String(activeMachines.length),
      unit: `/ ${machines.length}`,
      note: alerteMachines.length > 0 ? `${alerteMachines.length} ${profile === 'menage' ? 'à surveiller' : 'en alerte'}` : 'Aucune alerte active',
      provenance: 'synthetique',
    },
    'economies-mois': {
      id: 'economies-mois',
      label: labels['economies-mois'],
      // Indicatif : gains des seules actions réellement exécutées (plus les délestages jamais faits,
      // Volet 2 C3) ; la facturation se fait sur les économies mesurées.
      value: formatNumberFr(billing.estimated_ai_savings.month_total_fcfa),
      unit: 'FCFA',
      note: lastStatement ? `Dernier relevé Nouankany (${lastStatement.month}) : ${formatFcfa(lastStatement.total_fcfa ?? 0)}` : 'Aucun relevé Nouankany pour l’instant',
      provenance: 'estime',
    },
    'anomalies-actives': {
      id: 'anomalies-actives',
      label: labels['anomalies-actives'],
      value: String(alerteMachines.length),
      unit: `${noun}${plural(alerteMachines.length)}`,
      note: alerteMachines.length > 0 ? alerteMachines.map((m) => m.nom).join(', ') : 'Aucune',
      provenance: 'synthetique',
    },
  }
}

/** Machines pour lesquelles le moteur de recommandation liste une alerte. Sans réponse du moteur, aucune. */
async function alertedMachineIds(machines: Awaited<ReturnType<typeof getCachedMachines>>): Promise<Set<string>> {
  if (machines.length === 0) return new Set()
  try {
    const { recommendations } = await getCachedRecommend(machines)
    return new Set(recommendations.filter((rec) => rec.type === 'alerte').map((rec) => rec.machine_id))
  } catch {
    return new Set()
  }
}

async function fetchAdminKpiSet(): Promise<Record<string, Kpi>> {
  // Les 4 indicateurs admin viennent tous de GET /api/admin/metrics : une seule fois pour toute la bande.
  const metrics = await getCachedAdminMetrics()

  return {
    'base-donnees': {
      id: 'base-donnees',
      label: ADMIN_LABELS['base-donnees'],
      value: metrics.system.database_status === 'connected' ? 'connectée' : metrics.system.database_status,
      note: 'PostgreSQL',
      provenance: 'telemetrie_systeme',
    },
    uptime: {
      id: 'uptime',
      label: ADMIN_LABELS.uptime,
      value: formatUptime(metrics.system.process_uptime_seconds),
      note: 'depuis le dernier redémarrage du process',
      provenance: 'telemetrie_systeme',
    },
    'latence-moyenne': {
      id: 'latence-moyenne',
      label: ADMIN_LABELS['latence-moyenne'],
      value: metrics.system.avg_latency_ms !== null ? formatNumberFr(metrics.system.avg_latency_ms) : '-',
      unit: 'ms',
      note: `${formatNumberFr(metrics.system.sample_count)} échantillons sur cette fenêtre`,
      provenance: 'telemetrie_systeme',
      window: { label: '5 min', sampleCount: metrics.system.sample_count },
    },
    'machines-plateforme': {
      id: 'machines-plateforme',
      label: ADMIN_LABELS['machines-plateforme'],
      value: String(metrics.platform.active_machines),
      unit: `/ ${metrics.platform.total_machines}`,
      note: `sur ${metrics.platform.total_sites} site${metrics.platform.total_sites > 1 ? 's' : ''}`,
      provenance: 'telemetrie_systeme',
    },
  }
}

/** Les 4 indicateurs de la bande KPI, en un seul aller-retour réseau (voir KpiStrip : chaque KpiTile lit ce
 * même cache react-query au lieu de refetcher sa propre valeur). */
export function fetchKpiSet(profile: Profile): Promise<Record<string, Kpi>> {
  return profile === 'admin' ? fetchAdminKpiSet() : fetchClientKpiSet(profile)
}

