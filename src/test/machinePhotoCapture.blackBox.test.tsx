import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { MachineFormDrawer } from '@/components/machines/MachineFormDrawer'
import type { BackendMachine } from '@/types/backend'

/**
 * Type 1 — boîte noire : dérivé uniquement du contrat décrit dans le plan
 * (POST /api/machines/extract-photo -> {status, extracted: {...5 champs...},
 * photo_data_url}; "n'invente aucune valeur"; bouton réservé à l'ajout; une
 * catégorie non reconnue ne bloque jamais la soumission), sans s'appuyer sur
 * les noms de fonctions/caches internes — seulement sur la frontière réseau
 * (`@/api/rawBackend`), qui est la vraie frontière du contrat testé ici.
 */
vi.mock('@/api/rawBackend', () => ({
  rawExtractMachinePhoto: vi.fn(),
  rawAddMachine: vi.fn().mockResolvedValue({}),
  rawUpdateMachine: vi.fn().mockResolvedValue({}),
  rawDeleteMachine: vi.fn().mockResolvedValue({}),
  rawTestMachine: vi.fn().mockResolvedValue({}),
  rawSites: vi.fn().mockResolvedValue([]),
  rawCreateSite: vi.fn().mockResolvedValue({}),
  // MachineFormDrawer -> useMachineCrud -> useAutoResolveMachine -> useThresholds,
  // importé transitivement même si ce test ne l'utilise pas.
  rawAlertThresholds: vi.fn().mockResolvedValue({ temperature_max_c: 60, vibration_max_hz: 45, surconsommation_ratio: 1.2, auto_resolve_enabled: false }),
  rawUpdateAlertThresholds: vi.fn().mockResolvedValue({}),
}))

import { rawExtractMachinePhoto, rawAddMachine } from '@/api/rawBackend'

function renderDrawer(machine: BackendMachine | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MachineFormDrawer machine={machine} itemLabel="un appareil" onClose={vi.fn()} />
    </QueryClientProvider>,
  )
}

const existingMachine: BackendMachine = {
  machine_id: 'm1',
  nom: 'Four existant',
  site_id: null,
  site_nom: '',
  power_kw: 1,
  temperature_c: 0,
  vibration_hz: 0,
  pressure_bar: 0,
  status: 'ok',
  priority: 'moyenne',
  categorie: 'Cuisine',
  marque: null,
  modele: null,
  numero_serie: null,
}

describe('Ajout de machine par photo (boîte noire)', () => {
  beforeEach(() => {
    vi.mocked(rawExtractMachinePhoto).mockReset()
    vi.mocked(rawAddMachine).mockClear()
  })

  it('réserve le bouton « Ajouter par photo » au mode création', () => {
    renderDrawer(null)
    expect(screen.getByRole('button', { name: 'Ajouter par photo' })).toBeInTheDocument()
  })

  it("n'affiche pas le bouton en modification d'une machine existante", () => {
    renderDrawer(existingMachine)
    expect(screen.queryByRole('button', { name: 'Ajouter par photo' })).not.toBeInTheDocument()
  })

  it('pré-remplit uniquement les champs non-null extraits, sans jamais deviner un champ null', async () => {
    vi.mocked(rawExtractMachinePhoto).mockResolvedValue({
      status: 'success',
      extracted: { nom_suggere: 'Réfrigérateur', categorie: null, marque: 'Samsung', modele: null, puissance_nominale_kw: 0.3, categorie_connue: false },
      photo_data_url: 'data:image/jpeg;base64,xyz',
    })
    renderDrawer(null)

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter par photo' }))
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } })

    await waitFor(() => expect(screen.getByLabelText('Nom')).toHaveValue('Réfrigérateur'))
    expect(screen.getByLabelText('Marque')).toHaveValue('Samsung')
    expect(screen.getByLabelText('Catégorie')).toHaveValue('')
    expect(screen.getByLabelText('Modèle')).toHaveValue('')

    expect(screen.getByText(/Catégorie non reconnue automatiquement/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter' })).not.toBeDisabled()
  })

  it('un échec d’extraction affiche un message dédié, jamais une trace brute, et ne bloque pas la saisie manuelle', async () => {
    vi.mocked(rawExtractMachinePhoto).mockRejectedValue(new Error("Impossible de reconnaître cet appareil. Essayez une photo plus nette, si possible de la plaque signalétique."))
    renderDrawer(null)

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter par photo' }))
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } })

    await waitFor(() => expect(screen.queryByText(/stack|Error:/i)).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Revenir au formulaire' }))
    expect(screen.getByLabelText('Nom')).not.toBeDisabled()
  })
})
