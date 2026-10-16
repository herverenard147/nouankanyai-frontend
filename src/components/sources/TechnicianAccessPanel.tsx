import { useState } from 'react'
import { Link } from 'react-router-dom'

import { BoitierSectionBlock } from '@/components/boitier/BoitierParts'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, MutationError, SelectField } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useTechnicianAccess, useTechnicianAccessMutations } from '@/hooks/queries/useSources'
import { formatUtcDateTime } from '@/lib/formatters'

const DURATIONS = [1, 3, 7, 14, 30].map((d) => ({ value: String(d), label: d === 1 ? '1 jour' : `${d} jours` }))

/**
 * Accès technicien, côté client (2026-10-16) : le titulaire ouvre son compte à un technicien Nouankany pour une durée,
 * et le referme quand il veut. Le serveur refuse un membre d'équipe : le message s'affiche alors avec « Que faire ? ».
 */
export function TechnicianAccessPanel({ rule = true }: { rule?: boolean }) {
  const access = useTechnicianAccess()
  const { grant, revoke } = useTechnicianAccessMutations()
  const [days, setDays] = useState('7')
  const [note, setNote] = useState('')
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  return (
    <BoitierSectionBlock title="Accès technicien" rule={rule}>
      <p className="text-sm text-text-secondary">
        Un technicien Nouankany doit brancher une passerelle ou régler vos sources ? Ouvrez-lui votre compte pour quelques jours. Il ne touche qu’à
        l’installation, jamais à vos factures ni à vos paramètres, et chacune de ses actions est inscrite dans votre journal.{' '}
        <Link to="/app/aide#acces-technicien" className="text-accent-cta underline underline-offset-2">
          En savoir plus
        </Link>
      </p>
      <MetricState status={access.status}>
        {access.data?.active ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-text-primary">
              Accès ouvert jusqu’au <span className="font-semibold">{formatUtcDateTime(access.data.expires_at ?? '').slice(0, 16)}</span> (UTC)
              {access.data.note ? ` · ${access.data.note}` : ''}.
            </p>
            <Button type="button" variant="outline" onClick={() => setConfirmRevoke(true)}>
              Retirer l’accès
            </Button>
          </div>
        ) : (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              grant.mutate({ days: Number(days), note: note.trim() || undefined })
            }}
          >
            <div className="w-40">
              <SelectField label="Durée" value={days} onChange={setDays} options={DURATIONS} />
            </div>
            <div className="min-w-[14rem] flex-1">
              <TextField label="Précision (facultatif)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Pose de la passerelle de l’atelier" />
            </div>
            <Button type="submit" loading={grant.isPending}>
              Autoriser
            </Button>
          </form>
        )}
      </MetricState>
      <MutationError error={grant.error} />
      {confirmRevoke && (
        <ConfirmDeleteModal
          title="Retirer l’accès technicien ?"
          description="Vous pourrez le rouvrir à tout moment."
          consequences={['Le technicien ne voit plus votre compte, immédiatement.', 'Ce qu’il a déjà réglé reste en place.']}
          confirmLabel="Retirer l’accès"
          pending={revoke.isPending}
          error={revoke.error}
          onConfirm={() => revoke.mutate(undefined, { onSuccess: () => setConfirmRevoke(false) })}
          onCancel={() => setConfirmRevoke(false)}
        />
      )}
    </BoitierSectionBlock>
  )
}
