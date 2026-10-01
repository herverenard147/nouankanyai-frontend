import type { BackendPlatformRole } from '@/types/backend'
import type { Profile } from '@/types/domain'

/**
 * Le backend n'a pas de champ "profil" natif : seulement `type_compte` (texte
 * libre saisi à l'inscription) et `platform_role` (accès admin, indépendant du
 * type de compte). On dérive le profil produit (qui pilote le menu et le
 * contenu du dashboard) de ces deux champs, côté frontend uniquement.
 */
export const ACCOUNT_TYPE_LABELS: Record<Profile, string> = {
  menage: 'Ménage',
  pme: 'PME',
  industrie: 'Industrie',
  // Le platform_role prime toujours sur type_compte (voir deriveProfile) : un compte admin peut avoir
  // n'importe quel type_compte hérité de son inscription, jamais affiché tel quel (retour du propriétaire,
  // 2026-10-01 — "Admin Nouankany · Ménage" laissait croire que le volet admin ne montrait que le Ménage).
  admin: 'Administrateur',
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
