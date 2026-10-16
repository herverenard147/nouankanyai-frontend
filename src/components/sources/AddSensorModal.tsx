import { useState } from 'react'

import { CreatedModal } from '@/components/sources/CreatedSourceModal'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError, SelectField } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useInstallation, useSourceMutations } from '@/hooks/queries/useSources'
import type { BackendDeviceCreated } from '@/types/backend'

/** Appareils dont l'intérieur se surveille avec une sonde : le froid et la climatisation. */
const PROBE_HINT = /(r[ée]frig|cong[ée]l|froid|climat|clim\b|split)/i

/**
 * « Ajouter un capteur » (2026-10-16) : un capteur se pose sur UN appareil. Il mesure l'électricité (PZEM-004T) ; une
 * sonde de température en option (froid, climatisation) ; un relais en option pour que le boîtier puisse couper
 * l'appareil pour de vrai. Code d'appairage affiché une fois, puis lecture d'essai avant la mise en service.
 */
export function AddSensorModal({ machineCode, onClose, onCreated }: { machineCode?: string; onClose: () => void; onCreated?: (id: string) => void }) {
  const installation = useInstallation()
  const { create } = useSourceMutations()
  const machines = installation.data?.appareils ?? []
  const [code, setCode] = useState(machineCode ?? '')
  const machine = machines.find((m) => m.code === code)
  const [nom, setNom] = useState('')
  const [relay, setRelay] = useState(true)
  const [probe, setProbe] = useState<boolean | null>(null)
  const [created, setCreated] = useState<BackendDeviceCreated | null>(null)

  if (created) return <CreatedModal created={created} onClose={() => (onCreated ? onCreated(created.id) : onClose())} closeLabel="Terminé" />

  const name = nom.trim() || (machine ? `Capteur ${machine.nom}` : '')
  const withProbe = probe ?? Boolean(machine && PROBE_HINT.test(`${machine.nom} ${machine.categorie ?? ''}`))
  return (
    <Modal
      title="Ajouter un capteur"
      description="Le capteur se pose sur l’appareil. Il envoie sa consommation chaque minute et la garde en mémoire si internet est coupé."
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!machine}
            loading={create.isPending}
            onClick={() => create.mutate({ nom: name, kind: 'capteur', machine_code: code, relay, temperature_probe: withProbe, language: 'fr' }, { onSuccess: setCreated })}
          >
            Créer le capteur
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        {!machineCode && (
          <SelectField
            label="Appareil"
            value={code}
            onChange={setCode}
            options={[{ value: '', label: 'Choisir l’appareil' }, ...machines.map((m) => ({ value: m.code, label: m.nom }))]}
          />
        )}
        {machineCode && machine && <p className="text-sm text-text-primary">Appareil : <span className="font-semibold">{machine.nom}</span></p>}
        <TextField label="Nom du capteur" maxLength={80} value={nom} placeholder={name || 'Capteur du climatiseur'} onChange={(e) => setNom(e.target.value)} />
        <label className="flex items-start gap-3 text-sm text-text-primary">
          <input type="checkbox" className="mt-0.5 h-4 w-4" checked={relay} onChange={(e) => setRelay(e.target.checked)} />
          <span>
            Il a un relais : il peut couper l’appareil
            <span className="block text-xs text-text-secondary">C’est vous qui décidez ensuite, sur la page du boîtier, si l’appareil peut être éteint à la voix.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-text-primary">
          <input type="checkbox" className="mt-0.5 h-4 w-4" checked={withProbe} onChange={(e) => setProbe(e.target.checked)} />
          <span>
            Il a une sonde de température
            <span className="block text-xs text-text-secondary">Utile pour un réfrigérateur, un congélateur ou un climatiseur.</span>
          </span>
        </label>
        <MutationError error={create.error} />
      </div>
    </Modal>
  )
}
