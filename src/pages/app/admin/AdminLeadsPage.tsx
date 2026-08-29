import { MetricState } from '@/components/state/MetricState'
import { useAuditRequests } from '@/hooks/queries/useAuditRequests'

const SECTOR_LABEL: Record<string, string> = { pme: 'PME', industrie: 'Industrie' }
const STATUS_LABEL: Record<string, string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  qualifie: 'Qualifié',
  clos: 'Clos',
}

export function AdminLeadsPage() {
  const query = useAuditRequests()

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        Demandes d&rsquo;audit soumises depuis la landing (segments PME et Industrie). Chaque ligne est un prospect à
        recontacter, pas un compte utilisateur.
      </p>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-bg-elevated">
              <tr>
                {['Reçu le', 'Entreprise', 'Contact', 'Email', 'Téléphone', 'Segment', 'Statut', 'Message'].map((label) => (
                  <th
                    key={label}
                    className="px-4 py-3 text-left font-mono text-mono-axis font-semibold uppercase tracking-wide text-text-secondary"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data?.map((lead) => (
                <tr key={lead.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-text-secondary">
                    {new Date(lead.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{lead.entreprise}</td>
                  <td className="px-4 py-3 text-text-primary">{lead.contact_nom}</td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{lead.email}</td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{lead.telephone ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{SECTOR_LABEL[lead.secteur] ?? lead.secteur}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-pill bg-bg-elevated px-2.5 py-1 font-mono text-mono-badge font-semibold text-text-secondary">
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-text-secondary">{lead.message ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MetricState>
    </div>
  )
}
