import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendDeviceCreated, BackendSourceKind } from '@/types/backend'

/** Article et nom de l'appareil qui reçoit le code d'appairage. */
const CODE_TARGET: Partial<Record<BackendSourceKind, [string, string]>> = {
  vocal: ['du boîtier', 'le boîtier'],
  passerelle: ['de la passerelle', 'la passerelle'],
  capteur: ['du capteur', 'le capteur'],
}

export function CreatedModal({ created, onClose, closeLabel = 'Terminé, ouvrir la source' }: { created: BackendDeviceCreated; onClose: () => void; closeLabel?: string }) {
  const profile = useSessionStore((s) => s.session?.profile)
  const [copied, setCopied] = useState(false)
  const isCode = Boolean(created.pairing_code)
  const [ofTarget, target] = CODE_TARGET[created.kind ?? 'vocal'] ?? CODE_TARGET.passerelle!
  const text = isCode ? (created.pairing_code ?? '') : `Identifiant : ${created.id}\nClé : ${created.secret ?? ''}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Modal
      title={isCode ? `Code d’appairage ${ofTarget}` : 'Identifiant et clé de la source'}
      description="Affiché une seule fois : notez-le maintenant."
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => void copy()}>
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button type="button" onClick={onClose}>
            {closeLabel}
          </Button>
        </>
      }
    >
      {isCode ? (
        <div className="flex flex-col gap-2.5">
          <p className="w-fit border border-text-primary px-5 py-3 font-heading text-[2.25rem] font-bold leading-none tracking-[0.16em]">{created.pairing_code}</p>
          <p className="text-sm text-text-primary">Saisissez ce code sur {target} « {created.nom} » dans les 15 minutes. Il ne sert qu’une fois.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-text-secondary">Identifiant</dt>
            <dd className="break-all font-mono text-text-primary">{created.id}</dd>
            <dt className="text-text-secondary">Clé</dt>
            <dd className="break-all font-mono text-text-primary">{created.secret}</dd>
          </dl>
          <p className="text-sm text-text-primary">
            Remettez-les à la personne qui règle le logiciel, en main propre ou par un canal privé. Clé perdue : « Remplacer la clé » sur la fiche de la source.
          </p>
          <Link to={profile === 'technicien' ? '/app/aide#logiciel' : '/app/aide#contrat'} className="text-sm font-medium text-accent-cta underline underline-offset-2">
            Contrat d’envoi et unités
          </Link>
        </div>
      )}
    </Modal>
  )
}
