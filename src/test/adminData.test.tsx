import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/** Données d'entraînement gérées depuis le site (demande du propriétaire, 2026-10-18). */
vi.mock('@/api/rawBackend', () => ({
  rawMlCollection: vi.fn().mockResolvedValue({
    releves_reels: 5000, machines_mesurees: 2, machines_avec_un_mois: 1,
    seuil_reentrainement: { machines: 20, heures_par_machine: 720, couverture: 0.8 }, pret_pour_reentrainement: false,
  }),
  rawMlCollectionMachines: vi.fn().mockResolvedValue([
    { code: 'M1', nom: 'Compresseur', categorie: 'Compresseur', type_compte: 'Industrie', releves: 4000, debut: '2026-09-01T00:00:00',
      fin: '2026-10-05T00:00:00', heures_periode: 817, heures_mesurees: 760, couverture: 0.93, pret: true },
  ]),
  rawMlForecastReview: vi.fn().mockResolvedValue({
    periode_jours: 30, previsions_servies: 12,
    lignes: [{ methode: 'profil', modele: null, famille: 'froid', previsions: 12, heures_mesurees: 40, erreur_moyenne_kw: 0.12, erreur_relative: 0.18 }],
  }),
  downloadTrainingCsv: vi.fn().mockResolvedValue(undefined),
}))
import { downloadTrainingCsv, rawMlForecastReview } from '@/api/rawBackend'
import { AdminDataPage } from '@/pages/app/admin/AdminDataPage'

describe('Données d’entraînement (admin)', () => {
  it('collecte, appareil prêt, bilan et téléchargement', async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AdminDataPage />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(screen.getByText('1 sur 20')).toBeTruthy())
    await waitFor(() => expect(screen.getByText('Prêt')).toBeTruthy())
    expect(screen.getByText('93 %')).toBeTruthy()
    await waitFor(() => expect(screen.getByText('Profil mesuré')).toBeTruthy())
    expect(screen.getByText('120 W')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Période'), { target: { value: '90' } })
    await waitFor(() => expect(rawMlForecastReview).toHaveBeenCalledWith(90))
    fireEvent.click(screen.getByRole('button', { name: /Télécharger le jeu/ }))
    await waitFor(() => expect(screen.getByText('Fichier téléchargé.')).toBeTruthy())
    expect(downloadTrainingCsv).toHaveBeenCalled()
  })
})
