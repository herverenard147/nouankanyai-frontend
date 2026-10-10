import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { useAutoResolveMachine } from '@/hooks/queries/useMachineCrud'
import type { BackendMachineTestResult } from '@/types/backend'

/**
 * Boîte blanche sur useAutoResolveMachine : s'appuie sur les noms réels
 * (rawTestMachine, rawAlertThresholds) — complète machinePhotoCapture.*.test.tsx
 * qui ne couvre pas ce hook.
 */
vi.mock('@/api/rawBackend', () => ({
  rawTestMachine: vi.fn(),
  rawAlertThresholds: vi.fn(),
  rawUpdateAlertThresholds: vi.fn().mockResolvedValue({}),
}))

import { rawAlertThresholds, rawTestMachine } from '@/api/rawBackend'

function result(resolved: boolean, extra: Partial<BackendMachineTestResult> = {}): BackendMachineTestResult {
  return { provenance: 'simulation', resolved, temperature_c: 50, vibration_hz: 10, pressure_bar: 1, power_kw: 2, diagnostic: null, ...extra }
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useAutoResolveMachine', () => {
  beforeEach(() => {
    vi.mocked(rawTestMachine).mockReset()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sévérité critique : un seul essai, jamais de boucle, même si l’automatisation est activée', async () => {
    vi.mocked(rawAlertThresholds).mockResolvedValue({ temperature_max_c: 60, vibration_max_hz: 45, surconsommation_ratio: 1.2, auto_resolve_enabled: true })
    vi.mocked(rawTestMachine).mockResolvedValue(result(false))

    const { result: hook } = renderHook(() => useAutoResolveMachine('M1', 'critique'), { wrapper })
    await waitFor(() => expect(hook.current.autoEnabled).toBe(false))

    act(() => hook.current.trigger())
    await waitFor(() => expect(hook.current.status).toBe('idle'))
    expect(rawTestMachine).toHaveBeenCalledTimes(1)
  })

  it('automatisation désactivée : un seul essai, jamais de boucle', async () => {
    vi.mocked(rawAlertThresholds).mockResolvedValue({ temperature_max_c: 60, vibration_max_hz: 45, surconsommation_ratio: 1.2, auto_resolve_enabled: false })
    vi.mocked(rawTestMachine).mockResolvedValue(result(false))

    const { result: hook } = renderHook(() => useAutoResolveMachine('M2', 'modérée'), { wrapper })
    await waitFor(() => expect(hook.current.autoEnabled).toBe(false))

    act(() => hook.current.trigger())
    await waitFor(() => expect(hook.current.status).toBe('idle'))
    expect(rawTestMachine).toHaveBeenCalledTimes(1)
  })

  it('modérée + automatisation activée : boucle jusqu’à résolution', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(rawAlertThresholds).mockResolvedValue({ temperature_max_c: 60, vibration_max_hz: 45, surconsommation_ratio: 1.2, auto_resolve_enabled: true })
    vi.mocked(rawTestMachine)
      .mockResolvedValueOnce(result(false))
      .mockResolvedValueOnce(result(false))
      .mockResolvedValueOnce(result(true))

    const { result: hook } = renderHook(() => useAutoResolveMachine('M3', 'modérée'), { wrapper })
    await waitFor(() => expect(hook.current.autoEnabled).toBe(true))

    act(() => hook.current.trigger())
    await vi.advanceTimersByTimeAsync(10_000)

    // L'état final de React peut arriver un instant après l'avance du temps simulé.
    await waitFor(() => expect(hook.current.status).toBe('resolved'))
    expect(rawTestMachine).toHaveBeenCalledTimes(3)
    expect(localStorage.getItem('nouankany-auto-resolve:M3')).toBeNull()
  })

  it('plafond atteint sans résolution : needs_human, jamais resolved', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(rawAlertThresholds).mockResolvedValue({ temperature_max_c: 60, vibration_max_hz: 45, surconsommation_ratio: 1.2, auto_resolve_enabled: true })
    vi.mocked(rawTestMachine).mockResolvedValue(result(false))

    const { result: hook } = renderHook(() => useAutoResolveMachine('M4', 'faible'), { wrapper })
    await waitFor(() => expect(hook.current.autoEnabled).toBe(true))

    act(() => hook.current.trigger())
    await vi.advanceTimersByTimeAsync(20_000)

    await waitFor(() => expect(hook.current.status).toBe('needs_human'))
    expect(rawTestMachine).toHaveBeenCalledTimes(5)
    expect(hook.current.lastResult?.resolved).toBe(false)
  })

  it('reprend une boucle interrompue (localStorage) au montage sans nouveau clic', async () => {
    localStorage.setItem('nouankany-auto-resolve:M5', JSON.stringify({ attempt: 2, startedAt: Date.now() }))
    vi.mocked(rawAlertThresholds).mockResolvedValue({ temperature_max_c: 60, vibration_max_hz: 45, surconsommation_ratio: 1.2, auto_resolve_enabled: true })
    vi.mocked(rawTestMachine).mockResolvedValue(result(true))

    renderHook(() => useAutoResolveMachine('M5', 'modérée'), { wrapper })

    await waitFor(() => expect(rawTestMachine).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(localStorage.getItem('nouankany-auto-resolve:M5')).toBeNull())
  })
})
