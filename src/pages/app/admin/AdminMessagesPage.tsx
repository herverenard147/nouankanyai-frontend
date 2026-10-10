import { useQuery } from '@tanstack/react-query'

import { rawContactMessages, rawWaitlistEntries } from '@/api/rawBackend'
import { MetricState } from '@/components/state/MetricState'

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary'
const date = (iso: string) => new Date(iso).toLocaleString('fr-FR')

/**
 * Messages du formulaire de contact (GET /api/v1/contact) et inscrits à la liste d'attente
 * (GET /api/v1/waitlist, qui reçoit aussi l'inscription « Être informé » de la landing).
 * Réservé aux administrateurs, comme les deux routes.
 */
export function AdminMessagesPage() {
  const messages = useQuery({ queryKey: ['admin-contact'], queryFn: rawContactMessages })
  const waitlist = useQuery({ queryKey: ['admin-waitlist'], queryFn: rawWaitlistEntries })

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Messages de contact</h2>
        <MetricState status={messages.status} isEmpty={messages.data?.length === 0}>
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="bg-bg-elevated">
                <tr>
                  {['Reçu le', 'Nom', 'Email', 'Message'].map((label) => (
                    <th key={label} className={TH}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {messages.data?.map((m) => (
                  <tr key={m.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary">{date(m.created_at)}</td>
                    <td className="px-4 py-3 text-text-primary">{m.nom}</td>
                    <td className="px-4 py-3 text-text-secondary">{m.email}</td>
                    <td className="max-w-md whitespace-pre-line px-4 py-3 text-text-secondary">{m.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MetricState>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Liste d&rsquo;attente et newsletter</h2>
        <MetricState status={waitlist.status} isEmpty={waitlist.data?.length === 0}>
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead className="bg-bg-elevated">
                <tr>
                  {['Inscrit le', 'Email', 'Téléphone'].map((label) => (
                    <th key={label} className={TH}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waitlist.data?.map((w) => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary">{date(w.created_at)}</td>
                    <td className="px-4 py-3 text-text-primary">{w.email}</td>
                    <td className="px-4 py-3 tabular-nums text-text-secondary">{w.telephone ?? 'Non renseigné'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MetricState>
      </section>
    </div>
  )
}
