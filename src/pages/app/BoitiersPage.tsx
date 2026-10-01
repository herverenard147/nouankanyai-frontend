import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Speaker } from 'lucide-react'

import { CONNECTION_LABEL, LANGUAGE_LABEL, LIGHT_SHORT, lastActivity } from '@/api/boitiers'
import { LightDot, Th } from '@/components/boitier/BoitierParts'
import { PairingModal } from '@/components/boitier/PairingModal'
import { RequestBoitierModal } from '@/components/boitier/RequestBoitierModal'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { MutationError } from '@/components/ui/Modal'
import { useBoitierMutations, useBoitierPrice, useBoitierRequests, useBoitiers } from '@/hooks/queries/useBoitiers'
import { boitierListColumns } from '@/lib/boitierLevels'
import { formatFcfa, formatUtcDateTime } from '@/lib/formatters'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendDeviceRequest } from '@/types/backend'

type Dialog = 'request' | 'code' | null

const STEPS = [
  ['Demandez un boîtier', 'Depuis cette page, en indiquant où il sera installé.'],
  ['Recevez-le', 'L’équipe Nouankany vous contacte pour la livraison.'],
  ['Demandez votre code', 'À la réception, demandez un code ici et saisissez-le sur le boîtier.'],
] as const

/**
 * Boîtier vocal : un compte n'a au départ aucun boîtier. Il en demande un (prix affiché), le reçoit, puis demande ici le
 * code qui le relie à son compte. Dès qu'il y en a un, la page devient la liste ; chaque ligne ouvre la fiche du boîtier.
 */
export function BoitiersPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  const boitiers = useBoitiers()
  const requests = useBoitierRequests()
  const { cancelRequest } = useBoitierMutations()
  const [dialog, setDialog] = useState<Dialog>(null)

  if (!profile) return null

  const status = boitiers.status === 'error' || requests.status === 'error' ? 'error' : boitiers.isSuccess && requests.isSuccess ? 'success' : 'pending'
  const rows = boitiers.data ?? []
  const waiting = (requests.data ?? []).filter((r) => r.status === 'a_livrer')
  const delivered = (requests.data ?? []).filter((r) => r.status === 'livre')
  const columns = boitierListColumns(level)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        {rows.length === 0
          ? 'Aucun boîtier n’est encore relié à votre compte.'
          : 'Chaque boîtier a sa page : cliquez sur « Voir le détail » pour voir ce qu’il dit, ce qu’il peut éteindre et ce qu’il a fait.'}
      </p>

      <MetricState status={status}>
        {rows.length === 0 ? (
          <EmptyOrWaiting
            waiting={waiting}
            delivered={delivered}
            onRequest={() => setDialog('request')}
            onCode={() => setDialog('code')}
            onCancel={(id) => cancelRequest.mutate(id)}
            cancelError={cancelRequest.error}
          />
        ) : (
          <section aria-label="Mes boîtiers" className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-section-title font-bold text-text-primary">
                {profile === 'menage' ? 'Mes boîtiers' : 'Boîtiers de mon compte'} ({rows.length})
              </h2>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => setDialog('code')}>
                  Demander un code pour un autre boîtier
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialog('request')}>
                  Demander un boîtier
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto border-y border-border">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead className="bg-bg-elevated">
                  <tr>
                    <Th>Boîtier</Th>
                    <Th>Lumière</Th>
                    <Th>Connexion</Th>
                    {columns.site && <Th>Site</Th>}
                    {columns.site && <Th>Portée</Th>}
                    {columns.lastActivity && <Th>Dernière activité</Th>}
                    {columns.language && <Th>Langue</Th>}
                    {columns.id && <Th>Identifiant</Th>}
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ device, connection, light }) => (
                    <tr key={device.id} className="border-t border-border">
                      <td className="px-3 py-2.5 font-semibold text-text-primary">{device.nom}</td>
                      <td className="px-3 py-2.5">
                        {light ? (
                          <span className="inline-flex items-center gap-2">
                            <LightDot light={light} />
                            {LIGHT_SHORT[light]}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td
                        className={`px-3 py-2.5 font-semibold ${connection === 'en_ligne' ? 'text-confirm' : connection === 'en_attente' ? 'text-[#7a5b0d]' : 'text-text-secondary'}`}
                      >
                        {CONNECTION_LABEL[connection]}
                      </td>
                      {columns.site && <td className="px-3 py-2.5 text-text-primary">{device.site_nom ?? '—'}</td>}
                      {columns.site && <td className="px-3 py-2.5 text-text-primary">{device.scope === 'account' ? 'Tout le compte' : 'Un site'}</td>}
                      {columns.lastActivity && (
                        <td className="px-3 py-2.5 tabular-nums text-text-secondary">{lastActivity({ last_seen_at: device.last_seen_at })}</td>
                      )}
                      {columns.language && <td className="px-3 py-2.5 text-text-primary">{LANGUAGE_LABEL[device.language]}</td>}
                      {columns.id && <td className="px-3 py-2.5 font-mono text-xs text-text-secondary">{device.id.slice(0, 8)}…</td>}
                      <td className="px-3 py-2.5">
                        <Link to={`/app/boitier/${device.id}`} className="focus-ring font-semibold text-accent-cta">
                          Voir le détail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {level !== 'debutant' && (
              <p className="text-xs text-text-secondary">
                Un boîtier « en attente de connexion » a un code généré mais pas encore saisi : le code expire au bout de 15 minutes, vous pouvez en redemander
                un.
              </p>
            )}
            {waiting.length > 0 && <WaitingRequests requests={waiting} onCancel={(id) => cancelRequest.mutate(id)} />}
            <MutationError error={cancelRequest.error} />
          </section>
        )}
      </MetricState>

      {dialog === 'request' && <RequestBoitierModal profile={profile} onClose={() => setDialog(null)} />}
      {dialog === 'code' && <PairingModal profile={profile} onClose={() => setDialog(null)} />}
    </div>
  )
}

