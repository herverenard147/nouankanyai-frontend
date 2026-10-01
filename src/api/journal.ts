import { rawJournalEvents } from '@/api/rawBackend'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import { formatUtcDateTime } from '@/lib/formatters'
import type { JournalEntry, Profile } from '@/types/domain'

/**
 * Journal : les faits système enregistrés par le backend (`/api/v1/journal/events`) : alertes, résultat de chaque
 * vérification, réinitialisations, délestages automatiques, analyses média, factures importées. Rien n'est
 * reconstitué côté frontend. Les connexions et les actions de personnes sont dans l'Audit, pas ici.
 * L'Admin reçoit toute la plateforme (avec le compte concerné), un client son entreprise.
 */
export async function fetchJournal(_profile: Profile): Promise<JournalEntry[]> {
  const page = await rawJournalEvents(100)
  return page.items.map((event) => ({
    id: event.id,
    time: formatUtcDateTime(event.created_at),
    type: event.label,
    detail: frenchNumbersWithUnits(event.detail),
    account: event.account ?? undefined,
  }))
}
