import { useMutation, useQueryClient } from '@tanstack/react-query'

import { rawUpdateAuditRequest } from '@/api/rawBackend'
import { MetricState } from '@/components/state/MetricState'
import { MutationError } from '@/components/ui/Modal'
import { useAuditRequests } from '@/hooks/queries/useAuditRequests'
import type { BackendAuditRequest } from '@/types/backend'

const SECTOR_LABEL: Record<string, string> = { pme: 'PME', industrie: 'Industrie' }
const STATUS_LABEL: Record<string, string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  qualifie: 'Qualifié',
  clos: 'Clos',
}

export function AdminLeadsPage() {
  const query = useAuditRequests()
  const queryClient = useQueryClient()
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BackendAuditRequest['status'] }) => rawUpdateAuditRequest(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit-requests'] }),
  })

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        Demandes d&rsquo;audit soumises depuis la landing (segments PME et Industrie). Chaque ligne est un prospect à
        recontacter, pas un compte utilisateur.
      </p>
      <MutationError error={update.error} />
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-bg-elevated">
              <tr>
                {['Reçu le', 'Entreprise', 'Contact', 'Email', 'Téléphone', 'Segment', 'Statut', 'Message'].map((label) => (
                  <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data?.map((lead) => (
                <tr key={lead.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary">
                    {new Date(lead.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{lead.entreprise}</td>
                  <td className="px-4 py-3 text-text-primary">{lead.contact_nom}</td>
                  <td className="px-4 py-3 text-text-secondary">{lead.email}</td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">{lead.telephone ?? '-'}</td>
                  <td className="px-4 py-3 text-text-secondary">{SECTOR_LABEL[lead.secteur] ?? lead.secteur}</td>
                  <td className="px-4 py-3">
                    {/* Suivi de la demande (test du site, 2026-10-18 : « Nouveau » sans moyen de le changer). */}
                    <select
                      aria-label={`Statut de la demande de ${lead.entreprise}`}
                      value={lead.status}
                      disabled={update.isPending}
                      onChange={(e) => update.mutate({ id: lead.id, status: e.target.value as BackendAuditRequest['status'] })}
                      className="focus-ring min-h-9 rounded-control border border-border bg-card px-2 text-xs font-semibold"
                    >
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-text-secondary">{lead.message ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MetricState>
    </div>
  )
}
