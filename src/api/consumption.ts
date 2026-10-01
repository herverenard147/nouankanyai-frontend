import { rawMachineHistory, getCachedMachines } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { ConsumptionSeries, Profile } from '@/types/domain'

/**
 * Le backend n'a pas de série de consommation agrégée par compte : on prend
 * l'historique réel de relevés (`sensor_metrics`) de la machine la plus
 * significative, et on répartit la puissance actuelle par machine pour le
 * détail "par poste" — les deux à partir de données réellement enregistrées,
 * pas d'une série recalculée après coup.
 */
export async function fetchConsumptionSeries(_profile: Profile): Promise<ConsumptionSeries[]> {
  const machines = await getCachedMachines()
  if (machines.length === 0) return []

  const target = [...machines].sort((a, b) => b.power_kw - a.power_kw)[0]
  const history = await rawMachineHistory(target.machine_id)
  const chronological = [...history.history].reverse()

  const values = chronological.map((h) => h.power_kw)
  const max = Math.max(...values, 0.0001)
  const points = chronological.map((h) => ({
    label: new Date(h.recorded_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    value: h.power_kw,
    displayValue: formatNumberFr(h.power_kw, 1),
    percent: Math.round((h.power_kw / max) * 100),
  }))

  const totalPower = machines.reduce((sum, m) => sum + m.power_kw, 0) || 1
  const byPost = machines
    .map((m) => ({
      label: m.nom,
      percent: Math.round((m.power_kw / totalPower) * 100),
      provenance: 'estime' as const,
    }))
    .sort((a, b) => b.percent - a.percent)

  return [
    {
      granularity: 'quotidien',
      yAxisUnit: 'kW',
      provenance: 'estime',
      points,
      byPost,
    },
  ]
}
