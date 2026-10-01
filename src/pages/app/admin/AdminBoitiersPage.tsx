import { Link } from 'react-router-dom'

import { CONNECTION_LABEL, LANGUAGE_LABEL, connectionOf, lastActivity } from '@/api/boitiers'
import { BoitierSectionBlock, Th } from '@/components/boitier/BoitierParts'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { MutationError } from '@/components/ui/Modal'
import { useAdminBoitierMutations, useAdminBoitierRequests, useAdminBoitiers } from '@/hooks/queries/useBoitiers'
import { formatFcfa, formatUtcDateTime } from '@/lib/formatters'

function Tile({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="border-l border-border px-5 py-4 first:border-l-0">
      <div className="text-xs font-medium text-text-secondary">{label}</div>
      <div className="mt-1 font-heading text-[2.1rem] font-bold leading-tight tracking-tight tabular-nums text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary">{note}</div>
      <div className="mt-2">
        <ProvenanceBadge value="telemetrie_systeme" />
      </div>
    </div>
  )
}

/**
 * Boîtiers de la plateforme : les demandes à livrer arrivent ici (« Marquer comme livré »), puis chaque boîtier connecté
 * apparaît dans la liste avec sa fiche. Au départ, il n'y a ni demande ni boîtier.
 */
export function AdminBoitiersPage() {
  const devices = useAdminBoitiers()
  const requests = useAdminBoitierRequests()
  const { setDelivered } = useAdminBoitierMutations()

  const status = devices.status === 'error' || requests.status === 'error' ? 'error' : devices.isSuccess && requests.isSuccess ? 'success' : 'pending'
  const list = devices.data ?? []
  const asks = requests.data ?? []
  const toDeliver = asks.filter((r) => r.status === 'a_livrer').length

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        Les demandes de boîtier arrivent ici ; chaque boîtier connecté apparaît dans la liste, avec sa page de détail.
      </p>
      <MetricState status={status}>
        <section aria-label="Indicateurs clés" className="grid grid-cols-1 border-y border-border sm:grid-cols-3 sm:border-t-2 sm:border-t-text-primary">
          <Tile label="Boîtiers connectés" value={list.filter((d) => d.paired).length} note="Sur toute la plateforme" />
          <Tile label="Demandes à livrer" value={toDeliver} note={toDeliver === 0 ? 'Aucune demande en attente' : 'En attente de livraison'} />
          <Tile label="Commandes, 24 h" value={list.reduce((total, d) => total + d.commands_24h, 0)} note="Extinctions demandées" />
        </section>

        <BoitierSectionBlock title="Demandes de boîtier">
          {asks.length === 0 ? (
            <p className="border-t border-border py-2.5 text-sm text-text-secondary">Aucune demande pour le moment.</p>
          ) : (
            <div className="overflow-x-auto border-y border-border">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="bg-bg-elevated">
                  <tr>
                    <Th>Compte</Th>
                    <Th>Site</Th>
                    <Th>Quantité</Th>
                    <Th>Total</Th>
                    <Th>Contact</Th>
                    <Th>Demandée le</Th>
                    <Th>Statut</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {asks.map((ask) => (
                    <tr key={ask.id} className="border-t border-border">
                      <td className="px-3 py-2.5 font-semibold text-text-primary">{ask.account ?? '—'}</td>
                      <td className="px-3 py-2.5 text-text-primary">{ask.site_nom ?? '—'}</td>
                      <td className="px-3 py-2.5 tabular-nums">{ask.quantity}</td>
                      <td className="px-3 py-2.5 tabular-nums">{formatFcfa(ask.total_fcfa)}</td>
                      <td className="px-3 py-2.5 text-text-secondary">{ask.contact}</td>
                      <td className="px-3 py-2.5 tabular-nums text-text-secondary">{formatUtcDateTime(ask.created_at).slice(0, 10)}</td>
                      <td className={`px-3 py-2.5 font-semibold ${ask.status === 'livre' ? 'text-confirm' : 'text-[#7a5b0d]'}`}>
                        {ask.status === 'livre' ? 'Livré' : 'À livrer'}
                      </td>
                      <td className="px-3 py-2.5">
                        {ask.status === 'a_livrer' && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={setDelivered.isPending}
                            onClick={() =>
                              setDelivered.mutate({
                                id: ask.id,
                                status: 'livre',
                              })
                            }
                          >
                            Marquer comme livré
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <MutationError error={setDelivered.error} />
        </BoitierSectionBlock>

        <BoitierSectionBlock title="Tous les boîtiers">
          {list.length === 0 ? (
            <p className="border-t border-border py-2.5 text-sm text-text-secondary">Aucun boîtier n’est connecté pour le moment.</p>
          ) : (
            <div className="overflow-x-auto border-y border-border">
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <thead className="bg-bg-elevated">
                  <tr>
                    <Th>Compte</Th>
                    <Th>Boîtier</Th>
                    <Th>Site</Th>
                    <Th>Portée</Th>
                    <Th>Langue</Th>
                    <Th>État</Th>
                    <Th>Dernière activité</Th>
                    <Th>Version</Th>
                    <Th>Commandes 24 h</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((device) => {
                    const connection = connectionOf(device)
                    return (
                      <tr key={device.id} className="border-t border-border">
                        <td className="px-3 py-2.5 font-semibold text-text-primary">{device.account ?? '—'}</td>
                        <td className="px-3 py-2.5 text-text-primary">{device.nom}</td>
                        <td className="px-3 py-2.5 text-text-primary">{device.site_nom ?? '—'}</td>
                        <td className="px-3 py-2.5 text-text-primary">{device.scope === 'account' ? 'Tout le compte' : 'Un site'}</td>
                        <td className="px-3 py-2.5 text-text-primary">{LANGUAGE_LABEL[device.language]}</td>
                        <td className={`px-3 py-2.5 font-semibold ${connection === 'en_ligne' ? 'text-confirm' : 'text-text-secondary'}`}>
                          {CONNECTION_LABEL[connection]}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-text-secondary">{lastActivity(device)}</td>
                        <td className="px-3 py-2.5 font-mono text-xs">{device.firmware_version ?? '—'}</td>
                        <td className="px-3 py-2.5 tabular-nums">{device.commands_24h}</td>
                        <td className="px-3 py-2.5">
                          <Link to={`/app/admin/boitiers/${device.id}`} className="focus-ring font-semibold text-accent-cta">
                            Voir le détail
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </BoitierSectionBlock>
      </MetricState>
    </div>
  )
}
