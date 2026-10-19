import { useState } from 'react'

import { METER_STATUS_LABEL } from '@/api/sources'
import { BoitierSectionBlock, Th } from '@/components/boitier/BoitierParts'
import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, Modal, MutationError, SelectField } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useInstallation, useMeterPoints, useMeterTemplates, useSourceMutations } from '@/hooks/queries/useSources'
import { formatUtcDateTime } from '@/lib/formatters'
import { DATA_TYPES, MEASURE_FIELDS, buildCustomMap } from '@/lib/sourceForms'
import type { RegisterDraft } from '@/lib/sourceForms'
import type { BackendCustomMeterMap, BackendMeterPoint, BackendMeterPointCreate } from '@/types/backend'

const STATUS_CLASS: Record<BackendMeterPoint['status'], string> = {
  a_tester: 'text-text-secondary',
  actif: 'text-confirm',
  a_verifier: 'text-alert',
}

/** Compteurs lus par une passerelle : liste, ajout, nouvel essai, retrait. */
/** `sensor` : le point unique du capteur d'un appareil (posé à sa création) : ni ajout ni retrait ici. */
export function MeterPointsPanel({ deviceId, sensor = false }: { deviceId: string; sensor?: boolean }) {
  const points = useMeterPoints(deviceId, true)
  const installation = useInstallation()
  const { retestMeter, deleteMeter } = useSourceMutations(deviceId)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<BackendMeterPoint | null>(null)
  const rows = points.data ?? []
  const names = new Map((installation.data?.appareils ?? []).map((a) => [a.code, a.nom]))

  return (
    <BoitierSectionBlock
      title={sensor ? 'Mesure du capteur' : 'Compteurs lus'}
      rule
      action={
        sensor ? undefined : (
          <Button type="button" onClick={() => setAdding(true)}>
            Ajouter un compteur
          </Button>
        )
      }
    >
      <p className="text-sm text-text-secondary">
        {sensor
          ? 'Le capteur envoie une première lecture pour vérifier ses réglages, dès qu’il est en ligne. Ses mesures ne sont prises en compte que si cette lecture est plausible.'
          : 'Chaque nouveau compteur est lu une première fois pour vérifier ses réglages (dans la minute, si la passerelle est en ligne). Il n’est mis en service que si cette lecture est plausible.'}
      </p>
      <MetricState status={points.status}>
        {rows.length === 0 ? (
          <p className="text-sm text-text-secondary">Aucun compteur pour le moment.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-text-primary">
                  <Th>Appareil mesuré</Th>
                  <Th>Compteur</Th>
                  <Th>Liaison</Th>
                  <Th>État</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-border align-top">
                    <td className="py-2.5 pr-4 text-text-primary">{p.machine_nom ?? names.get(p.machine_code ?? '') ?? p.machine_code}</td>
                    <td className="py-2.5 pr-4 text-text-primary">{p.template_label}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">
                      {p.protocol === 'tcp' ? `Réseau ${p.host}:${p.port}` : `RS485 · ${p.baudrate} bauds`} · adresse {p.slave_id}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`font-medium ${STATUS_CLASS[p.status]}`}>{METER_STATUS_LABEL[p.status]}</span>
                      {p.last_test_detail && p.status === 'a_verifier' && <ApiErrorMessage message={p.last_test_detail} className="text-xs text-text-primary" />}
                      {p.last_test_at && <span className="block text-xs text-text-secondary">Essai du {formatUtcDateTime(p.last_test_at).slice(0, 16)} UTC</span>}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        {p.status === 'a_verifier' && (
                          <Button type="button" variant="outline" loading={retestMeter.isPending && retestMeter.variables === p.id} onClick={() => retestMeter.mutate(p.id)}>
                            Relancer l’essai
                          </Button>
                        )}
                        {!sensor && (
                          <Button type="button" variant="ghost" onClick={() => setRemoving(p)}>
                            Retirer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MetricState>
      <MutationError error={retestMeter.error} />
      {adding && <AddMeterModal deviceId={deviceId} onClose={() => setAdding(false)} />}
      {removing && (
        <ConfirmDeleteModal
          title="Ne plus lire ce compteur ?"
          description="Vous pourrez l’ajouter de nouveau."
          consequences={['La passerelle arrête de le lire.', 'Les mesures déjà reçues restent.']}
          confirmLabel="Retirer le compteur"
          pending={deleteMeter.isPending}
          error={deleteMeter.error}
          onConfirm={() => deleteMeter.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
          onCancel={() => setRemoving(null)}
        />
      )}
    </BoitierSectionBlock>
  )
}

function AddMeterModal({ deviceId, onClose }: { deviceId: string; onClose: () => void }) {
  const installation = useInstallation()
  const templates = useMeterTemplates()
  const { addMeter } = useSourceMutations(deviceId)
  const [machine, setMachine] = useState('')
  const [template, setTemplate] = useState('eastron_sdm120')
  const [protocol, setProtocol] = useState<'rtu' | 'tcp'>('rtu')
  const [slave, setSlave] = useState('1')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('502')
  const [baud, setBaud] = useState('')
  const [fn, setFn] = useState<3 | 4>(4)
  const [dataType, setDataType] = useState<BackendCustomMeterMap['data_type']>('float32')
  const [draft, setDraft] = useState<RegisterDraft>({})
  const [formError, setFormError] = useState<string | null>(null)

  const custom = template === 'personnalise'
  const machines = installation.data?.appareils ?? []

  function submit() {
    setFormError(null)
    const slaveId = Number.parseInt(slave, 10)
    if (!machine) return setFormError('Choisissez l’appareil mesuré.')
    if (!(slaveId >= 1 && slaveId <= 247)) return setFormError('Adresse du compteur (esclave) entre 1 et 247.')
    const payload: BackendMeterPointCreate = { machine_code: machine, template, protocol, slave_id: slaveId }
    if (protocol === 'tcp') {
      payload.host = host.trim()
      payload.port = Number.parseInt(port, 10) || 502
    } else if (baud.trim()) {
      payload.baudrate = Number.parseInt(baud, 10)
    }
    if (custom) {
      const map = buildCustomMap(fn, dataType, draft)
      if (typeof map === 'string') return setFormError(map)
      payload.custom_map = map
    }
    addMeter.mutate(payload, { onSuccess: onClose })
  }

  return (
    <Modal
      title="Ajouter un compteur"
      description="La passerelle le lira une première fois pour vérifier ces réglages."
      onClose={onClose}
      width="lg"
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={addMeter.isPending}>
            Annuler
          </Button>
          <Button type="button" onClick={submit} loading={addMeter.isPending}>
            Ajouter
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <SelectField
          label="Appareil mesuré"
          value={machine}
          onChange={setMachine}
          options={[{ value: '', label: 'Choisir' }, ...machines.map((m) => ({ value: m.code, label: `${m.nom}${m.puissance_nominale_kw ? ` · ${m.puissance_nominale_kw} kW` : ''}` }))]}
        />
        <SelectField
          label="Modèle du compteur"
          value={template}
          onChange={setTemplate}
          options={(templates.data ?? []).map((t) => ({ value: t.key, label: t.label }))}
        />
        <SelectField
          label="Liaison"
          value={protocol}
          onChange={(v) => setProtocol(v as 'rtu' | 'tcp')}
          options={[
            { value: 'rtu', label: 'Câble RS485 (Modbus RTU)' },
            { value: 'tcp', label: 'Réseau (Modbus-TCP)' },
          ]}
        />
        <TextField label="Adresse du compteur (esclave, 1 à 247)" required inputMode="numeric" value={slave} onChange={(e) => setSlave(e.target.value)} />
        {protocol === 'tcp' ? (
          <>
            <TextField label="Adresse IP" required value={host} onChange={(e) => setHost(e.target.value)} placeholder="192.168.1.40" />
            <TextField label="Port (vide : 502)" inputMode="numeric" value={port} onChange={(e) => setPort(e.target.value)} />
          </>
        ) : (
          <TextField label="Vitesse en bauds (vide : celle du modèle)" inputMode="numeric" value={baud} onChange={(e) => setBaud(e.target.value)} placeholder="9600" />
        )}
      </div>

      {custom && (
        <fieldset className="mt-4 flex flex-col gap-3 border-t border-border pt-3">
          <legend className="text-sm font-semibold text-text-primary">Registres, d’après la notice du compteur</legend>
          <p className="text-xs text-text-secondary">
            Vous pouvez saisir l’adresse telle qu’elle est écrite dans la notice (30053, 40001) : elle est convertie et fixe la fonction. Laissez vide ce que le compteur ne donne pas.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Fonction Modbus"
              value={String(fn)}
              onChange={(v) => setFn(v === '3' ? 3 : 4)}
              options={[
                { value: '4', label: '4 : registres d’entrée (3xxxx)' },
                { value: '3', label: '3 : registres de maintien (4xxxx)' },
              ]}
            />
            <SelectField label="Type de donnée" value={dataType} onChange={(v) => setDataType(v as BackendCustomMeterMap['data_type'])} options={DATA_TYPES.map((d) => ({ value: d, label: d }))} />
          </div>
          {MEASURE_FIELDS.map((field) => (
            <div key={field.key} className="grid items-end gap-3 sm:grid-cols-[1fr_9rem_9rem]">
              <p className="text-sm text-text-primary">
                {field.label}
                <span className="block text-xs text-text-secondary">{field.hint}</span>
              </p>
              <TextField
                label="Adresse"
                inputMode="numeric"
                value={draft[field.key]?.address ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, [field.key]: { address: e.target.value, scale: d[field.key]?.scale ?? '' } }))}
              />
              <TextField
                label="Facteur"
                inputMode="decimal"
                value={draft[field.key]?.scale ?? ''}
                placeholder="1"
                onChange={(e) => setDraft((d) => ({ ...d, [field.key]: { address: d[field.key]?.address ?? '', scale: e.target.value } }))}
              />
            </div>
          ))}
        </fieldset>
      )}
      {formError && <p className="mt-3 text-sm text-alert">{formError}</p>}
      <MutationError error={addMeter.error} />
    </Modal>
  )
}
