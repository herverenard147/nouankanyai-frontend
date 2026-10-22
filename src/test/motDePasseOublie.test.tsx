import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function at(path: string, element: React.ReactNode) {
  return render(<MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>)
}

// Partie N : le lien « Mot de passe oublié ? » était un bouton désactivé.
describe('Mot de passe oublié et confirmation d’adresse', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('la page de connexion mène à la demande de lien', () => {
    at('/login', <LoginPage />)
    expect(screen.getByRole('link', { name: /Mot de passe oublié/i })).toHaveAttribute('href', '/mot-de-passe-oublie')
  })

  it('refuse une adresse invalide sans appeler le serveur', async () => {
    const fetchMock = mockFetch(200, {})
    at('/mot-de-passe-oublie', <ForgotPasswordPage />)
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'pas-une-adresse' } })
    fireEvent.click(screen.getByRole('button', { name: /Recevoir le lien/i }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText(/adresse email valide/i)).toBeInTheDocument()
  })

  it('affiche le même message que le compte existe ou non', async () => {
    const fetchMock = mockFetch(200, { status: 'success', message: 'ok' })
    at('/mot-de-passe-oublie', <ForgotPasswordPage />)
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'quelquun@exemple.ci' } })
    fireEvent.click(screen.getByRole('button', { name: /Recevoir le lien/i }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Si un compte existe/i))
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/account/password/forgot')
  })

  it('envoie le jeton du lien avec le nouveau mot de passe', async () => {
    const fetchMock = mockFetch(200, { status: 'success' })
    at('/reinitialiser-mot-de-passe?token=jeton-du-lien', <ResetPasswordPage />)
    fireEvent.change(screen.getByLabelText(/^Nouveau mot de passe/i), { target: { value: 'nouveau-secret-1' } })
    fireEvent.change(screen.getByLabelText(/Confirmer/i), { target: { value: 'nouveau-secret-1' } })
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/reconnectez-vous/i))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ token: 'jeton-du-lien', new_password: 'nouveau-secret-1' })
  })

  it('refuse deux mots de passe différents', async () => {
    const fetchMock = mockFetch(200, {})
    at('/reinitialiser-mot-de-passe?token=jeton', <ResetPasswordPage />)
    fireEvent.change(screen.getByLabelText(/^Nouveau mot de passe/i), { target: { value: 'nouveau-secret-1' } })
    fireEvent.change(screen.getByLabelText(/Confirmer/i), { target: { value: 'autre-chose-2' } })
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/pas identiques/i)
  })

  it('affiche le message du serveur pour un lien expiré', async () => {
    mockFetch(400, { detail: "Ce lien n'est plus valable. Demandez-en un nouveau." })
    at('/confirmer-email?token=perime', <VerifyEmailPage />)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/plus valable/i))
  })

  it('sans jeton, ne contacte pas le serveur', () => {
    const fetchMock = mockFetch(200, {})
    at('/confirmer-email', <VerifyEmailPage />)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

// Partie P : aucune information ni consentement n'était demandé à l'inscription.
describe('Inscription : consentement', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('refuse de créer un compte sans accepter les conditions, sans appeler le serveur', () => {
    const fetchMock = mockFetch(200, {})
    at('/login?mode=signup', <LoginPage />)
    fireEvent.change(screen.getByLabelText(/^Nom/i), { target: { value: 'Awa' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'awa@exemple.ci' } })
    fireEvent.change(screen.getByLabelText(/^Mot de passe/i), { target: { value: 'secret-123' } })
    fireEvent.click(screen.getByRole('button', { name: /Créer le compte/i }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/Acceptez les conditions/i)
  })

  it('mène aux pages des CGU et de la confidentialité, dans un nouvel onglet (2026-10-21)', () => {
    at('/login?mode=signup', <LoginPage />)
    const privacy = screen.getByRole('link', { name: /politique de confidentialité/i })
    expect(privacy.getAttribute('href')).toBe('/confidentialite')
    expect(privacy.getAttribute('target')).toBe('_blank')
    expect(screen.getByRole('link', { name: /conditions d’utilisation/i }).getAttribute('href')).toBe('/cgu')
  })
})
