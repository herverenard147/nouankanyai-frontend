import { useState } from 'react'

import { BoitierSectionBlock, Th } from '@/components/boitier/BoitierParts'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, Modal, MutationError, SelectField } from '@/components/ui/Modal'
import { useAliases, useInstallation, useSourceMutations } from '@/hooks/queries/useSources'
import type { BackendKeyRenewed, BackendSourceAlias } from '@/types/backend'

/** Identifiant de la source et remplacement de la clé (logiciel du client, fichiers). */
export function KeyPanel({ deviceId }: { deviceId: string }) {
  const { renewKey } = useSourceMutations(deviceId)
  const [confirm, setConfirm] = useState(false)
  const [renewed, setRenewed] = useState<BackendKeyRenewed | null>(null)

  return (
    <BoitierSectionBlock
      title="Identifiant et clé"
      rule
      action={
        <Button type="button" variant="outline" onClick={() => setConfirm(true)}>
          Remplacer la clé
        </Button>
      }
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-text-secondary">Identifiant</dt>
        <dd className="break-all font-mono text-text-primary">{deviceId}</dd>
        <dt className="text-text-secondary">Clé</dt>
        <dd className="text-text-secondary">Jamais réaffichée. Perdue ? Remplacez-la : l’ancienne cesse aussitôt de marcher.</dd>
      </dl>
      {confirm && (
        <ConfirmDeleteModal
          title="Remplacer la clé ?"
          description="La nouvelle clé s’affichera une seule fois."
          consequences={['L’ancienne clé ne marche plus, immédiatement.', 'Le logiciel du client doit recevoir la nouvelle clé pour continuer à envoyer.']}
          confirmLabel="Remplacer la clé"
          pending={renewKey.isPending}
          error={renewKey.error}
          onConfirm={() =>
            renewKey.mutate(undefined, {
              onSuccess: (data) => {
                setConfirm(false)
                setRenewed(data)
              },
            })
          }
          onCancel={() => setConfirm(false)}
        />
      )}
      {renewed && (
        <Modal
          title="Nouvelle clé"
          description="Affichée une seule fois : notez-la maintenant."
          onClose={() => setRenewed(null)}
          actions={
            <Button type="button" onClick={() => setRenewed(null)}>
              Terminé
            </Button>
          }
        >
          <p className="break-all font-mono text-sm text-text-primary">{renewed.secret}</p>
        </Modal>
      )}
    </BoitierSectionBlock>
  )
}

/** Noms des appareils dans le logiciel du client, reliés aux appareils Nouankany de la source. */
export function AliasesPanel({ deviceId }: { deviceId: string }) {
  const aliases = useAliases(deviceId, true)
  const installation = useInstallation()
  const { saveAliases } = useSourceMutations(deviceId)
  const [edited, setEdited] = useState<BackendSourceAlias[] | null>(null)
  // Tant que rien n'est modifié, la liste montre les noms enregistrés.
  const rows = edited ?? aliases.data?.items ?? []
  const dirty = edited !== null
  const setRows = (next: (r: BackendSourceAlias[]) => BackendSourceAlias[]) => setEdited(next(rows))

  const machines = installation.data?.appareils ?? []
  const update = (index: number, patch: Partial<BackendSourceAlias>) => setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  const complete = rows.every((r) => r.external_ref.trim() && r.machine_code)

  return (
    <BoitierSectionBlock title="Noms du logiciel" rule>
      <p className="text-sm text-text-secondary">
        Le logiciel du client nomme ses appareils à sa façon (« COMP_01_kW »). Reliez chaque nom à l’appareil Nouankany. Une mesure sous un nom non relié est refusée, avec ce nom dans la raison.
      </p>
      <MetricState status={aliases.status}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-text-primary">
                <Th>Nom dans le logiciel</Th>
                <Th>Appareil Nouankany</Th>
                <Th>
                  <span className="sr-only">Retirer</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="py-2 pr-3">
                    <input
                      aria-label="Nom dans le logiciel"
                      value={row.external_ref}
                      maxLength={120}
                      onChange={(e) => update(index, { external_ref: e.target.value })}
                      className="focus-ring min-h-11 w-full rounded-control border border-border bg-card px-3 text-sm"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <SelectField
                      label="Appareil"
                      value={row.machine_code}
                      onChange={(v) => update(index, { machine_code: v })}
                      options={[{ value: '', label: 'Choisir' }, ...machines.map((m) => ({ value: m.code, label: m.nom }))]}
                    />
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setRows((r) => r.filter((_, i) => i !== index))}
                    >
                      Retirer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MetricState>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRows((r) => [...r, { external_ref: '', machine_code: '' }])}
        >
          Ajouter un nom
        </Button>
        <Button
          type="button"
          disabled={!dirty || !complete}
          loading={saveAliases.isPending}
          onClick={() => saveAliases.mutate(rows.map((r) => ({ ...r, external_ref: r.external_ref.trim() })), { onSuccess: () => setEdited(null) })}
        >
          Enregistrer les noms
        </Button>
      </div>
      <MutationError error={saveAliases.error} />
    </BoitierSectionBlock>
  )
}
