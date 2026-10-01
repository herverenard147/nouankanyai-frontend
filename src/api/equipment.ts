import { priorityLabel, statusLabel } from '@/api/backendHelpers'
import { getCachedMachines } from '@/api/rawBackend'
import type { EquipmentRow, Profile } from '@/types/domain'

export async function fetchEquipmentTable(_profile: Profile): Promise<{ title: string; rows: EquipmentRow[] }> {
  const machines = await getCachedMachines()
  return {
    title: 'Équipements déclarés',
    rows: machines.map((m) => ({
      id: m.machine_id,
      categorie: m.categorie ?? '—',
      marque: m.marque ?? '—',
      modele: m.modele ?? '—',
      site: m.site_nom,
      priorite: priorityLabel(m.priority),
      statut: statusLabel(m.status),
      provenance: 'estime' as const,
    })),
  }
}
