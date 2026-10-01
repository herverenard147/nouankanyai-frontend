import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { BOITIER_PROVENANCE, CONNECTION_LABEL, LANGUAGE_LABEL, LIGHT_SENTENCE, MACHINE_STATE_LABEL, connectionOf, lastActivity } from '@/api/boitiers'
import { BackLink, BoitierSectionBlock, CommandsTable, DefinitionRows, LightDot, Th } from '@/components/boitier/BoitierParts'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, ConfirmEditModal, MutationError } from '@/components/ui/Modal'
import { useBoitierDetail, useBoitierMutations, useBoitiers } from '@/hooks/queries/useBoitiers'
import { boitierDetailBlocks } from '@/lib/boitierLevels'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendBoitierMachineState } from '@/types/backend'

type Dialog = 'scope' | 'revoke' | null

const STATE_CLASS: Record<BackendBoitierMachineState, string> = {
  vert: 'text-confirm',
  orange: 'text-[#7a5b0d]',
  rouge: 'text-alert',
  arrete: 'text-text-secondary',
  inconnu: 'text-text-secondary',
}

/** Fiche d'un boîtier : ce qu'il dit, ce qu'il peut éteindre (au choix, dès le niveau amateur), ce qu'il a fait, sa portée. */
export function BoitierDetailPage() {
  const { deviceId = '' } = useParams()
  const navigate = useNavigate()
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  const list = useBoitiers()
  const detail = useBoitierDetail(deviceId)
  const { update, revoke, setControl } = useBoitierMutations()
  const [dialog, setDialog] = useState<Dialog>(null)

  if (!profile) return null
  const blocks = boitierDetailBlocks(profile, level)
  const backLabel = profile === 'menage' ? 'Mes boîtiers' : 'Boîtiers de mon compte'
  const row = list.data?.find((r) => r.device.id === deviceId)

  if (list.isSuccess && !row) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to="/app/boitier">{backLabel}</BackLink>
        <p className="text-sm text-text-secondary">Ce boîtier n’existe plus ou n’appartient pas à votre compte.</p>
      </div>
    )
  }

  const device = row?.device
  const connection = device ? connectionOf(device) : undefined
  const state = detail.data?.state
  const light = state?.light ?? 'aucune_donnee'
  const extended = device?.scope === 'account'

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/app/boitier">{backLabel}</BackLink>
      <MetricState status={list.status === 'error' || detail.status === 'error' ? 'error' : list.isSuccess && detail.isSuccess ? 'success' : 'pending'}>
        {device && state && connection && (
          <>
            <BoitierSectionBlock title="Mon boîtier" rule>
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <LightDot light={light} size={18} />
                    <h3 className="font-heading text-lg font-bold text-text-primary">{device.nom}</h3>
                  </div>
                  <p className="mt-1.5 text-sm text-text-secondary">{LIGHT_SENTENCE[light]}</p>
                </div>
                <div className="text-right text-sm">
                  <div className={`font-semibold ${connection === 'en_ligne' ? 'text-confirm' : 'text-text-secondary'}`}>{CONNECTION_LABEL[connection]}</div>
                  <div className="mt-0.5 text-xs text-text-secondary">Dernière activité {lastActivity({ last_seen_at: device.last_seen_at })}</div>
                  <div className="mt-1.5">
                    <ProvenanceBadge value={BOITIER_PROVENANCE} />
                  </div>
                </div>
              </div>
              <p className="mt-3.5 max-w-[80ch] bg-bg-elevated px-4 py-3.5 text-sm text-text-primary">
                <span className="mb-0.5 block text-xs font-semibold text-text-secondary">
                  Ce que dit le boîtier quand on lui demande l’état de vos appareils
                </span>
                {state.summary}
              </p>
              {state.unassigned_machines > 0 && (
                <p className="text-xs text-text-secondary">
                  {state.unassigned_machines} appareil
                  {state.unassigned_machines > 1 ? 's ne sont' : ' n’est'} rattaché{state.unassigned_machines > 1 ? 's' : ''} à aucun site : le boîtier ne{' '}
                  {state.unassigned_machines > 1 ? 'les' : 'le'} voit pas.
                </p>
              )}
            </BoitierSectionBlock>

            {blocks.machines && (
              <BoitierSectionBlock title="Appareils suivis par ce boîtier">
                {state.machines.length === 0 ? (
                  <p className="border-t border-border py-2.5 text-sm text-text-secondary">Aucun appareil n’est rattaché à ce boîtier.</p>
                ) : (
                  <div className="overflow-x-auto border-y border-border">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead className="bg-bg-elevated">
                        <tr>
                          <Th>Appareil</Th>
                          <Th>État</Th>
                          {blocks.readings && <Th>Dernier relevé</Th>}
                          <Th>Éteignable par le boîtier</Th>
                          {blocks.technical && <Th>Canal de commande</Th>}
                        </tr>
                      </thead>
                      <tbody>
                        {state.machines.map((machine) => (
                          <tr key={machine.code} className="border-t border-border">
                            <td className="px-3 py-2.5 font-semibold text-text-primary">{machine.nom}</td>
                            <td className={`px-3 py-2.5 font-semibold ${STATE_CLASS[machine.state]}`}>{MACHINE_STATE_LABEL[machine.state]}</td>
                            {blocks.readings && <td className="px-3 py-2.5 tabular-nums text-text-primary">{detail.data?.readings[machine.code] ?? '—'}</td>}
                            <td className="px-3 py-2.5 text-text-primary">
                              {blocks.chooseMachines ? (
                                <label className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={machine.controllable}
                                    disabled={setControl.isPending}
                                    onChange={(e) =>
                                      setControl.mutate({
                                        code: machine.code,
                                        controllable: e.target.checked,
                                      })
                                    }
                                    aria-label={`Éteignable par le boîtier : ${machine.nom}`}
                                  />
                                  {machine.controllable ? 'Oui' : 'Non'}
                                </label>
                              ) : machine.controllable ? (
                                'Oui'
                              ) : (
                                'Non'
                              )}
                            </td>
                            {blocks.technical && <td className="px-3 py-2.5 text-text-secondary">{machine.controllable ? 'Simulé' : '—'}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {blocks.chooseMachines && (
                  <p className="text-xs text-text-secondary">Un appareil prioritaire n’est jamais éteint à la voix : le boîtier vous renvoie vers le site.</p>
                )}
                <MutationError error={setControl.error} />
              </BoitierSectionBlock>
            )}

            <BoitierSectionBlock
              title="Ce que le boîtier a fait"
              action={
                blocks.auditLink ? (
                  <Link to="/app/audit" className="focus-ring text-sm font-semibold text-accent-cta">
                    Voir l’Audit
                  </Link>
                ) : undefined
              }
            >
              <CommandsTable commands={detail.data?.commands ?? []} status="success" />
            </BoitierSectionBlock>

            {blocks.scope && (
              <BoitierSectionBlock title="Portée">
                <p className="max-w-[80ch] text-sm text-text-primary">
                  {extended
                    ? 'Ce boîtier voit les appareils de tous les sites du compte. Quand une demande est ambiguë, il demande « quel site ? ».'
                    : `Ce boîtier voit seulement les appareils du site ${device.site_nom ?? ''}. Pour qu’il voie tous les sites du compte, demandez l’extension ici : elle ne se fait jamais à la voix. Avec l’extension, il demandera « quel site ? » quand une demande est ambiguë.`}
                </p>
                <div>
                  <Button type="button" variant="outline" onClick={() => setDialog('scope')}>
                    {extended ? 'Limiter au site' : 'Étendre à tout le compte'}
                  </Button>
                </div>
              </BoitierSectionBlock>
            )}

            {blocks.technical && (
              <BoitierSectionBlock title="Détails techniques">
                <DefinitionRows
                  rows={[
                    ['Identifiant', `${device.id.slice(0, 8)}…`],
                    ['Rattachement', extended ? 'Tout le compte' : `Site « ${device.site_nom ?? '—'} »`],
                    ['Langue', LANGUAGE_LABEL[device.language]],
                    ['Dernière activité', device.last_seen_at ? `${lastActivity({ last_seen_at: device.last_seen_at })} UTC` : '—'],
                  ]}
                />
              </BoitierSectionBlock>
            )}

            <BoitierSectionBlock title="Déconnecter ce boîtier">
              <p className="max-w-[80ch] text-sm text-text-primary">
                {level === 'debutant'
                  ? 'Le boîtier ne répondra plus. Pour le reconnecter, il faudra un nouveau code.'
                  : 'Le boîtier ne répondra plus et cessera d’éteindre vos appareils. Pour le reconnecter, il faudra un nouveau code.'}
              </p>
              <div>
                <Button type="button" variant="outline" className="border-alert text-alert" onClick={() => setDialog('revoke')}>
                  Déconnecter ce boîtier
                </Button>
              </div>
            </BoitierSectionBlock>

            {dialog === 'scope' && (
              <ConfirmEditModal
                subject={`Vous allez modifier « ${device.nom} ».`}
                changes={[
                  {
                    label: 'Portée',
                    before: extended ? 'Tout le compte' : `Site « ${device.site_nom ?? '—'} »`,
                    after: extended ? `Site « ${device.site_nom ?? '—'} »` : 'Tout le compte',
                  },
                ]}
                pending={update.isPending}
                error={update.error}
                onBack={() => setDialog(null)}
                onConfirm={() =>
                  update.mutate(
                    {
                      id: device.id,
                      payload: { scope: extended ? 'site' : 'account' },
                    },
                    { onSuccess: () => setDialog(null) },
                  )
                }
              />
            )}
            {dialog === 'revoke' && (
              <ConfirmDeleteModal
                title={`Déconnecter « ${device.nom} » ?`}
                description="Le boîtier est retiré de votre compte."
                consequences={[
                  'Le boîtier ne répondra plus à la voix.',
                  'Il ne pourra plus éteindre vos appareils.',
                  'Pour le reconnecter, il faudra demander un nouveau code.',
                ]}
                confirmLabel="Déconnecter le boîtier"
                pending={revoke.isPending}
                error={revoke.error}
                onCancel={() => setDialog(null)}
                onConfirm={() =>
                  revoke.mutate(device.id, {
                    onSuccess: () => navigate('/app/boitier'),
                  })
                }
              />
            )}
          </>
        )}
      </MetricState>
    </div>
  )
}
