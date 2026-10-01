import { fetchAudit } from '@/api/audit'
import { getCachedAdminMetrics } from '@/api/rawBackend'
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

/** Catégories de la piste d'audit (voir api/audit.ts) qui correspondent à ce que cette page annonce :
 * vérifications (résolution automatique/manuelle d'une anomalie) et factures (mise à jour de compteur).
 * Pas de catégorie "alerte" distincte côté backend (une détection n'est pas un événement persisté avec
 * horodatage tant qu'elle n'a pas été vérifiée) : on ne prétend donc pas en afficher ici. */
const JOURNAL_AUDIT_CATEGORIES = new Set(['resolutions', 'factures'])

/**
 * Journal agrégé côté plateforme (admin uniquement, `recent_activities` de
 * `/api/admin/metrics`). Pour les autres profils : même piste d'audit réelle
 * que la page Audit (`/api/v1/audit/trail`, append-only côté backend), filtrée
 * aux catégories que cette page annonce — jamais une donnée capteur simulée
 * présentée comme un événement système (bug corrigé le 2026-10-01 : la page
 * affichait avant les derniers relevés capteurs sous un libellé "Relevé
 * simulé", qui ne correspondait à aucune des 3 choses promises en sous-titre).
 */
export async function fetchJournal(profile: Profile): Promise<JournalEntry[]> {
  if (profile === 'admin') {
    const metrics = await getCachedAdminMetrics()
    return metrics.recent_activities.map(toEntry)
  }

  const audit = await fetchAudit(profile, { limit: 100 })
  return audit.events
    .filter((event) => JOURNAL_AUDIT_CATEGORIES.has(event.category))
    .map((event) => ({
      id: event.id,
      time: event.time,
      type: event.categoryLabel,
      detail: event.detail || event.action,
      count: 1,
    }))
}
