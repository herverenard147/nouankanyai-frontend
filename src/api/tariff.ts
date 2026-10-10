import type { Profile, TariffInfo } from '@/types/domain'

/**
 * Barème CIE affiché par profil. Les montants recopient ceux de
 * backend/ml/tariffs.py (seule source de prix de la plateforme, utilisée pour
 * tous les coûts et gains calculés côté serveur) : toute modification se fait
 * d'abord là-bas, puis ici. Montants TTC, sources ANARE-CI et Ma CIE en ligne
 * (consultées le 2026-10-08), à confirmer sur une facture réelle.
 */
const RATE_LABEL_BY_PROFILE: Record<Exclude<Profile, 'admin'>, string> = {
  menage: '79,01 FCFA/kWh jusqu’à 180 kWh par kVA souscrit et par bimestre, 68,48 au-delà (tarif domestique CIE)',
  pme: '101,84 FCFA/kWh puis 86,62 au-delà de 180 kWh par kVA et par bimestre (tarif professionnel CIE)',
  industrie: '57,17 FCFA/kWh en heures creuses, 69,09 en heures pleines, 94,21 en pointe (moyenne tension CIE)',
}

export async function fetchTariff(profile: Profile): Promise<TariffInfo> {
  return { rateLabel: profile === 'admin' ? '' : RATE_LABEL_BY_PROFILE[profile] }
}

export function tariffShown(profile: Profile): boolean {
  return profile !== 'admin'
}
