import { useState } from 'react'
import { Link } from 'react-router-dom'

import { SOURCE_KIND_LABEL, SOURCE_KIND_SENTENCE } from '@/api/sources'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError, SelectField } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { AddSensorModal } from '@/components/sources/AddSensorModal'
import { CreatedModal } from '@/components/sources/CreatedSourceModal'
import { useInstallation, useSourceMutations } from '@/hooks/queries/useSources'
import { useInterventionStore } from '@/store/interventionStore'
import type { BackendDeviceCreated, BackendSourceKind } from '@/types/backend'

type Choice = 'passerelle' | 'logiciel' | 'fichier' | 'boitier' | 'capteur' | 'factures'

const CHOICES: { value: Choice; title: string; text: string }[] = [
  { value: 'passerelle', title: 'Je n’ai pas de logiciel : des compteurs, ou rien', text: SOURCE_KIND_SENTENCE.passerelle },
  { value: 'logiciel', title: 'Mon logiciel peut envoyer ses mesures', text: SOURCE_KIND_SENTENCE.logiciel },
  { value: 'fichier', title: 'Mon logiciel exporte seulement des fichiers', text: SOURCE_KIND_SENTENCE.fichier },
  { value: 'boitier', title: 'Je veux le boîtier qui parle', text: SOURCE_KIND_SENTENCE.vocal },
  { value: 'capteur', title: 'Je veux un capteur sur un appareil', text: SOURCE_KIND_SENTENCE.capteur },
  { value: 'factures', title: 'Je n’ai aucun compteur', text: 'Vos factures CIE suffisent pour commencer : envoyez-les en photo ou en PDF.' },
]

/**
 * « Comment vos mesures peuvent-elles nous arriver ? » (étape 6, 2026-10-16) : le choix, puis le nom et le site, puis
 * le code d'appairage (passerelle) ou l'identifiant et la clé (logiciel, fichiers), montrés une seule fois.
 */
export function AddSourceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const installation = useInstallation()
  const { create } = useSourceMutations()
  const [choice, setChoice] = useState<Choice | null>(null)
  const [nom, setNom] = useState('')
  const [siteId, setSiteId] = useState('')
  const [created, setCreated] = useState<BackendDeviceCreated | null>(null)
  // Technicien en intervention (chez un ménage, par exemple) : il installe le boîtier lui-même et reçoit son code ;
  // un client, lui, passe par sa page Boîtier (demande, livraison, code).
  const intervention = useInterventionStore((st) => st.accountId) !== null

  const sites = installation.data?.sites ?? []

  if (created) return <CreatedModal created={created} onClose={() => onCreated(created.id)} />
  if (choice === 'capteur') return <AddSensorModal onClose={() => setChoice(null)} onCreated={onCreated} />

  if (choice === null || (choice === 'boitier' && !intervention) || choice === 'factures') {
    return (
      <Modal
        title="Comment vos mesures peuvent-elles nous arriver ?"
        description="Choisissez ce qui ressemble à votre installation. En cas de doute, un technicien Nouankany vous conseille sur place."
        onClose={onClose}
        width="lg"
        actions={
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        }
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Type de source</legend>
          {CHOICES.map((c) => (
            <label key={c.value} className="flex min-h-11 cursor-pointer items-start gap-3 border-t border-border py-2.5">
              <input type="radio" name="source" className="mt-1 h-4 w-4" checked={choice === c.value} onChange={() => setChoice(c.value)} />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-text-primary">{c.title}</span>
                <span className="text-sm text-text-secondary">{c.text}</span>
                {choice === 'boitier' && c.value === 'boitier' && (
                  <Link to="/app/boitier" className="text-sm font-medium text-accent-cta underline underline-offset-2">
                    Aller à la page Boîtier
                  </Link>
                )}
                {choice === 'factures' && c.value === 'factures' && (
                  <Link to="/app/factures" className="text-sm font-medium text-accent-cta underline underline-offset-2">
                    Envoyer une facture
                  </Link>
                )}
              </span>
            </label>
          ))}
        </fieldset>
      </Modal>
    )
  }

  const kind: BackendSourceKind = choice === 'boitier' ? 'vocal' : choice
  // Compte sans site (fréquent chez un ménage) : la source couvre tout le compte.
  const noSite = installation.isSuccess && sites.length === 0
  const ready = nom.trim().length > 0 && (siteId !== '' || noSite)
  return (
    <Modal
      title={`Ajouter : ${SOURCE_KIND_LABEL[kind].toLowerCase()}`}
      description={SOURCE_KIND_SENTENCE[kind]}
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => setChoice(null)} disabled={create.isPending}>
            Retour
          </Button>
          <Button
            type="button"
            disabled={!ready}
            loading={create.isPending}
            onClick={() =>
              create.mutate(noSite ? { nom: nom.trim(), kind, scope: 'account', language: 'fr' } : { nom: nom.trim(), kind, scope: 'site', site_id: siteId, language: 'fr' }, {
                onSuccess: setCreated,
              })
            }
          >
            Créer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <TextField label="Nom" required maxLength={80} value={nom} onChange={(e) => setNom(e.target.value)} placeholder={PLACEHOLDER[kind]} />
        {noSite ? (
          <p className="text-sm text-text-secondary">Ce compte n’a pas de site : la source couvrira tous ses appareils.</p>
        ) : (
          <SelectField
            label="Site"
            value={siteId}
            onChange={setSiteId}
            options={[{ value: '', label: 'Choisir le site' }, ...sites.map((s) => ({ value: s.id, label: s.nom }))]}
          />
        )}
        {!noSite && <p className="text-xs text-text-secondary">La source ne voit que les appareils de ce site.</p>}
        <MutationError error={create.error} />
      </div>
    </Modal>
  )
}

const PLACEHOLDER: Record<BackendSourceKind, string> = {
  vocal: 'Boîtier du salon',
  passerelle: 'Passerelle de l’atelier',
  logiciel: 'Supervision de l’usine',
  fichier: 'Export quotidien de la GTB',
  capteur: 'Capteur du climatiseur',
}
