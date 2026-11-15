import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/lib/apiClient'
import { useSessionStore } from '@/store/sessionStore'

// S-27 : l'administrateur ne fixe plus de mot de passe, le serveur envoie un lien au titulaire.
vi.mock('@/api/adminUserDetail', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  resetUserPassword: vi.fn(),
}))
vi.mock('@/hooks/queries/useAdminUsers', async (importOriginal) => {
  const user = { id: 'u2', name: 'Awa Koné', email: 'awa@exemple.ci', profile: 'menage', status: 'actif', isSuspended: false,
    isDeleted: false, lastLogin: 'hier', platformRole: null, ownerId: null, accountLabel: '-' }
  const vide = { status: 'success', data: [], isLoading: false }
  return {
    ...(await importOriginal<object>()),
    useAdminUsers: () => ({ status: 'success', data: [user] }),
    useUserMachines: () => vide,
    useUserPredictions: () => ({ status: 'success', data: null }),
    useUserAlerts: () => ({ status: 'success', data: null }),
  }
})
vi.mock('@/components/billing/AdminBillingSection', () => ({ AdminBillingSection: () => null }))
vi.mock('@/components/import/TransferCard', () => ({ TransferCard: () => null }))

import { resetUserPassword } from '@/api/adminUserDetail'
import { AdminUserDetailPage } from '@/pages/app/admin/AdminUserDetailPage'

function afficher() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <MemoryRouter initialEntries={['/u/u2']}>
        <Routes><Route path="/u/:userId" element={<AdminUserDetailPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser le mot de passe' }))
}

describe("Réinitialisation du mot de passe par l'administrateur", () => {
  beforeEach(() => {
    useSessionStore.setState({ session: { userId: 'admin', token: 't', profile: 'admin', platformRole: 'superadmin', displayName: 'A',
      subtitle: 'Admin', isTeamOwner: false, isTrial: false, isDemo: false } })
  })
  afterEach(() => {
    vi.clearAllMocks()
    useSessionStore.setState({ session: null })
  })

  it("n'a plus de champ de mot de passe et annonce l'envoi d'un lien", async () => {
    vi.mocked(resetUserPassword).mockResolvedValue({ ok: true, email_envoye: true })
    afficher()
    expect(document.querySelector('input[type="password"]')).toBeNull()
    expect(screen.getByText(/lien de réinitialisation sera envoyé à l'adresse du compte/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }))
    await waitFor(() => expect(resetUserPassword).toHaveBeenCalledWith('u2'))
  })

  it("affiche clairement l'erreur 503 (e-mail non configuré)", async () => {
    vi.mocked(resetUserPassword).mockRejectedValue(new ApiError('detail serveur', 503))
    afficher()
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }))
    const alerte = await screen.findByRole('alert')
    expect(alerte.textContent).toContain("L’envoi d’e-mail n’est pas configuré")
  })
})
