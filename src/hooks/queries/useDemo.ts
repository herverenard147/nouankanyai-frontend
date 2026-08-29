import { useMutation, useQueryClient } from '@tanstack/react-query'

import { rawSeedDemoData } from '@/api/rawBackend'

/**
 * Essai gratuit : peuple le compte connecté avec des sites/équipements/
 * factures fictifs (voir app/api/v1/demo/router.py, backend). Invalide tout
 * le cache plutôt qu'une liste de clés — c'est un rafraîchissement global
 * volontaire et rare (un clic explicite sur "Charger des données de
 * démonstration"), pas une mutation fréquente où l'exhaustivité de la liste
 * importerait pour la performance.
 */
export function useSeedDemoData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rawSeedDemoData,
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
