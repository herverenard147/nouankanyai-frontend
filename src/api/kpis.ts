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

async function fetchClientKpi(kpiId: string): Promise<Kpi> {
  const [machines, facturation] = await Promise.all([rawMachines(), rawFacturation()])
  const activeMachines = machines.filter((m) => m.status === 'actif')
  const alerteMachines = machines.filter((m) => m.status === 'alerte')
  const totalPower = machines.reduce((sum, m) => sum + m.power_kw, 0)

  switch (kpiId) {
    case 'puissance-totale':
      return {
        id: kpiId,
        label: CLIENT_LABELS['puissance-totale'],
        value: formatNumberFr(totalPower, 1),
        unit: 'kW',
        note: `${machines.length} machine${machines.length > 1 ? 's' : ''} enregistrée${machines.length > 1 ? 's' : ''}`,
        provenance: 'estime',
      }
    case 'machines-actives':
      return {
        id: kpiId,
        label: CLIENT_LABELS['machines-actives'],
        value: String(activeMachines.length),
        unit: `/ ${machines.length}`,
        note: alerteMachines.length > 0 ? `${alerteMachines.length} en alerte` : 'Aucune alerte active',
        provenance: 'estime',
      }
    case 'economies-mois':
      return {
        id: kpiId,
        label: CLIENT_LABELS['economies-mois'],
        value: formatNumberFr(facturation.grossSavings),
        unit: 'FCFA',
        note: `Commission Nouankany (10 %) : ${formatFcfaAmount(facturation.gainShare)}`,
        provenance: 'estime',
      }
    case 'anomalies-actives':
      return {
        id: kpiId,
        label: CLIENT_LABELS['anomalies-actives'],
        value: String(alerteMachines.length),
        unit: alerteMachines.length > 1 ? 'machines' : 'machine',
        note: alerteMachines.length > 0 ? alerteMachines.map((m) => m.nom).join(', ') : 'Aucune',
        provenance: 'estime',
      }
    default:
      throw new Error(`KPI inconnu : ${kpiId}`)
  }
}

async function fetchAdminKpi(kpiId: string): Promise<Kpi> {
  const metrics = await rawAdminMetrics()

  switch (kpiId) {
    case 'base-donnees':
      return {
        id: kpiId,
        label: ADMIN_LABELS['base-donnees'],
        value: metrics.system.database_status === 'connected' ? 'connectée' : metrics.system.database_status,
        note: 'PostgreSQL',
        provenance: 'telemetrie_systeme',
      }
    case 'uptime':
      return {
        id: kpiId,
        label: ADMIN_LABELS.uptime,
        value: formatUptime(metrics.system.process_uptime_seconds),
        note: 'depuis le dernier redémarrage du process',
        provenance: 'telemetrie_systeme',
      }
    case 'latence-moyenne':
      return {
        id: kpiId,
        label: ADMIN_LABELS['latence-moyenne'],
        value: metrics.system.avg_latency_ms !== null ? formatNumberFr(metrics.system.avg_latency_ms) : '—',
        unit: 'ms',
        note: `${formatNumberFr(metrics.system.sample_count)} échantillons sur cette fenêtre`,
        provenance: 'telemetrie_systeme',
        window: { label: '5 min', sampleCount: metrics.system.sample_count },
      }
    case 'machines-plateforme':
      return {
        id: kpiId,
        label: ADMIN_LABELS['machines-plateforme'],
        value: String(metrics.platform.active_machines),
        unit: `/ ${metrics.platform.total_machines}`,
        note: `sur ${metrics.platform.total_sites} site${metrics.platform.total_sites > 1 ? 's' : ''}`,
        provenance: 'telemetrie_systeme',
      }
    default:
      throw new Error(`KPI admin inconnu : ${kpiId}`)
  }
}

export function fetchKpi(profile: Profile, kpiId: string): Promise<Kpi> {
  return profile === 'admin' ? fetchAdminKpi(kpiId) : fetchClientKpi(kpiId)
}
