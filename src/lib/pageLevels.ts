import type { Level, Profile } from '@/types/domain'

/**
 * Niveaux proposés sur chaque page (tableau validé par le propriétaire, 2026-10-20) : seulement les niveaux qui
 * changent vraiment ce que la page montre. Deux niveaux identiques ne font qu'un bouton, au nom du plus élevé (Débutant
 * et Amateur identiques : « Amateur »). Une page identique à tous les niveaux n'a pas de bouton. PME et Industrie
 * seulement : le ménage garde la règle de DESIGN.md (un seul niveau, aucun sélecteur), l'Admin et le technicien
 * gardent les trois.
 */
const ALL: Level[] = ['debutant', 'amateur', 'technique']
const FROM_TECHNIQUE: Level[] = ['amateur', 'technique']   // seul « technique » ajoute quelque chose
const FROM_AMATEUR: Level[] = ['debutant', 'technique']    // tout s'ajoute dès « amateur »

const BY_PAGE: { path: string; levels: Level[]; industrie?: Level[] }[] = [
  { path: '/app/apercu', levels: ALL, industrie: FROM_TECHNIQUE },
  { path: '/app/alertes', levels: ALL },
  { path: '/app/boitier', levels: ALL },
  { path: '/app/audit', levels: ALL },
  { path: '/app/consommation', levels: FROM_TECHNIQUE },
  { path: '/app/prediction', levels: FROM_TECHNIQUE },
  { path: '/app/machines', levels: FROM_TECHNIQUE },
  { path: '/app/plan-action', levels: FROM_TECHNIQUE },
  { path: '/app/conseils', levels: FROM_AMATEUR },
  { path: '/app/recommandations', levels: FROM_AMATEUR },
  { path: '/app/equipements', levels: FROM_AMATEUR },
]

/** Niveaux du bouton pour cette page ; liste vide : pas de bouton. */
export function pageLevels(profile: Profile, pathname: string): Level[] {
  if (profile === 'menage') return []
  if (profile !== 'pme' && profile !== 'industrie') return ALL
  // La page d'un appareil est la même à tous les niveaux (2026-10-20) : pas de bouton.
  if (/^\/app\/(machines|equipements)\/[^/]+/.test(pathname)) return []
  const page = BY_PAGE.find((p) => pathname === p.path || pathname.startsWith(`${p.path}/`))
  if (!page) return []
  return profile === 'industrie' && page.industrie ? page.industrie : page.levels
}

/** Bouton allumé : celui du groupe qui contient le niveau choisi (le plus petit bouton au moins égal). */
export function activeOption(level: Level, options: Level[]): Level {
  const rank = (l: Level) => ALL.indexOf(l)
  return options.find((o) => rank(o) >= rank(level)) ?? options[options.length - 1]
}
