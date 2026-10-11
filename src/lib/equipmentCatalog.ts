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

/** Mots du quotidien qui doivent trouver une catégorie du catalogue. */
const CATEGORY_KEYWORDS: Record<string, string> = {
  refrigerateur: 'frigo frigidaire refrigerateur',
  climatiseur: 'clim climatisation split',
  televiseur: 'tele tv television ecran',
  'lave-linge': 'machine a laver lave linge',
  congelateur: 'congelo freezer',
}

/**
 * Catégories courantes proposées en plus de celles du catalogue : un nom à choisir, sans
 * puissance (elle reste à saisir, rien n'est inventé).
 */
const COMMON_CATEGORIES: Record<'menage' | 'autres', string[]> = {
  menage: ['Congélateur', 'Ventilateur', 'Fer à repasser', 'Micro-ondes', 'Chauffe-eau', 'Cuisinière électrique', 'Bouilloire', 'Ordinateur', 'Éclairage', 'Pompe à eau'],
  autres: ['Climatiseur', 'Réfrigérateur', 'Congélateur', 'Four', 'Pompe', 'Compresseur', 'Éclairage', 'Moteur électrique', 'Ordinateur et bureautique'],
}

export interface CatalogModelChoice {
  categorie: string
  marque: string
  modele: string
  puissance_kw: number
  reference_id?: string
}

/**
 * Suggestions des trois champs indexés du formulaire d'ajout (catégorie, marque, modèle), à
 * partir du catalogue (GET /api/equipment-catalog). Chaque champ se restreint à ce qui est déjà
 * saisi au-dessus quand ça correspond au catalogue, sinon propose tout.
 */
export function catalogSuggestions(
  catalog: BackendEquipmentCatalog | undefined,
  form: { categorie: string; marque: string },
  segment: 'menage' | 'autres' = 'autres',
) {
  const withKeywords = (value: string): ComboboxOption => ({ value, keywords: CATEGORY_KEYWORDS[plain(value)] })
  if (!catalog)
    return { categories: COMMON_CATEGORIES[segment].map(withKeywords), marques: [], modeles: [], noms: [], findModel: () => null as CatalogModelChoice | null }
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
      for (const m of info.modeles) models.push({ categorie: c, marque: brand, modele: m.nom, puissance_kw: m.puissance_kw, estimee: m.confiance === 'estimee', reference_id: m.reference_id })
    }
  }
  const modeles: ComboboxOption[] = models.map((m) => ({
    value: m.modele,
    hint: `${categoryKey ? '' : `${m.categorie} · `}${brandKey ? '' : `${m.marque} · `}${formatNumberFr(m.puissance_kw, 1)} kW${m.estimee ? ' (estimée)' : ''}`,
  }))
  const known = Object.keys(catalog)
  const extra = COMMON_CATEGORIES[segment].filter((name) => !known.some((k) => plain(k) === plain(name)))
  // Champ « Nom » : tous les modèles du catalogue, trouvés par catégorie, marque ou référence.
  const fullName = (m: CatalogModelChoice) => `${m.categorie} ${m.marque} ${m.modele}`
  const all: CatalogModelChoice[] = []
  for (const [c, brandsOf] of Object.entries(catalog))
    for (const [brand, info] of Object.entries(brandsOf))
      for (const m of info.modeles) all.push({ categorie: c, marque: brand, modele: m.nom, puissance_kw: m.puissance_kw, reference_id: m.reference_id })
  const noms: ComboboxOption[] = all.map((m) => ({
    value: fullName(m),
    hint: `${formatNumberFr(m.puissance_kw, 1)} kW`,
    keywords: CATEGORY_KEYWORDS[plain(m.categorie)],
  }))
  return {
    categories: [...known, ...extra].sort((x, y) => x.localeCompare(y, 'fr')).map(withKeywords),
    marques,
    modeles,
    noms,
    findModel: (modele: string) => models.find((m) => m.modele === modele) ?? all.find((m) => fullName(m) === modele) ?? null,
  }
}
