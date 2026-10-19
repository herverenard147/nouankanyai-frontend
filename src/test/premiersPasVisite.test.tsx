import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useStepVisitOnRoute } from '@/hooks/useStepVisitOnRoute'
import { useGettingStartedStore } from '@/store/gettingStartedStore'
import type { Session } from '@/types/domain'

function Sonde({ session }: { session: Session }) {
  useStepVisitOnRoute(session)
  return null
}

describe('Premiers pas : une étape faite ailleurs est reconnue', () => {
  it('ouvrir le plan d’action depuis le menu coche l’étape « plan »', () => {
    const session = { userId: 'u-pp', profile: 'industrie' } as Session
    render(
      <MemoryRouter initialEntries={['/app/plan-action']}>
        <Sonde session={session} />
      </MemoryRouter>,
    )
    expect(useGettingStartedStore.getState().visitedByUser['u-pp']).toContain('plan')
    // Une étape qui dépend d'une donnée (factures) n'est pas cochée par une simple visite.
    render(
      <MemoryRouter initialEntries={['/app/factures']}>
        <Sonde session={session} />
      </MemoryRouter>,
    )
    expect(useGettingStartedStore.getState().visitedByUser['u-pp']).not.toContain('facture')
  })
})
