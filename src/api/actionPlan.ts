import type { ActionPlanItem, Profile } from '@/types/domain'

/**
 * Le backend n'a pas de concept de "plan d'action mensuel chiffré" — seules les
 * recommandations ponctuelles de `/api/recommend` existent (voir api/advice.ts).
 * Renvoie une liste vide plutôt qu'un chiffre inventé.
 */
export async function fetchActionPlan(_profile: Profile): Promise<ActionPlanItem[]> {
  return []
}