function WaitingRequests({ requests, onCancel }: { requests: BackendDeviceRequest[]; onCancel: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-3">
      <h3 className="text-sm font-semibold text-text-primary">Demande en cours</h3>
      {requests.map((request) => (
        <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
          <span>
            {request.quantity} boîtier{request.quantity > 1 ? 's' : ''} pour le site « {request.site_nom ?? '—'} » · {formatFcfa(request.total_fcfa)} · demandé
            le {formatUtcDateTime(request.created_at).slice(0, 10)}
          </span>
          <button type="button" onClick={() => onCancel(request.id)} className="focus-ring font-semibold text-accent-cta">
            Annuler la demande
          </button>
        </div>
      ))}
    </div>
  )
}

interface EmptyOrWaitingProps {
  waiting: BackendDeviceRequest[]
  delivered: BackendDeviceRequest[]
  onRequest: () => void
  onCode: () => void
  onCancel: (id: string) => void
  cancelError: unknown
}

function EmptyOrWaiting({ waiting, delivered, onRequest, onCode, onCancel, cancelError }: EmptyOrWaitingProps) {
  const price = useBoitierPrice().data?.unit_price_fcfa
  if (waiting.length > 0 || delivered.length > 0) {
    const isDelivered = waiting.length === 0
    const request = (isDelivered ? delivered : waiting)[0]
    return (
      <div className="flex max-w-[640px] flex-col gap-3 border-t-2 border-text-primary pt-6">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="inline-block h-4 w-4 rounded-full" style={{ background: isDelivered ? '#35C773' : '#F2A20C' }} />
          <h2 className="text-h2-secondary font-bold text-text-primary">{isDelivered ? 'Boîtier livré' : 'Demande envoyée, en attente de livraison'}</h2>
        </div>
        <p className="max-w-[62ch] text-sm text-text-secondary">
          {isDelivered
            ? `Votre boîtier pour le site « ${request.site_nom ?? '—'} » a été livré. Demandez maintenant le code qui le relie à votre compte.`
            : `Demande du ${formatUtcDateTime(request.created_at).slice(0, 10)} pour le site « ${request.site_nom ?? '—'} ». Prix : ${formatFcfa(request.total_fcfa)}. L’équipe Nouankany vous contactera pour la livraison. Vous n’avez rien d’autre à faire pour l’instant.`}
        </p>
        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
          {!isDelivered && (
            <p className="text-sm text-text-primary">
              <b>Vous avez reçu votre boîtier ?</b> Demandez maintenant le code qui le relie à votre compte.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" onClick={onCode}>
              J’ai reçu mon boîtier : demander mon code
            </Button>
            {!isDelivered && (
              <button type="button" onClick={() => onCancel(request.id)} className="focus-ring text-sm font-semibold text-accent-cta">
                Annuler la demande
              </button>
            )}
          </div>
          <MutationError error={cancelError} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex max-w-[640px] flex-col gap-3.5 border-t-2 border-text-primary pt-7">
      <div aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-[14px] border-2 border-dashed border-border text-text-tertiary">
        <Speaker className="h-7 w-7" />
      </div>
      <h2 className="text-h2-secondary font-bold text-text-primary">Vous n’avez aucun boîtier connecté</h2>
      <p className="max-w-[62ch] text-sm text-text-secondary">
        Le boîtier affiche une lumière sur l’état de vos appareils et répond à la voix. Il n’apparaît ici qu’une fois connecté à votre compte.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onRequest}>
          Demander un boîtier
        </Button>
        <Button type="button" variant="outline" onClick={onCode}>
          J’ai déjà reçu mon boîtier : demander mon code
        </Button>
      </div>
      <ol className="mt-3">
        {STEPS.map(([title, base], index) => {
          const text = index === 1 && price !== undefined ? `${base} Prix : ${formatFcfa(price)}.` : base
          return (
            <li key={title} className="flex items-baseline gap-3.5 border-t border-border py-2.5">
              <span className="w-5 font-heading text-lg font-bold">{index + 1}</span>
              <span>
                <b className="font-semibold text-text-primary">{title}</b>
                <span className="block text-sm text-text-secondary">{text}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
