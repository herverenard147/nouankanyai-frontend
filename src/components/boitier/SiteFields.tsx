import { SelectField } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import type { SiteChoice } from '@/lib/boitierForms'
import type { BackendSite } from '@/types/backend'

/**
 * Où le boîtier est installé. Un compte neuf n'a encore aucun site (ils naissent avec les machines) : on le crée ici
 * plutôt que de bloquer la demande.
 */
export function SiteFields({ sites, value, onChange, label }: { sites: BackendSite[]; value: SiteChoice; onChange: (next: SiteChoice) => void; label: string }) {
  if (sites.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={`${label} : nom du site`} placeholder="Ex. Domicile, Boulangerie" value={value.newName} onChange={(e) => onChange({ ...value, newName: e.target.value })} />
        <TextField label="Ville ou quartier" placeholder="Ex. Abidjan, Cocody" value={value.newLocation} onChange={(e) => onChange({ ...value, newLocation: e.target.value })} />
      </div>
    )
  }
  return (
    <SelectField
      label={label}
      value={value.siteId || sites[0].id}
      onChange={(siteId) => onChange({ ...value, siteId })}
      options={sites.map((site) => ({ value: site.id, label: site.nom }))}
    />
  )
}
