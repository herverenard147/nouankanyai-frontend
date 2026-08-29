import type { BackendPlatformRole } from '@/types/backend'
import type { Profile } from '@/types/domain'

/**
 * Le backend n'a pas de champ "profil" natif : seulement `type_compte` (texte
 * libre saisi à l'inscription) et `platform_role` (accès admin, indépendant du
 * type de compte). On dérive le profil produit (qui pilote le menu et le
 * contenu du dashboard) de ces deux champs, côté frontend uniquement.
 */
export const ACCOUNT_TYPE_LABELS: Record<Exclude<Profile, 'admin'>, string> = {
  menage: 'Ménage',
  pme: 'PME',
  industrie: 'Industrie',
}

const TYPE_COMPTE_TO_PROFILE: Record<string, Profile> = {
  ménage: 'menage',
  menage: 'menage',
  particulier: 'menage',
  pme: 'pme',
  professionnel: 'pme',
  industrie: 'industrie',
  industriel: 'industrie',
}

export function deriveProfile(typeCompte: string, platformRole: BackendPlatformRole): Profile {
  if (platformRole === 'admin' || platformRole === 'superadmin') return 'admin'
  const normalized = typeCompte.trim().toLowerCase()
  return TYPE_COMPTE_TO_PROFILE[normalized] ?? 'menage'
}
