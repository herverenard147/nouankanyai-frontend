import { useRef } from 'react'

import { Button } from '@/components/ui/Button'
import { MutationError } from '@/components/ui/Modal'
import { useAnalyzeMachineMedia, useResetMachine, useSimulateMachine } from '@/hooks/queries/useMachineCrud'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendMachine } from '@/types/backend'

/**
 * Outils d'une machine dans sa fiche détail (Équipements pour Ménage/PME, Machines pour
 * l'Industrie) :
 * - analyser une photo ou une vidéo (danger visible, fumée, fuite…) ;
 * - la remettre en état normal quand elle est en alerte ;
 * - sur un compte d'essai ou de démo seulement, simuler une alerte pour essayer le parcours.
 */
export function MachineTools({ machine }: { machine: BackendMachine }) {
  const session = useSessionStore((s) => s.session)
  const analyze = useAnalyzeMachineMedia()
  const reset = useResetMachine()
  const simulate = useSimulateMachine()
  const fileInput = useRef<HTMLInputElement>(null)
  const demoTools = Boolean(session?.isTrial || session?.isDemo)
  const inAlert = machine.status === 'alerte'

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4" aria-label="Outils de la machine">
      <h4 className="text-sm font-semibold text-text-primary">Outils</h4>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          aria-label="Photo ou vidéo de la machine à analyser"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) analyze.mutate({ machineId: machine.machine_id, file })
            event.target.value = ''
          }}
        />
        <Button type="button" variant="outline" disabled={analyze.isPending} onClick={() => fileInput.current?.click()}>
          {analyze.isPending ? 'Analyse en cours…' : 'Analyser une photo ou une vidéo'}
        </Button>
        {analyze.data && (
          <p className={`text-sm ${analyze.data.status === 'ALERTE' ? 'text-alert' : 'text-text-secondary'}`} role="status">
            {analyze.data.provenance === 'simulation' ? 'Simulation, aucune image analysée : ' : analyze.data.status === 'ALERTE' ? 'Danger détecté : ' : analyze.data.status === 'ERROR' ? 'Analyse impossible : ' : 'Rien d’anormal : '}
            {analyze.data.description}
          </p>
        )}
        <MutationError error={analyze.error} />
      </div>

      {inAlert && (
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" disabled={reset.isPending} onClick={() => reset.mutate(machine.machine_id)}>
            {reset.isPending ? 'Remise en état…' : 'Remettre en état normal'}
          </Button>
          <MutationError error={reset.error} />
        </div>
      )}

      {demoTools && !inAlert && (
        <div className="flex flex-col gap-2">
          <Button type="button" variant="ghost" disabled={simulate.isPending} onClick={() => simulate.mutate(machine.machine_id)}>
            {simulate.isPending ? 'Simulation…' : 'Simuler une alerte (démo)'}
          </Button>
          <p className="text-xs text-text-secondary">Réservé aux comptes d’essai et de démonstration : crée une surchauffe fictive pour essayer « Vérifier et résoudre ».</p>
          <MutationError error={simulate.error} />
        </div>
      )}
    </section>
  )
}
