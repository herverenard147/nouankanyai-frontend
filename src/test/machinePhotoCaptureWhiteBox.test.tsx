import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { MachinePhotoCapture } from '@/components/machines/MachinePhotoCapture'
import { useExtractMachinePhoto } from '@/hooks/queries/useMachineCrud'
import type { BackendMachinePhotoExtraction } from '@/types/backend'

/**
 * Type 2 — boîte blanche : s'appuie sur le nom réel du hook
 * (`useExtractMachinePhoto`, voir src/hooks/queries/useMachineCrud.ts) tel
 * qu'implémenté, par opposition au test boîte noire qui ne regarde que le
 * contrat déclaré dans le plan.
 */
vi.mock('@/hooks/queries/useMachineCrud', () => ({
  useExtractMachinePhoto: vi.fn(),
}))

const mockedHook = useExtractMachinePhoto as unknown as ReturnType<typeof vi.fn>

function fakeFile() {
  return new File(['x'], 'appareil.jpg', { type: 'image/jpeg' })
}

describe('MachinePhotoCapture (boîte blanche)', () => {
  beforeEach(() => {
    mockedHook.mockReset()
  })

  it('appelle mutate(file) avec le callback onSuccess fourni par le composant', () => {
    const mutate = vi.fn()
    mockedHook.mockReturnValue({ mutate, isPending: false, isError: false, error: null })
    const onExtracted = vi.fn()

    render(<MachinePhotoCapture onExtracted={onExtracted} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [fakeFile()] } })

    expect(mutate).toHaveBeenCalledTimes(1)
    const [file, opts] = mutate.mock.calls[0]
    expect(file).toBeInstanceOf(File)

    const extraction: BackendMachinePhotoExtraction = {
      status: 'success',
      extracted: { nom_suggere: 'Four', categorie: 'Cuisine', marque: null, modele: null, puissance_nominale_kw: 2.5, categorie_connue: true },
      photo_data_url: 'data:image/jpeg;base64,abc',
    }
    opts.onSuccess(extraction)
    expect(onExtracted).toHaveBeenCalledWith(extraction.extracted, extraction.photo_data_url)
  })

  it('désactive le bouton pendant isPending (busyLabel affiché)', () => {
    mockedHook.mockReturnValue({ mutate: vi.fn(), isPending: true, isError: false, error: null })
    render(<MachinePhotoCapture onExtracted={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Analyse en cours…' })).toBeDisabled()
  })

  it('affiche MutationError quand isError, jamais une trace brute', async () => {
    mockedHook.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: { message: "Impossible de reconnaître cet appareil. Essayez une photo plus nette." },
    })
    render(<MachinePhotoCapture onExtracted={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/L'opération a échoué|reconnaître/)).toBeInTheDocument())
  })
})
