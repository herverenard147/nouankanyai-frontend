import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { OwnerOnly } from '@/components/ui/OwnerOnly'
import { RowActions } from '@/components/table/RowActions'
import { useSessionStore } from '@/store/sessionStore'

// S-21 : un membre d'équipe lit et saisit, mais le serveur refuse (403) ses suppressions.
const base = { userId: 'u', token: 't', platformRole: null, displayName: 'X', subtitle: '', isTrial: false, isDemo: false }
const connecte = (profile: 'pme' | 'industrie' | 'menage' | 'admin', isTeamOwner: boolean) => useSessionStore.setState({ session: { ...base, profile, isTeamOwner } })

describe("Suppressions réservées au compte principal", () => {
  afterEach(() => useSessionStore.setState({ session: null }))

  it('un membre PME ne voit pas le bouton et lit pourquoi', () => {
    connecte('pme', false)
    render(<OwnerOnly><button>Supprimer</button></OwnerOnly>)
    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull()
    expect(screen.getByText('Réservé au compte principal')).toBeTruthy()
  })

  it.each([['pme', true], ['industrie', true], ['menage', false], ['admin', false]] as const)('%s (titulaire=%s) garde le bouton', (profile, owner) => {
    connecte(profile, owner)
    render(<OwnerOnly><button>Supprimer</button></OwnerOnly>)
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeTruthy()
  })

  it('les actions de ligne cachent Supprimer pour un membre mais gardent Modifier', () => {
    connecte('industrie', false)
    render(<RowActions label="Compresseur" onEdit={() => {}} onDelete={() => {}} />)
    expect(screen.getByRole('button', { name: 'Modifier Compresseur' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Supprimer Compresseur' })).toBeNull()
  })
})
