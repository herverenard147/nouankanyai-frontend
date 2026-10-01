import { formatFcfaAmount } from '@/api/backendHelpers'
import { rawAdminMetrics, rawFacturation, rawMachines } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { Kpi, KpiWindow, Profile } from '@/types/domain'

const CLIENT_KPI_IDS = ['puissance-totale', 'machines-actives', 'economies-mois', 'anomalies-actives'] as const
const ADMIN_KPI_IDS = ['base-donnees', 'uptime', 'latence-moyenne', 'machines-plateforme'] as const

const CLIENT_LABELS: Record<(typeof CLIENT_KPI_IDS)[number], string> = {
  'puissance-totale': 'Puissance active totale',
  'machines-actives': 'Machines actives',
  'economies-mois': 'Part sur les économies ce mois',
  'anomalies-actives': 'Machines en anomalie',
}

const ADMIN_LABELS: Record<(typeof ADMIN_KPI_IDS)[number], string> = {
  'base-donnees': 'Base de données',
  uptime: 'Uptime du processus',
  'latence-moyenne': 'Latence API moyenne',
  'machines-plateforme': 'Machines actives (plateforme)',
}

/** Vitrine synchrone : le titre (et la fenêtre, pour l'admin) reste affiché même
 * pendant le chargement ou en cas d'échec de la query de valeur — voir CLAUDE.md
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
  return { label: CLIENT_LABELS[kpiId as (typeof CLIENT_KPI_IDS)[number]] }
}

export function kpiSectionTitle(profile: Profile): string {
  return profile === 'admin' ? 'Santé de la plateforme' : 'Consommation et économies'
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return days > 0 ? `${days} j ${hours} h` : `${hours} h`
}

async function fetchClientKpiSet(): Promise<Record<string, Kpi>> {
  // Les 4 indicateurs client viennent des 2 mêmes requêtes (machines, facturation) : une seule fois pour
  // toute la bande, pas une fois par indicateur (KpiStrip montait 4 KpiTile, chacun refetchait tout).
  const [machines, facturation] = await Promise.all([rawMachines(), rawFacturation()])
  const activeMachines = machines.filter((m) => m.status === 'actif')
  const alerteMachines = machines.filter((m) => m.status === 'alerte')
  const totalPower = machines.reduce((sum, m) => sum + m.power_kw, 0)

  return {
    'puissance-totale': {
      id: 'puissance-totale',
      label: CLIENT_LABELS['puissance-totale'],
      value: formatNumberFr(totalPower, 1),
      unit: 'kW',
      note: `${machines.length} machine${machines.length > 1 ? 's' : ''} enregistrée${machines.length > 1 ? 's' : ''}`,
      provenance: 'estime',
    },
    'machines-actives': {
      id: 'machines-actives',
      label: CLIENT_LABELS['machines-actives'],
      value: String(activeMachines.length),
      unit: `/ ${machines.length}`,
      note: alerteMachines.length > 0 ? `${alerteMachines.length} en alerte` : 'Aucune alerte active',
      provenance: 'estime',
    },
    'economies-mois': {
      id: 'economies-mois',
      label: CLIENT_LABELS['economies-mois'],
      value: formatNumberFr(facturation.grossSavings),
      unit: 'FCFA',
      note: `Commission Nouankany (10 %) : ${formatFcfaAmount(facturation.gainShare)}`,
      provenance: 'estime',
    },
    'anomalies-actives': {
      id: 'anomalies-actives',
      label: CLIENT_LABELS['anomalies-actives'],
      value: String(alerteMachines.length),
      unit: alerteMachines.length > 1 ? 'machines' : 'machine',
      note: alerteMachines.length > 0 ? alerteMachines.map((m) => m.nom).join(', ') : 'Aucune',
      provenance: 'estime',
    },
  }
}

async function fetchAdminKpiSet(): Promise<Record<string, Kpi>> {
  // Les 4 indicateurs admin viennent tous de GET /api/admin/metrics : une seule fois pour toute la bande.
  const metrics = await rawAdminMetrics()

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
      value: metrics.system.avg_latency_ms !== null ? formatNumberFr(metrics.system.avg_latency_ms) : '—',
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

/** Les 4 indicateurs de la bande KPI, en un seul aller-retour réseau (voir KpiStrip — chaque KpiTile lit ce
 * même cache react-query au lieu de refetcher sa propre valeur). */
export function fetchKpiSet(profile: Profile): Promise<Record<string, Kpi>> {
  return profile === 'admin' ? fetchAdminKpiSet() : fetchClientKpiSet()
}

export async function fetchKpi(profile: Profile, kpiId: string): Promise<Kpi> {
  const set = await fetchKpiSet(profile)
  const kpi = set[kpiId]
  if (!kpi) throw new Error(`KPI inconnu : ${kpiId}`)
  return kpi
}
