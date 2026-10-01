import { rawAdminAuditEvents, rawAuditEvents, type AuditQuery } from '@/api/rawBackend'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import { formatUtcDateTime } from '@/lib/formatters'
import type { BackendAuditEvent } from '@/types/backend'
import type { AuditEvent, AuditPageData, Profile } from '@/types/domain'

export const AUDIT_CATEGORY_LABEL: Record<string, string> = {
  compte: 'Compte',
  connexions: 'Connexions',
  sites: 'Sites',
  machines: 'Machines',
  resolutions: 'Vérifications',
  factures: 'Factures',
  seuils: 'Seuils',
  equipe: 'Équipe',
  plan: 'Plan d’action',
}

export function toAuditEvent(event: BackendAuditEvent): AuditEvent {
  return {
    id: event.id,
    time: formatUtcDateTime(event.created_at),
    actor: event.actor_nom ?? '—',
    action: event.label,
    detail: frenchNumbersWithUnits(event.detail ?? ''),
    category: event.category,
    categoryLabel: AUDIT_CATEGORY_LABEL[event.category] ?? event.category,
    account: event.owner_nom ?? undefined,
    // Événements enregistrés par la plateforme elle-même (pas une mesure ni une estimation).
    provenance: 'telemetrie_systeme',
  }
}

/** Piste d'audit : celle du compte (Admin : toute la plateforme). Append-only côté backend. */
export async function fetchAudit(profile: Profile, query: AuditQuery = {}): Promise<AuditPageData> {
  const page = profile === 'admin' ? await rawAdminAuditEvents(query) : await rawAuditEvents(query)
  return {
    total: page.total,
    events: page.items.map(toAuditEvent),
    categories: Object.entries(page.categories)
      .map(([id, count]) => ({ id, label: AUDIT_CATEGORY_LABEL[id] ?? id, count }))
      .sort((a, b) => b.count - a.count),
  }
}
