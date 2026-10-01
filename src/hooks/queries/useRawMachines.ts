import { useQuery } from '@tanstack/react-query'

import { getCachedMachines } from '@/api/rawBackend'

/**
 * Version brute (non transformée en libellés d'affichage) de la liste des
 * machines — utilisée pour préremplir le formulaire de modification, où l'on
 * a besoin des valeurs réelles (ex: priority="haute"), pas du libellé affiché
 * dans la table (ex: "Haute"). Même endpoint que useEquipmentTable/
 * useMachinesTable, clé de requête différente pour ne pas mélanger les deux
 * formes dans le cache.
 */
export function useRawMachines() {
  return useQuery({ queryKey: ['machines-raw'], queryFn: getCachedMachines })
}
