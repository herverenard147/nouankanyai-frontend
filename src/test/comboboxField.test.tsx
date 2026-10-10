import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ComboboxField, filterOptions } from '@/components/ui/ComboboxField'
import { catalogSuggestions } from '@/lib/equipmentCatalog'
import type { BackendEquipmentCatalog } from '@/types/backend'

const catalog: BackendEquipmentCatalog = {
  Climatiseur: {
    Nasco: { efficacite: 'inconnue', modeles: [{ nom: 'NAS-AX9V1', puissance_kw: 0.824, confiance: 'estimee' }, { nom: 'NAS-AX12V1', puissance_kw: 1.099, confiance: 'estimee' }] },
    Midea: { efficacite: 'inconnue', modeles: [{ nom: 'MSEF1C-18CRDN8', puissance_kw: 1.649 }] },
  },
  'Lave-linge': { Nasco: { efficacite: 'haute', modeles: [{ nom: 'NASTT-B50FL', puissance_kw: 0.2 }] } },
}

describe('suggestions à la saisie', () => {
  it('filtre à chaque mot tapé, sans tenir compte des accents ni de l’ordre', () => {
    const options = ['Lave-linge', 'Climatiseur', 'Réfrigérateur'].map((value) => ({ value }))
    expect(filterOptions(options, 'refri', 8).map((o) => o.value)).toEqual(['Réfrigérateur'])
    expect(filterOptions(options, 'linge lave', 8).map((o) => o.value)).toEqual(['Lave-linge'])
    expect(filterOptions(options, '', 2)).toHaveLength(2)
  })

  it('restreint marques et modèles à la catégorie et à la marque déjà saisies', () => {
    const s = catalogSuggestions(catalog, { categorie: 'climatiseur', marque: 'nasco' })
    expect(s.marques.map((o) => o.value)).toEqual(['Midea', 'Nasco'])
    expect(s.modeles.map((o) => o.value)).toEqual(['NAS-AX9V1', 'NAS-AX12V1'])
    expect(s.modeles[0].hint).toBe('0,8 kW (estimée)')
    const libre = catalogSuggestions(catalog, { categorie: 'Pompe artisanale', marque: '' })
    expect(libre.modeles).toHaveLength(4) // catégorie hors catalogue : tout reste proposé
  })

  it('la saisie libre reste possible et une suggestion se choisit au clavier', () => {
    const onSelect = vi.fn()
    const parentKeyDown = vi.fn()
    function Harness() {
      const [value, setValue] = useState('')
      // Le parent écoute Échap comme le modal (onKeyDown React).
      return (
        <div onKeyDown={(e) => e.key === 'Escape' && parentKeyDown()}>
          <ComboboxField label="Modèle" value={value} onChange={setValue} onSelect={onSelect} options={catalogSuggestions(catalog, { categorie: '', marque: '' }).modeles} />
        </div>
      )
    }
    render(<Harness />)
    const input = screen.getByRole('combobox', { name: 'Modèle' })
    fireEvent.change(input, { target: { value: 'ax12' } })
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['NAS-AX12V1Climatiseur · Nasco · 1,1 kW (estimée)'])
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'NAS-AX12V1' }))
    expect((input as HTMLInputElement).value).toBe('NAS-AX12V1')
    fireEvent.change(input, { target: { value: 'NAS' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('option')).toBeNull()
    expect(parentKeyDown).not.toHaveBeenCalled() // Échap ferme la liste, pas le modal autour
    fireEvent.change(input, { target: { value: 'Mon modèle maison' } })
    expect((input as HTMLInputElement).value).toBe('Mon modèle maison')
    expect(screen.queryByRole('option')).toBeNull()
  })
})
