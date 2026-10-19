import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { rawCompteur, rawRequestCompteurChange, rawSetCompteur } from '@/api/rawBackend'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'
const SOURCE: Record<string, string> = { saisie: 'saisi par vous', facture: 'lu sur votre première facture', admin: 'validé par Nouankany' }

/**
 * Numéro de compteur CIE (décision du propriétaire, 2026-10-19) : saisi une fois, ou repris de la première facture,
 * puis verrouillé. Il sert à refuser la facture d'un autre client. Le changer passe par une demande avec la photo
 * d'une facture qui porte le nouveau numéro, examinée par Nouankany.
 */
export function CompteurCard() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['compteur'], queryFn: rawCompteur })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['compteur'] })
  const [numero, setNumero] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [asking, setAsking] = useState(false)
  const [nouveau, setNouveau] = useState('')
  const [motif, setMotif] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const save = useMutation({ mutationFn: () => rawSetCompteur(numero), onSuccess: () => { setConfirm(false); void refresh() } })
  const ask = useMutation({
    mutationFn: () => rawRequestCompteurChange(nouveau, motif, photo as File),
    onSuccess: () => { setAsking(false); void refresh() },
  })
  const c = query.data

  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Numéro de compteur CIE</h2>
      <p className="text-sm text-text-secondary">
        Il est écrit sur votre facture CIE, dans le cadre « Relevé compteur ». Il permet de vérifier que chaque facture envoyée est bien
        la vôtre. Une fois enregistré, il ne se modifie plus que par une demande examinée par Nouankany.
      </p>
      <MetricState status={query.status}>
        {c && c.verrouille && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <span className="font-mono text-base font-semibold text-text-primary">{c.numero}</span>{' '}
              <span className="text-text-secondary">({c.source ? SOURCE[c.source] : 'enregistré'}, verrouillé)</span>
            </p>
            {c.demande ? (
              <p className="text-text-secondary">Demande de changement vers {c.demande.nouveau} en cours d’examen.</p>
            ) : (
              <Button type="button" variant="outline" className="w-fit" onClick={() => { ask.reset(); setAsking(true) }}>
                Demander un changement
              </Button>
            )}
          </div>
        )}
        {c && !c.verrouille && (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              setConfirm(true)
            }}
          >
            <TextField label="Numéro de compteur" required value={numero} onChange={(e) => setNumero(e.target.value)} maxLength={40} />
            <Button type="submit">Enregistrer</Button>
            <p className="w-full text-xs text-text-secondary">Sans saisie, il sera repris de la première facture que vous envoyez.</p>
          </form>
        )}
      </MetricState>

      {confirm && (
        <Modal
          title="Enregistrer ce numéro ?"
          description={numero}
          onClose={() => setConfirm(false)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setConfirm(false)} disabled={save.isPending}>
                Corriger
              </Button>
              <Button type="button" loading={save.isPending} onClick={() => save.mutate()}>
                Enregistrer et verrouiller
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary">
            Vérifiez-le sur votre facture : une fois enregistré, seul un changement validé par Nouankany pourra le modifier.
          </p>
          <MutationError error={save.error} />
        </Modal>
      )}

      {asking && (
        <Modal
          title="Demander un changement de compteur"
          onClose={() => setAsking(false)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setAsking(false)} disabled={ask.isPending}>
                Annuler
              </Button>
              <Button type="submit" form="compteur-demande" loading={ask.isPending} disabled={!photo}>
                Envoyer la demande
              </Button>
            </>
          }
        >
          <form
            id="compteur-demande"
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (photo) ask.mutate()
            }}
          >
            <TextField label="Nouveau numéro" required value={nouveau} onChange={(e) => setNouveau(e.target.value)} maxLength={40} />
            <TextField label="Raison (facultatif)" value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={500} placeholder="Ex. compteur remplacé par la CIE" />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
              <span>
                Photo d’une facture qui porte le nouveau numéro <span className="text-alert" aria-hidden="true">*</span>
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
            <MutationError error={ask.error} />
          </form>
        </Modal>
      )}
    </section>
  )
}
