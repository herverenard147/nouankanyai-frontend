import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { rawEquipmentCatalog } from '@/api/rawBackend'
import { SelectField } from '@/components/ui/Modal'

export interface CatalogChoice {
  categorie: string
  marque: string
  modele: string
  puissance_kw: number
}

/**
 * Sélecteur catégorie → marque → modèle du catalogue d'équipements
 * (GET /api/equipment-catalog). Le modèle choisi remplit les champs du formulaire,
 * puissance comprise. PME et Industrie : catalogue industriel + référentiel validé ; Ménage :
 * référentiel domestique seul (rien n'est affiché tant qu'il est vide).
 */
export function CatalogPicker({ onPick, segment }: { onPick: (choice: CatalogChoice) => void; segment?: 'menage' }) {
  const catalog = useQuery({ queryKey: ['equipment-catalog', segment ?? 'tous'], queryFn: () => rawEquipmentCatalog(segment), staleTime: Infinity })
  const [categorie, setCategorie] = useState('')
  const [marque, setMarque] = useState('')

  if (!catalog.data || Object.keys(catalog.data).length === 0) return null
  const categories = Object.keys(catalog.data).sort()
  const brands = categorie ? Object.keys(catalog.data[categorie] ?? {}).sort() : []
  const models = categorie && marque ? (catalog.data[categorie]?.[marque]?.modeles ?? []) : []

  return (
    <fieldset className="grid grid-cols-1 gap-3 rounded-control border border-border p-3 sm:grid-cols-3">
      <legend className="px-1 text-xs font-semibold text-text-secondary">Choisir dans le catalogue</legend>
      <SelectField
        label="Catégorie"
        value={categorie}
        onChange={(value) => {
          setCategorie(value)
          setMarque('')
        }}
        options={[{ value: '', label: 'Choisir…' }, ...categories.map((c) => ({ value: c, label: c }))]}
      />
      <SelectField
        label="Marque"
        value={marque}
        onChange={setMarque}
        options={[{ value: '', label: 'Choisir…' }, ...brands.map((b) => ({ value: b, label: b }))]}
      />
      <SelectField
        label="Modèle"
        value=""
        onChange={(value) => {
          const model = models.find((m) => m.nom === value)
          if (model) onPick({ categorie, marque, modele: model.nom, puissance_kw: model.puissance_kw })
        }}
        options={[{ value: '', label: 'Choisir…' }, ...models.map((m) => ({ value: m.nom, label: `${m.nom} (${m.puissance_kw} kW${m.confiance === 'estimee' ? ', estimée' : ''})` }))]}
      />
    </fieldset>
  )
}
