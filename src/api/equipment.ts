import { priorityLabel, statusLabel } from '@/api/backendHelpers'
import { alertedMachineIds } from '@/api/machinesTable'
import { getCachedMachines } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
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

function plate(kw: number | null | undefined, profile: Profile): string {
  if (kw === null || kw === undefined) return '-'
  return profile === 'menage' ? `${formatNumberFr(kw * 1000, 0)} W` : `${formatNumberFr(kw, 1)} kW`
}

export async function fetchEquipmentTable(profile: Profile): Promise<{ title: string; rows: EquipmentRow[] }> {
  const machines = await getCachedMachines()
  const alerted = await alertedMachineIds(machines)
  return {
    title: 'Équipements déclarés',
    rows: machines.map((m) => ({
      id: m.machine_id,
      nom: m.nom,
      categorie: categoryLabel(m.categorie),
      marque: m.marque ?? '-',
      modele: m.modele ?? '-',
      site: m.site_nom,
      puissance: plate(m.puissance_nominale_kw ?? m.power_kw, profile),
      attendu: m.estimation_reference
        ? `≈ ${formatNumberFr(m.estimation_reference.kwh_jour, 1)} kWh, ${formatNumberFr(m.estimation_reference.cout_jour_fcfa, 0)} FCFA`
        : '-',
      priorite: priorityLabel(m.priority),
      statut: alerted.has(m.machine_id) ? statusLabel('alerte') : statusLabel(m.status),
      provenance: 'estime' as const,
      photo_data_url: m.photo_data_url ?? null,
    })),
  }
}
