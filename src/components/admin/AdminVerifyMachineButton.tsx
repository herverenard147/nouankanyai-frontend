import { useState } from 'react'

import { Button, Spinner } from '@/components/ui/Button'
import { Modal, MutationError } from '@/components/ui/Modal'
import { useAdminMachineActions } from '@/hooks/queries/useAdminUsers'
import { measureOrigin, measuredReading } from '@/lib/formatters'

/**
 * Bouton d'action support partagé entre la page Alertes de l'Admin (AlertCard) et la fiche
 * détail d'un utilisateur (AdminUserDetailPage) : relance une vraie vérification sur
 * l'équipement d'un AUTRE compte, jamais sans confirmation (RGPD : jamais un clic accidentel
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
        className="focus-ring inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-accent-cta hover:text-accent-cta-hover disabled:opacity-60"
      >
        {verify.isPending && <Spinner />}
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
            La dernière mesure du boîtier (moins de 15 minutes) est comparée aux seuils d&rsquo;alerte du compte concerné, exactement
            comme si son propriétaire cliquait lui-même sur « Vérifier maintenant ». Sans mesure récente, rien n&rsquo;est vérifié.
          </p>
          <p className="text-xs text-text-secondary">Cette action sera enregistrée dans l’Audit du compte concerné, visible par lui.</p>
        </Modal>
      )}
      <MutationError error={verify.error} />
      {verify.isSuccess && verify.data && !verify.data.resolved && (
        <p className="w-full text-xs text-alert">
          Anomalie persistante ({measureOrigin(verify.data, true)}) : {measuredReading(verify.data)}.
        </p>
      )}
    </>
  )
}
