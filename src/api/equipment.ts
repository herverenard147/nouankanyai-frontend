import { priorityLabel, statusLabel } from '@/api/backendHelpers'
import { getCachedMachines } from '@/api/rawBackend'
import type { EquipmentRow, Profile } from '@/types/domain'

/** Familles d'appareils du serveur (ml/equipment_family.py) en clair : sans cela, le tableau montrait
 * « electrique_tournant » ou « refrigeration ». Une catégorie saisie librement s'affiche telle quelle. */
const FAMILY_LABEL: Record<string, string> = {
  eclairage: 'Éclairage',
  refrigeration: 'Froid',
  climatisation: 'Climatisation',
  chauffage: 'Chauffage',
  cuisson: 'Cuisson',
  compresseur: 'Compresseur',
  pompe: 'Pompe',
  convoyeur: 'Convoyeur',
  electrique_tournant: 'Moteur',
  multimedia: 'Multimédia',
  lavage: 'Lavage',
  generique: 'Autre',
}

export function categoryLabel(categorie: string | null | undefined): string {
  if (!categorie) return '-'
  return FAMILY_LABEL[categorie] ?? categorie
}

export async function fetchEquipmentTable(_profile: Profile): Promise<{ title: string; rows: EquipmentRow[] }> {
  const machines = await getCachedMachines()
  return {
    title: 'Équipements déclarés',
    rows: machines.map((m) => ({
      id: m.machine_id,
      nom: m.nom,
      categorie: categoryLabel(m.categorie),
      marque: m.marque ?? '-',
      modele: m.modele ?? '-',
      site: m.site_nom,
      priorite: priorityLabel(m.priority),
      statut: statusLabel(m.status),
      provenance: 'estime' as const,
      photo_data_url: m.photo_data_url ?? null,
    })),
  }
}
