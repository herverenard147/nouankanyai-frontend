import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { confirmTransfer, previewTransfer, type TransferSection } from '@/api/dataImport'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError } from '@/components/ui/Modal'
import { formatNumberFr } from '@/lib/formatters'

const ALL: TransferSection[] = ['sites', 'appareils', 'releves', 'factures']
const plural = (count: number, one: string, many: string) => `${formatNumberFr(count)} ${count > 1 ? many : one}`

/**
 * Reprise, dans ce compte, des données exportées depuis un autre compte : aperçu, choix de ce qui
 * est repris, puis confirmation. Rien n'est écrasé, et la formule du compte reste respectée.
 */
interface TransferCardProps {
  /** Support : compte du client qui reçoit les données. Absent : le compte connecté. */
  targetUserId?: string
  targetName?: string
}

export function TransferCard({ targetUserId, targetName }: TransferCardProps = {}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [include, setInclude] = useState<TransferSection[]>(ALL)
  const preview = useMutation({ mutationFn: (args: { file: File; include: TransferSection[] }) => previewTransfer(args.file, args.include, targetUserId) })
  const confirm = useMutation({
    mutationFn: () => confirmTransfer(file as File, include, targetUserId),
    onSuccess: () => queryClient.invalidateQueries(),
  })

  function close() {
    setFile(null)
    setInclude(ALL)
    preview.reset()
    confirm.reset()
  }

  function toggle(section: TransferSection) {
    if (!file) return
    let next = include.includes(section) ? include.filter((s) => s !== section) : [...include, section]
    // Un relevé appartient à un appareil : sans les appareils, il n'a nulle part où aller.
    if (!next.includes('appareils')) next = next.filter((s) => s !== 'releves')
    if (next.length === 0) return
    setInclude(next)
    preview.mutate({ file, include: next })
  }

  const data = preview.data
  const lines: { section: TransferSection; label: string; detail: string }[] = data
    ? [
        { section: 'sites', label: 'Sites', detail: `${plural(data.sites.a_creer, 'site créé', 'sites créés')}, ${plural(data.sites.deja_presents, 'déjà présent', 'déjà présents')}` },
        { section: 'appareils', label: 'Appareils', detail: `${plural(data.appareils, 'appareil', 'appareils')}, avec un nouveau code` },
        { section: 'releves', label: 'Relevés', detail: `${plural(data.releves, 'relevé', 'relevés')}, provenance conservée` },
        { section: 'factures', label: 'Factures', detail: `${plural(data.factures.a_importer, 'facture', 'factures')}, ${plural(data.factures.ignorees.length, 'laissée de côté', 'laissées de côté')}` },
      ]
    : []

  return (
    <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
      <h2 className="text-section-title font-semibold text-text-primary">
        {targetUserId ? 'Reprendre un export dans ce compte' : 'Reprendre les données d’un autre compte'}
      </h2>
      <p className="text-sm text-text-secondary">
        {targetUserId
          ? `Envoyez l’archive exportée depuis un autre compte : ses données seront ajoutées au compte de ${targetName ?? 'ce client'}, qui verra l’intervention dans son historique. Rien n’est remplacé.`
          : 'Envoyez ici l’archive téléchargée depuis « Mes données » de l’autre compte. Vous choisissez ce qui est repris ; rien de ce compte n’est remplacé.'}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        aria-label="Archive d'export à reprendre"
        tabIndex={-1}
        onChange={(event) => {
          const chosen = event.target.files?.[0]
          event.target.value = ''
          if (!chosen) return
          setFile(chosen)
          setInclude(ALL)
          preview.mutate({ file: chosen, include: ALL })
        }}
      />
      <Button type="button" variant="outline" className="w-fit" loading={preview.isPending && !data} disabled={preview.isPending} onClick={() => inputRef.current?.click()}>
        {preview.isPending && !data ? 'Lecture de l’archive…' : 'Choisir une archive'}
      </Button>
      {!data && <MutationError error={preview.error} />}

      {file && data && (
        <Modal
          title={confirm.isSuccess ? 'Données reprises' : 'Aperçu de la reprise'}
          description={
            confirm.isSuccess
              ? `${plural(confirm.data.sites, 'site', 'sites')}, ${plural(confirm.data.appareils, 'appareil', 'appareils')}, ${plural(confirm.data.releves, 'relevé', 'relevés')} et ${plural(confirm.data.factures, 'facture', 'factures')} ajoutés à ce compte.`
              : `Export d’un compte ${data.source.type_compte ?? ''} du ${(data.source.exporte_le ?? '').slice(0, 10)}. Décochez ce que vous ne voulez pas reprendre.`
          }
          onClose={close}
          actions={
            confirm.isSuccess ? (
              <Button type="button" onClick={close}>Fermer</Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={close}>Annuler</Button>
                <Button type="button" loading={confirm.isPending} disabled={confirm.isPending || preview.isPending || Boolean(data.blocage)} onClick={() => confirm.mutate()}>
                  {confirm.isPending ? 'Reprise en cours…' : 'Reprendre ces données'}
                </Button>
              </>
            )
          }
        >
          {!confirm.isSuccess && (
            <div className="flex flex-col gap-3">
              <ul className="flex flex-col">
                {lines.map((line) => (
                  <li key={line.section} className="border-t border-border py-2.5 first:border-t-0">
                    <label className="flex cursor-pointer items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-[var(--color-accent-cta)]"
                        checked={include.includes(line.section)}
                        disabled={preview.isPending || (line.section === 'releves' && !include.includes('appareils'))}
                        onChange={() => toggle(line.section)}
                      />
                      <span className="flex flex-col">
                        <span className="font-semibold text-text-primary">{line.label}</span>
                        <span className="text-text-secondary">{include.includes(line.section) ? line.detail : 'Non repris'}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {data.factures.ignorees.length > 0 && include.includes('factures') && (
                <p className="text-sm text-text-secondary">
                  Factures laissées de côté : {data.factures.ignorees.map((f) => `${f.mois ?? 'mois illisible'} (${f.raison})`).join(', ')}.
                </p>
              )}
              {data.blocage && <p className="text-sm font-semibold text-alert">{data.blocage} Décochez « Appareils » ou changez de formule.</p>}
              <p className="text-sm text-text-secondary">Les factures reprises comptent dans vos relevés après validation par notre équipe.</p>
              <MutationError error={preview.error} />
              <MutationError error={confirm.error} />
            </div>
          )}
        </Modal>
      )}
    </section>
  )
}
