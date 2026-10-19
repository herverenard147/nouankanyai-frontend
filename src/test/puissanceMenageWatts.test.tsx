import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MachineFormDrawer } from '@/components/machines/MachineFormDrawer'
import { useSessionStore } from '@/store/sessionStore'

/** Test du site du 2026-10-18 : un foyer tapait « 150 » (W, sur l'étiquette) et le frigo était enregistré à 150 kW. */
vi.mock('@/api/rawBackend', () => ({
  rawAddMachine: vi.fn().mockResolvedValue({}),
  rawUpdateMachine: vi.fn().mockResolvedValue({}),
  rawDeleteMachine: vi.fn().mockResolvedValue({}),
  rawTestMachine: vi.fn().mockResolvedValue({}),
  rawExtractMachinePhoto: vi.fn(),
  rawSites: vi.fn().mockResolvedValue([]),
  rawCreateSite: vi.fn().mockResolvedValue({}),
  rawEquipmentCatalog: vi.fn().mockResolvedValue({}),
  rawAlertThresholds: vi.fn().mockResolvedValue({ temperature_max_c: 60, vibration_max_mm_s: 45, surconsommation_ratio: 1.2, auto_resolve_enabled: false }),
  rawUpdateAlertThresholds: vi.fn().mockResolvedValue({}),
}))

import { rawAddMachine } from '@/api/rawBackend'

function renderAs(profile: 'menage' | 'industrie') {
  useSessionStore.setState({
    session: { userId: 'u1', token: 't', refreshToken: 'r', profile, platformRole: null, displayName: 'X', subtitle: '', isTeamOwner: true, isTrial: false, isDemo: false },
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MachineFormDrawer machine={null} itemLabel="un appareil" onClose={vi.fn()} />
    </QueryClientProvider>,
  )
}

describe('Puissance d’un appareil de maison en watts', () => {
  afterEach(() => useSessionStore.setState({ session: null }))

  it('un foyer saisit des watts, le serveur reçoit des kW', async () => {
    renderAs('menage')
    fireEvent.change(screen.getByLabelText(/^Nom/), { target: { value: 'Frigo' } })
    fireEvent.change(screen.getByLabelText(/Puissance \(W/), { target: { value: '150' } })
    expect((screen.getByLabelText(/Puissance \(W/) as HTMLInputElement).value).toBe('150')
    fireEvent.submit(screen.getByLabelText(/^Nom/).closest('form') as HTMLFormElement)
    await waitFor(() => expect(rawAddMachine).toHaveBeenCalled())
    expect(vi.mocked(rawAddMachine).mock.calls[0][0]).toMatchObject({ power_kw: 0.15 })
  })

  it('une industrie garde les kW', () => {
    renderAs('industrie')
    expect(screen.getByLabelText(/Puissance nominale \(kW\)/)).toBeTruthy()
  })
})
