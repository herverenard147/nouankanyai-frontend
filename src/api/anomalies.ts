import type { AnomalyResolution, Profile } from '@/types/domain'

/**
 * Le backend n'a pas de mécanisme qui marque une AIAlert comme résolue
 * (`is_resolved` reste toujours `false`) : pas d'historique de résolutions à
 * afficher honnêtement aujourd'hui. Renvoie une liste vide plutôt qu'une
 * donnée inventée — `MetricState` affiche l'état vide, pas une erreur.
 */
export async function fetchResolutions(_profile: Profile): Promise<AnomalyResolution[]> {
  return []
}
