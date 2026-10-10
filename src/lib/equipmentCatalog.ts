import { formatNumberFr } from '@/lib/formatters'
import type { BackendEquipmentCatalog } from '@/types/backend'
import type { ComboboxOption } from '@/components/ui/ComboboxField'

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()

/** Clé du catalogue qui correspond à une saisie (casse et accents ignorés), sinon null. */
function matchKey(keys: string[], typed: string): string | null {
  return keys.find((k) => plain(k) === plain(typed)) ?? null
}

export interface CatalogModelChoice {
  categorie: string
  marque: string
  modele: string
  puissance_kw: number
}

/**
 * Suggestions des trois champs indexés du formulaire d'ajout (catégorie, marque, modèle), à
 * partir du catalogue (GET /api/equipment-catalog). Chaque champ se restreint à ce qui est déjà
 * saisi au-dessus quand ça correspond au catalogue, sinon propose tout.
 */
export function catalogSuggestions(catalog: BackendEquipmentCatalog | undefined, form: { categorie: string; marque: string }) {
  if (!catalog) return { categories: [], marques: [], modeles: [], findModel: () => null as CatalogModelChoice | null }
  const categoryKey = matchKey(Object.keys(catalog), form.categorie)
  const categories = categoryKey ? [categoryKey] : Object.keys(catalog)
  const brandsIn = (cats: string[]) => [...new Set(cats.flatMap((c) => Object.keys(catalog[c])))].sort()
  const brands = brandsIn(categories)
  const brandKey = matchKey(brands, form.marque)
  const marques: ComboboxOption[] = brands.map((value) => ({ value }))
  const models: (CatalogModelChoice & { estimee: boolean })[] = []
  for (const c of categories) {
    for (const [brand, info] of Object.entries(catalog[c])) {
      if (brandKey && brand !== brandKey) continue
      for (const m of info.modeles) models.push({ categorie: c, marque: brand, modele: m.nom, puissance_kw: m.puissance_kw, estimee: m.confiance === 'estimee' })
    }
  }
  const modeles: ComboboxOption[] = models.map((m) => ({
    value: m.modele,
    hint: `${categoryKey ? '' : `${m.categorie} · `}${brandKey ? '' : `${m.marque} · `}${formatNumberFr(m.puissance_kw, 1)} kW${m.estimee ? ' (estimée)' : ''}`,
  }))
  return {
    categories: Object.keys(catalog).sort().map((value) => ({ value })),
    marques,
    modeles,
    findModel: (modele: string) => models.find((m) => m.modele === modele) ?? null,
  }
}
