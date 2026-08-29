import type { Profile, TariffInfo } from '@/types/domain'

/**
 * Le backend n'expose pas de tranche tarifaire "en cours" via l'API (la grille
 * CIE n'est utilisée que côté serveur, dans les calculs de coût/gain). On
 * affiche donc la grille comme référence statique publique, sans prétendre à
 * une lecture live — voir backend/data/cie_tariffs.json et le README.
 */
export async function fetchTariff(_profile: Profile): Promise<TariffInfo> {
  return { rateLabel: '36 à 96 FCFA/kWh selon la tranche de consommation (grille CIE)' }
}

export function tariffShown(profile: Profile): boolean {
  return profile !== 'admin'
}
