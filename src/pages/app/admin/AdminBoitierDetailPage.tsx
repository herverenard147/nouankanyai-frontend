import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { LANGUAGE_LABEL, LIGHT_SENTENCE, lastActivity } from '@/api/boitiers'
import { BackLink, BoitierSectionBlock, CommandsTable, DefinitionRows, LightDot } from '@/components/boitier/BoitierParts'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal } from '@/components/ui/Modal'
import { useAdminBoitierDetail, useAdminBoitierMutations, useAdminBoitiers } from '@/hooks/queries/useBoitiers'

/** Fiche d'un boîtier vue par un administrateur : à qui il appartient, quand il a été vu, ce qu'il a fait ; révocation tracée dans l'Audit du compte. */
export function AdminBoitierDetailPage() {
  const { deviceId = '' } = useParams()
  const navigate = useNavigate()
  const list = useAdminBoitiers()
  const detail = useAdminBoitierDetail(deviceId)
  const { revoke } = useAdminBoitierMutations()
  const [confirming, setConfirming] = useState(false)

  const device = list.data?.find((d) => d.id === deviceId)

  if (list.isSuccess && !device) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to="/app/admin/boitiers">Tous les boîtiers</BackLink>
        <p className="text-sm text-text-secondary">Ce boîtier n’existe plus ou a été révoqué.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/app/admin/boitiers">Tous les boîtiers</BackLink>
      <MetricState status={list.status === 'error' || detail.status === 'error' ? 'error' : list.isSuccess && detail.isSuccess ? 'success' : 'pending'}>
        {device && detail.data && (
          <>
            <BoitierSectionBlock title={device.nom} rule>
              <p className="flex items-center gap-2.5 text-sm text-text-secondary">
                <LightDot light={detail.data.state.light} size={16} />
                {LIGHT_SENTENCE[detail.data.state.light]}
              </p>
              <DefinitionRows
                rows={[
                  ['Compte', device.account ?? '—'],
                  ['Site', device.site_nom ?? '—'],
                  ['Rattachement', device.scope === 'account' ? 'Tout le compte' : 'Un site'],
                  ['Langue', LANGUAGE_LABEL[device.language]],
                  ['Version du micrologiciel', device.firmware_version ?? '—'],
                  ['Identifiant', `${device.id.slice(0, 8)}…`],
                  ['Dernière activité', device.last_seen_at ? `${lastActivity(device)} UTC` : '—'],
                  ['Commandes, 24 h', String(device.commands_24h)],
                ]}
              />
            </BoitierSectionBlock>
            <BoitierSectionBlock title="Ce que le boîtier a fait">
              <CommandsTable commands={detail.data.commands} status="success" />
            </BoitierSectionBlock>
            <BoitierSectionBlock title="Révoquer">
              <p className="max-w-[80ch] text-sm text-text-primary">
                Le boîtier cessera de répondre et d’éteindre des appareils. L’utilisateur devra demander un nouveau code pour le reconnecter.
              </p>
              <div>
                <Button type="button" variant="outline" className="border-alert text-alert" onClick={() => setConfirming(true)}>
                  Révoquer ce boîtier
                </Button>
              </div>
            </BoitierSectionBlock>
            {confirming && (
              <ConfirmDeleteModal
                title={`Révoquer « ${device.nom} » ?`}
                description={`Compte : ${device.account ?? '—'}.`}
                consequences={[
                  'Le boîtier ne répondra plus et ne pourra plus éteindre d’appareil.',
                  'L’utilisateur devra demander un nouveau code pour le reconnecter.',
                ]}
                confirmLabel="Révoquer le boîtier"
                pending={revoke.isPending}
                error={revoke.error}
                onCancel={() => setConfirming(false)}
                onConfirm={() =>
                  revoke.mutate(device.id, {
                    onSuccess: () => navigate('/app/admin/boitiers'),
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
