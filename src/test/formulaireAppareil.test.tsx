import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { ComboboxField, filterOptions } from '@/components/ui/ComboboxField'
import { TextField } from '@/components/ui/TextField'
import { catalogSuggestions } from '@/lib/equipmentCatalog'
import type { BackendEquipmentCatalog } from '@/types/backend'

const catalog = {
  Réfrigérateur: { 'SMART TECHNOLOGY': { efficacite: 'haute', modeles: [{ nom: 'STCB-145H', puissance_kw: 0.1, reference_id: 'ref-1' }] } },
  Climatiseur: { Midea: { efficacite: 'inconnue', modeles: [{ nom: 'MSEF1C-18', puissance_kw: 1.649 }] } },
} as unknown as BackendEquipmentCatalog

describe('suggestions du formulaire d’appareil', () => {
  it('les mots du quotidien trouvent la catégorie du catalogue', () => {
    const { categories } = catalogSuggestions(catalog, { categorie: '', marque: '' }, 'menage')
    expect(filterOptions(categories, 'frigo', 8).map((o) => o.value)).toEqual(['Réfrigérateur'])
    expect(filterOptions(categories, 'clim', 8).map((o) => o.value)).toEqual(['Climatiseur'])
  })
  it('des catégories courantes sont proposées en plus du catalogue, sans doublon', () => {
    const values = catalogSuggestions(catalog, { categorie: '', marque: '' }, 'menage').categories.map((o) => o.value)
    expect(values).toContain('Ventilateur')
    expect(values).toContain('Fer à repasser')
    expect(values.filter((v) => v === 'Réfrigérateur')).toHaveLength(1)
  })
  it('sans catalogue chargé, les catégories courantes restent proposées', () => {
    expect(catalogSuggestions(undefined, { categorie: '', marque: '' }, 'menage').categories.length).toBeGreaterThan(5)
  })
  it('le champ Nom propose les modèles, trouvés par catégorie, marque ou référence', () => {
    const { noms, findModel } = catalogSuggestions(catalog, { categorie: '', marque: '' }, 'menage')
    expect(filterOptions(noms, 'midea', 8).map((o) => o.value)).toEqual(['Climatiseur Midea MSEF1C-18'])
    expect(filterOptions(noms, 'frigo', 8).map((o) => o.value)).toEqual(['Réfrigérateur SMART TECHNOLOGY STCB-145H'])
    expect(findModel('Réfrigérateur SMART TECHNOLOGY STCB-145H')).toMatchObject({ modele: 'STCB-145H', puissance_kw: 0.1, reference_id: 'ref-1' })
  })
})

describe('champs obligatoires', () => {
  it('une étoile marque le champ obligatoire, sans changer son libellé', () => {
    const { container } = render(<><TextField label="Nom" required /><TextField label="Marque" /></>)
    expect(screen.getByLabelText('Nom')).toBeTruthy()
    expect(container.querySelectorAll('[title="Champ obligatoire"]')).toHaveLength(1)
  })
  it('la liste de suggestions dit quand rien ne correspond, et affiche l’erreur du champ', () => {
    function Field() {
      const [value, setValue] = useState('')
      return <ComboboxField label="Catégorie" required error="Champ à remplir." value={value} onChange={setValue} options={[{ value: 'Climatiseur' }]} />
    }
    const { container } = render(<Field />)
    expect(container.querySelectorAll('[title="Champ obligatoire"]')).toHaveLength(1)
    expect(screen.getByText('Champ à remplir.')).toBeTruthy()
    const input = screen.getByLabelText('Catégorie')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'tracteur' } })
    expect(screen.getByText(/Aucune suggestion pour cette saisie/)).toBeTruthy()
    fireEvent.change(input, { target: { value: 'clim' } })
    expect(screen.queryByText(/Aucune suggestion/)).toBeNull()
    expect(screen.getByRole('option', { name: 'Climatiseur' })).toBeTruthy()
  })
})
