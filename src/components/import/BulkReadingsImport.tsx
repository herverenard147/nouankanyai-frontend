import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { confirmReadingImport, downloadReadingTemplate, previewReadingImport } from '@/api/dataImport'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError } from '@/components/ui/Modal'
import { formatNumberFr } from '@/lib/formatters'

const day = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/')
const plural = (count: number, one: string, many: string) => `${formatNumberFr(count)} ${count > 1 ? many : one}`

/**
 * Import d'un historique de relevés (puissance, température, vibration, pression) depuis un
 * fichier CSV ou XLSX : modèle à télécharger, aperçu par appareil avec les lignes refusées, puis
 * confirmation. Les relevés importés sont des valeurs déclarées, jamais présentées comme mesurées.
 */
export function BulkReadingsImport({ itemLabel = 'appareil' }: { itemLabel?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const template = useMutation({ mutationFn: downloadReadingTemplate })
  const preview = useMutation({ mutationFn: previewReadingImport })
  const confirm = useMutation({ mutationFn: () => confirmReadingImport(file as File), onSuccess: () => queryClient.invalidateQueries() })

  function close() {
    setFile(null)
    preview.reset()
    confirm.reset()
  }

  const data = preview.data
  return (
    <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
      <h2 className="text-section-title font-semibold text-text-primary">Importer des relevés</h2>
      <p className="max-w-2xl text-sm text-text-secondary">
        Vous avez déjà des mesures (compteur, tableur, autre outil) ? Remplissez le modèle, une ligne par relevé, avec le code ou
        le nom de chaque {itemLabel}. Vous verrez un aperçu avant tout enregistrement.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" loading={template.isPending} disabled={template.isPending} onClick={() => template.mutate()}>
          Télécharger le modèle
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          aria-label="Fichier de relevés à importer"
          tabIndex={-1}
          onChange={(event) => {
            const chosen = event.target.files?.[0]
            event.target.value = ''
            if (!chosen) return
            setFile(chosen)
            preview.mutate(chosen)
          }}
        />
        <Button type="button" loading={preview.isPending} disabled={preview.isPending} onClick={() => inputRef.current?.click()}>
          {preview.isPending ? 'Lecture du fichier…' : 'Envoyer mon fichier'}
        </Button>
      </div>
      <MutationError error={template.error} />
      <MutationError error={preview.error} />

      {file && data && (
        <Modal
          title={confirm.isSuccess ? 'Relevés importés' : 'Aperçu de l’import'}
          description={
            confirm.isSuccess
              ? `${plural(confirm.data.imported, 'relevé ajouté', 'relevés ajoutés')}. Ils portent la mention « importé » : ce sont vos valeurs, pas des mesures du boîtier.`
              : `${plural(data.acceptes, 'relevé', 'relevés')} à importer, ${plural(data.refuses, 'ligne refusée', 'lignes refusées')}. Rien n’est enregistré tant que vous n’avez pas confirmé.`
          }
          width="lg"
          onClose={close}
          actions={
            confirm.isSuccess ? (
              <Button type="button" onClick={close}>Fermer</Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={close}>Annuler</Button>
                <Button type="button" loading={confirm.isPending} disabled={confirm.isPending || data.acceptes === 0} onClick={() => confirm.mutate()}>
                  {confirm.isPending ? 'Import…' : `Importer ${plural(data.acceptes, 'relevé', 'relevés')}`}
                </Button>
              </>
            )
          }
        >
          {!confirm.isSuccess && (
            <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
              {data.appareils.length > 0 && (
                <ul className="flex flex-col">
                  {data.appareils.map((item) => (
                    <li key={item.code} className="flex flex-wrap items-baseline justify-between gap-3 border-t border-border py-2 text-sm first:border-t-0">
                      <span className="font-semibold text-text-primary">{item.nom}</span>
                      <span className="tabular-nums text-text-secondary">
                        {plural(item.releves, 'relevé', 'relevés')}, du {day(item.du)} au {day(item.au)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {data.rejected.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-alert">Lignes refusées</p>
                  <ul className="flex flex-col gap-1 text-sm text-text-secondary">
                    {data.rejected.slice(0, 30).map((row) => (
                      <li key={row.line}>
                        Ligne {row.line} : {row.raison}.
                      </li>
                    ))}
                  </ul>
                  {data.refuses > 30 && <p className="text-sm text-text-secondary">Et {formatNumberFr(data.refuses - 30)} autres lignes refusées.</p>}
                </div>
              )}
              <MutationError error={confirm.error} />
            </div>
          )}
        </Modal>
      )}
    </section>
  )
}
