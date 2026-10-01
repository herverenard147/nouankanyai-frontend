import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { SiteFields } from '@/components/boitier/SiteFields'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError, SelectField } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useBoitierMutations } from '@/hooks/queries/useBoitiers'
import { useSites } from '@/hooks/queries/useSites'
import { EMPTY_SITE_CHOICE, groupCode, resolveSiteId, siteChoiceReady } from '@/lib/boitierForms'
import { formatUtcDateTime } from '@/lib/formatters'
import type { BackendDeviceCreated } from '@/types/backend'
import type { Profile } from '@/types/domain'

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
]

/**
 * Demander un code de connexion : on nomme le boîtier, on choisit son site, puis le code s'affiche une seule fois (le
 * serveur n'en garde que l'empreinte). Il est valable 15 minutes et ne sert qu'une fois.
 */
export function PairingModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const sites = useSites()
  const client = useQueryClient()
  const { createCode } = useBoitierMutations()
  const [name, setName] = useState('')
  const [site, setSite] = useState(EMPTY_SITE_CHOICE)
  const [language, setLanguage] = useState('fr')
  const [created, setCreated] = useState<BackendDeviceCreated | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const siteList = sites.data ?? []
  const ready = sites.isSuccess && name.trim().length > 0 && siteChoiceReady(siteList, site)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const siteId = await resolveSiteId(siteList, site)
      if (siteList.length === 0) await client.invalidateQueries({ queryKey: ['sites'] })
      setCreated(
        await createCode.mutateAsync({
          nom: name.trim(),
          site_id: siteId,
          scope: 'site',
          language: language as 'fr' | 'en',
        }),
      )
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.pairing_code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (created) {
    return (
      <Modal
        title="Votre code de connexion"
        description="Gardez cette fenêtre ouverte jusqu’à ce que le boîtier soit connecté."
        onClose={onClose}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void copy()}>
              {copied ? 'Code copié' : 'Copier le code'}
            </Button>
            <Button type="button" onClick={onClose}>
              Terminé
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-start gap-3.5">
          <p
            className="border border-text-primary px-5 py-3 font-heading text-[2.5rem] font-bold leading-none tracking-[0.16em]"
            aria-label={`Code : ${created.pairing_code.split('').join(' ')}`}
          >
            {groupCode(created.pairing_code)}
          </p>
          <p className="text-sm text-text-primary">Entrez ce code sur le boîtier « {created.nom} » pour le connecter.</p>
          <p className="text-xs text-text-secondary">
            Valable 15 minutes (jusqu’à {formatUtcDateTime(created.pairing_expires_at).slice(11, 16)} UTC), à usage unique. Il ne sera plus affiché une fois
            cette fenêtre fermée.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Demander un code de connexion"
      description="Ce code relie votre boîtier à votre compte."
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={!ready || busy}>
            {busy ? 'Génération…' : 'Générer le code'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <TextField
          label="Nom du boîtier"
          placeholder={profile === 'menage' ? 'Ex. Boîtier salon' : 'Ex. Boîtier fournil'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <SiteFields sites={siteList} value={site} onChange={setSite} label="Site où il est installé" />
        <SelectField label="Langue" value={language} onChange={setLanguage} options={LANGUAGES} />
        <p className="text-xs text-text-secondary">Le code est valable 15 minutes et ne sert qu’une fois. Vous pourrez en demander un autre.</p>
        <MutationError error={error} />
      </div>
    </Modal>
  )
}
