import { rawAdminMetrics, rawMachineHistory, rawMachines } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { BackendRecentActivity } from '@/types/backend'
import type { JournalEntry, Profile } from '@/types/domain'

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  delestage: 'Délestage',
  reset_admin: 'Réinitialisation support',
  ocr_upload: 'Upload facture',
  connexion: 'Connexion',
  analyse_media_normal: 'Analyse média',
  analyse_media_alerte: 'Analyse média (alerte)',
}

function toEntry(activity: BackendRecentActivity, index: number): JournalEntry {
  return {
    id: `${activity.type}-${index}`,
    time: activity.timestamp ? new Date(activity.timestamp).toLocaleString('fr-FR') : '—',
    type: ACTIVITY_TYPE_LABEL[activity.type] ?? activity.type,
    detail: [activity.user_name, activity.ref_id].filter(Boolean).join(' · ') || '—',
    count: 1,
  }
}

/**
 * Journal agrégé côté plateforme (admin uniquement, `recent_activities` de
 * `/api/admin/metrics`). Pour l'industrie, pas d'équivalent "journal
 * d'activité" par compte côté backend : on affiche à la place les relevés
 * capteurs récents de ses machines, l'historique réel le plus proche de ce
 * que la page annonce.
 */
export async function fetchJournal(profile: Profile): Promise<JournalEntry[]> {
  if (profile === 'admin') {
    const metrics = await rawAdminMetrics()
    return metrics.recent_activities.map(toEntry)
  }

  const machines = await rawMachines()
  const histories = await Promise.all(machines.map((m) => rawMachineHistory(m.machine_id).catch(() => null)))
  const entries: JournalEntry[] = []
  histories.forEach((history, idx) => {
    if (!history) return
    const machine = machines[idx]
    history.history.slice(0, 5).forEach((point, i) => {
      entries.push({
        id: `${machine.machine_id}-${i}`,
        time: new Date(point.recorded_at).toLocaleString('fr-FR'),
        type: 'Relevé simulé',
        detail: `${machine.nom} · ${formatNumberFr(point.power_kw, 1)} kW, ${formatNumberFr(point.temperature_c, 1)} °C`,
        count: 1,
      })
    })
  })
  return entries.sort((a, b) => b.time.localeCompare(a.time))
}
