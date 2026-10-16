import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { CONNECTION_LABEL, connectionOf, lastActivity } from '@/api/boitiers'
import { SOURCE_KIND_LABEL, kindOf } from '@/api/sources'
import { BackLink, BoitierSectionBlock, DefinitionRows, Th } from '@/components/boitier/BoitierParts'
import { AddSourceModal } from '@/components/sources/AddSourceModal'
import { FileSourcePanel } from '@/components/sources/FileSourcePanel'
import { AliasesPanel, KeyPanel } from '@/components/sources/KeyAndAliasesPanel'
import { MeterPointsPanel } from '@/components/sources/MeterPointsPanel'
import { TechnicianAccessPanel } from '@/components/sources/TechnicianAccessPanel'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal } from '@/components/ui/Modal'
import { useSourceMutations, useSources } from '@/hooks/queries/useSources'
import { isRouteAllowed } from '@/lib/navConfig'
import { useInterventionStore } from '@/store/interventionStore'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendDevice } from '@/types/backend'

/**
 * Sources de mesures (étape 6, 2026-10-16) : comment les mesures du compte arrivent (boîtier, passerelle, logiciel du
 * client, fichiers). Sert au client (`/app/sources`) et au technicien en intervention
 * (`/app/interventions/:accountId`), qui travaille alors dans le compte du client.
 */
/** Adresse de la fiche d'une source : dans le compte du client, ou dans l'intervention du technicien. */
function sourcePath(intervention: string | null, id: string): string {
  return intervention ? `/app/interventions/${intervention}/sources/${id}` : `/app/sources/${id}`
}

export function SourcesPage() {
  const intervention = useInterventionStore((s) => s.accountId)
  const profile = useSessionStore((s) => s.session?.profile)
  const sources = useSources()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const rows = sources.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[44rem] text-sm text-text-secondary">
          Les sources par lesquelles les mesures arrivent : boîtier, passerelle de mesure, logiciel ou fichiers. Toutes envoient dans les mêmes unités et passent les mêmes contrôles.
        </p>
        <Button type="button" onClick={() => setAdding(true)}>
          Ajouter une source
        </Button>
      </div>

      <MetricState status={sources.status}>
        {rows.length === 0 ? (
          <p className="text-sm text-text-secondary">Aucune source pour le moment. « Ajouter une source » vous guide selon votre installation.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-text-primary">
                  <Th>Nom</Th>
                  <Th>Type</Th>
                  <Th>Site</Th>
                  <Th>Connexion</Th>
                  <Th>
                    <span className="sr-only">Ouvrir</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-border">
                    <td className="py-2.5 pr-4 font-medium text-text-primary">{d.nom}</td>
                    <td className="py-2.5 pr-4 text-text-primary">{SOURCE_KIND_LABEL[kindOf(d)]}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">{d.site_nom ?? 'Tout le compte'}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">{connectionText(d)}</td>
                    <td className="py-2.5 text-right">
                      <Link to={kindOf(d) === 'vocal' && !intervention && profile && isRouteAllowed('/app/boitier', profile) ? `/app/boitier/${d.id}` : sourcePath(intervention, d.id)} className="font-medium text-accent-cta underline underline-offset-2">
                        Voir le détail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MetricState>

      {!intervention && <TechnicianAccessPanel />}

      {adding && (
        <AddSourceModal
          onClose={() => setAdding(false)}
          onCreated={(id) => {
            setAdding(false)
            navigate(sourcePath(intervention, id))
          }}
        />
      )}
    </div>
  )
}

/** Connexion d'une source : une passerelle ou un boîtier est en ligne ou non ; un logiciel ou des fichiers, actifs dès la création. */
function connectionText(device: BackendDevice): string {
  const kind = kindOf(device)
  if (kind === 'logiciel' || kind === 'fichier') return device.last_seen_at ? `Dernier envoi ${lastActivity(device)} UTC` : 'Rien reçu pour le moment'
  return CONNECTION_LABEL[connectionOf(device)]
}

export function SourceDetailPage() {
  const { deviceId = '' } = useParams()
  const intervention = useInterventionStore((s) => s.accountId)
  const base = intervention ? `/app/interventions/${intervention}` : '/app/sources'
  const sources = useSources()
  const { revoke } = useSourceMutations(deviceId)
  const navigate = useNavigate()
  const [revoking, setRevoking] = useState(false)
  const device = sources.data?.find((d) => d.id === deviceId)

  return (
    <div className="flex flex-col gap-5">
      <BackLink to={base}>Toutes les sources</BackLink>
      <MetricState status={sources.status}>
        {!device ? (
          <p className="text-sm text-text-secondary">Cette source n’existe plus, ou n’appartient pas à ce compte.</p>
        ) : (
          <>
            <BoitierSectionBlock
              title={device.nom}
              action={
                <Button type="button" variant="ghost" onClick={() => setRevoking(true)}>
                  Révoquer la source
                </Button>
              }
            >
              <DefinitionRows
                rows={[
                  ['Type', SOURCE_KIND_LABEL[kindOf(device)]],
                  ['Site', device.site_nom ?? 'Tout le compte'],
                  ['Connexion', connectionText(device)],
                ]}
              />
            </BoitierSectionBlock>
            {kindOf(device) === 'passerelle' && <MeterPointsPanel deviceId={device.id} />}
            {(kindOf(device) === 'logiciel' || kindOf(device) === 'fichier') && <KeyPanel deviceId={device.id} />}
            {kindOf(device) === 'fichier' && <FileSourcePanel deviceId={device.id} />}
            {(kindOf(device) === 'logiciel' || kindOf(device) === 'fichier') && <AliasesPanel deviceId={device.id} />}
            {kindOf(device) === 'vocal' && (
              <p className="text-sm text-text-secondary">Un boîtier vocal se règle depuis la page Boîtier du compte.</p>
            )}
          </>
        )}
      </MetricState>
      {revoking && device && (
        <ConfirmDeleteModal
          title={`Révoquer « ${device.nom} » ?`}
          consequences={['Elle perd l’accès immédiatement : plus aucune mesure n’est acceptée.', 'Les mesures déjà reçues restent.', 'Pour reprendre, il faudra créer une nouvelle source.']}
          confirmText={device.nom}
          confirmLabel="Révoquer"
          pending={revoke.isPending}
          error={revoke.error}
          onConfirm={() => revoke.mutate(undefined, { onSuccess: () => navigate(base) })}
          onCancel={() => setRevoking(false)}
        />
      )}
    </div>
  )
}
