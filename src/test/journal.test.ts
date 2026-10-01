import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/rawBackend', () => ({ rawJournalEvents: vi.fn() }))

import { fetchJournal } from '@/api/journal'
import { rawJournalEvents } from '@/api/rawBackend'

describe('Journal : faits système du backend, rien de reconstitué', () => {
  beforeEach(() => vi.mocked(rawJournalEvents).mockReset())

  it('reprend tel quel le libellé et le détail du backend, avec les nombres à la française', async () => {
    vi.mocked(rawJournalEvents).mockResolvedValue({
      total: 1,
      items: [
        { id: 'res-1', created_at: '2026-10-01T01:12:09', type: 'verification_persiste', label: 'Vérification : anomalie persistante', detail: 'Groupe froid · 63.4 °C · 39.2 Hz', account: null },
      ],
    })
    const [entry] = await fetchJournal('industrie')
    expect(entry).toEqual({
      id: 'res-1',
      time: '01/10/2026 01:12:09',
      type: 'Vérification : anomalie persistante',
      detail: 'Groupe froid · 63,4 °C · 39,2 Hz',
      account: undefined,
    })
  })

  it('ne fabrique aucune entrée : liste vide du backend = liste vide', async () => {
    vi.mocked(rawJournalEvents).mockResolvedValue({ total: 0, items: [] })
    expect(await fetchJournal('industrie')).toEqual([])
  })

  it('l’Admin reçoit le compte concerné', async () => {
    vi.mocked(rawJournalEvents).mockResolvedValue({
      total: 1,
      items: [{ id: 'a', created_at: '2026-10-01T01:00:00', type: 'alerte_simulee', label: 'Alerte simulée', detail: 'Four', account: 'Boulangerie Awalé' }],
    })
    expect((await fetchJournal('admin'))[0].account).toBe('Boulangerie Awalé')
  })

  it('n’affiche jamais de connexion : le type n’existe pas côté Journal', async () => {
    vi.mocked(rawJournalEvents).mockResolvedValue({ total: 0, items: [] })
    const entries = await fetchJournal('admin')
    expect(entries.some((e) => /connexion/i.test(e.type))).toBe(false)
  })
})
