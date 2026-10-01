import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal, MutationError } from '@/components/ui/Modal'
import { useAdminMachineActions } from '@/hooks/queries/useAdminUsers'
import { formatNumberFr, NARROW_NBSP } from '@/lib/formatters'

/**
 * Bouton d'action support partagé entre la page Alertes de l'Admin (AlertCard) et la fiche
 * détail d'un utilisateur (AdminUserDetailPage) : relance une vraie vérification sur
 * l'équipement d'un AUTRE compte, jamais sans confirmation (RGPD — jamais un clic accidentel
 * sur les données d'un utilisateur) ni sans trace (toujours enregistrée dans l'Audit du client).
 */
export function AdminVerifyMachineButton({ machineId, subject }: { machineId: string; subject: string }) {
  const { verify } = useAdminMachineActions()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        disabled={verify.isPending}
        onClick={() => setConfirmOpen(true)}
        className="focus-ring shrink-0 text-sm font-semibold text-accent-cta hover:text-accent-cta-hover disabled:opacity-60"
      >
        {verify.isPending ? 'Vérification…' : 'Vérifier (support)'}
      </button>

      {confirmOpen && (
        <Modal
          title="Vérifier cet équipement depuis le support ?"
          description={subject}
          onClose={() => setConfirmOpen(false)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={verify.isPending}>
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => {
                  verify.mutate(machineId)
                  setConfirmOpen(false)
                }}
                disabled={verify.isPending}
              >
                Vérifier
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary">
            Une nouvelle mesure sera prise sur cet équipement et comparée aux seuils d&rsquo;alerte du compte concerné, exactement
            comme si son propriétaire cliquait lui-même sur « Vérifier et résoudre ».
          </p>
          <p className="text-xs text-text-secondary">Cette action sera enregistrée dans l’Audit du compte concerné, visible par lui.</p>
          <MutationError error={verify.error} />
        </Modal>
      )}
      {verify.isSuccess && verify.data && !verify.data.resolved && (
        <p className="w-full text-xs text-alert">
          Anomalie persistante : {formatNumberFr(verify.data.temperature_c, 1)}
          {NARROW_NBSP}°C, {formatNumberFr(verify.data.vibration_hz, 1)}
          {NARROW_NBSP}Hz.
        </p>
      )}
    </>
  )
}
