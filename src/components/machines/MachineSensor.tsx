import { useState } from 'react'
import { Link } from 'react-router-dom'

import { CONNECTION_LABEL, connectionOf } from '@/api/boitiers'
import { sensorsByMachine } from '@/api/sources'
import { AddSensorModal } from '@/components/sources/AddSensorModal'
import { Button } from '@/components/ui/Button'
import { useSources } from '@/hooks/queries/useSources'
import { useInterventionStore } from '@/store/interventionStore'
import type { BackendMachine } from '@/types/backend'

/**
 * Capteur de l'appareil (2026-10-16) : son état s'il en a un, sinon « Ajouter un capteur ». Un appareil porte au plus un
 * capteur actif ; ses réglages et sa lecture d'essai sont sur la fiche de la source.
 */
export function MachineSensor({ machine }: { machine: BackendMachine }) {
  const sources = useSources()
  const intervention = useInterventionStore((s) => s.accountId)
  const [adding, setAdding] = useState(false)
  const sensor = sensorsByMachine(sources.data ?? []).get(machine.machine_id)
  const sourcePath = (id: string) => (intervention ? `/app/interventions/${intervention}/sources/${id}` : `/app/sources/${id}`)

  if (sources.status !== 'success') return null

  return (
    <div className="flex flex-col gap-2">
      <h5 className="text-sm font-semibold text-text-primary">Capteur</h5>
      {sensor ? (
        <>
          <p className="text-sm text-text-primary">
            {CONNECTION_LABEL[connectionOf(sensor)]} : « {sensor.nom} »
            {sensor.has_relay ? ', peut couper l’appareil' : ', mesure seulement'}
            {sensor.has_temperature_probe ? ', avec sonde de température' : ''}.
          </p>
          <Link to={sourcePath(sensor.id)} className="w-fit text-sm font-medium text-accent-cta underline underline-offset-2">
            Voir le capteur
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            Sans capteur, la consommation de cet appareil est estimée. Un capteur la mesure, et peut le couper s’il a un relais.
          </p>
          <Button type="button" variant="outline" className="w-fit" onClick={() => setAdding(true)}>
            Ajouter un capteur
          </Button>
        </>
      )}
      {adding && <AddSensorModal machineCode={machine.machine_id} onClose={() => setAdding(false)} onCreated={() => setAdding(false)} />}
    </div>
  )
}
