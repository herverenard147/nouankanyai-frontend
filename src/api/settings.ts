import { rawAlertThresholds, rawUpdateAlertThresholds } from '@/api/rawBackend'
import type { BackendAlertThresholds } from '@/types/backend'

/**
 * Un seul jeu de seuils global par compte côté backend (pas de variante
 * multi-niveaux par profil) : la page Paramètres l'affiche et l'édite
 * directement dans sa forme réelle plutôt que de le forcer dans l'ancienne
 * union `Thresholds` (global/per-equipment/multi-level), qui ne correspond à
 * aucune de ces trois formes ici.
 */
export const fetchThresholds = rawAlertThresholds
export const updateThresholds = (payload: BackendAlertThresholds) => rawUpdateAlertThresholds(payload)
