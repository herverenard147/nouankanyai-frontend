import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { confirmBillImport, downloadBillTemplate, previewBillImport } from '@/api/dataImport'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError } from '@/components/ui/Modal'
import { formatFcfa, formatNumberFr, NARROW_NBSP } from '@/lib/formatters'
import type { Profile } from '@/types/domain'

/**
 * Import d'un historique de factures depuis un fichier CSV ou XLSX : modèle à télécharger, aperçu
 * avec les lignes refusées et leur raison, puis confirmation. Rien n'est enregistré avant.
 */
export function BulkInvoiceImport({ profile }: { profile: Profile }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const template = useMutation({ mutationFn: downloadBillTemplate })
  const preview = useMutation({ mutationFn: previewBillImport })
  const confirm = useMutation({
    mutationFn: confirmBillImport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices', profile] }),
  })

  function close() {
    preview.reset()
    confirm.reset()
  }

  const data = preview.data
  return (
    <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
      <h2 className="text-section-title font-semibold text-text-primary">Importer plusieurs factures</h2>
      <p className="max-w-2xl text-sm text-text-secondary">
        Remplissez le modèle avec une ligne par facture (mois, montant, kWh), puis envoyez-le. Vous verrez un aperçu
        avant tout enregistrement.
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
          aria-label="Fichier de factures à importer"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) preview.mutate(file)
            event.target.value = ''
          }}
        />
        <Button type="button" loading={preview.isPending} disabled={preview.isPending} onClick={() => inputRef.current?.click()}>
          {preview.isPending ? 'Lecture du fichier…' : 'Envoyer mon fichier'}
        </Button>
      </div>
      <MutationError error={template.error} />
      <MutationError error={preview.error} />

      {data && (
        <Modal
          title={confirm.isSuccess ? 'Factures importées' : 'Aperçu de l’import'}
          description={
            confirm.isSuccess
              ? `${confirm.data.imported} facture${confirm.data.imported > 1 ? 's' : ''} ajoutée${confirm.data.imported > 1 ? 's' : ''}. Elles comptent dans vos relevés après validation par notre équipe.`
              : `${data.rows.length} ligne${data.rows.length > 1 ? 's' : ''} à importer, ${data.rejected.length} refusée${data.rejected.length > 1 ? 's' : ''}. Rien n’est enregistré tant que vous n’avez pas confirmé.`
          }
          width="lg"
          onClose={close}
          actions={
            confirm.isSuccess ? (
              <Button type="button" onClick={close}>Fermer</Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={close}>Annuler</Button>
                <Button
                  type="button"
                  loading={confirm.isPending}
                  disabled={confirm.isPending || data.rows.length === 0}
                  onClick={() => confirm.mutate(data.rows)}
                >
                  {confirm.isPending ? 'Import…' : `Importer ${data.rows.length} facture${data.rows.length > 1 ? 's' : ''}`}
                </Button>
              </>
            )
          }
        >
          {!confirm.isSuccess && (
            <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
              {data.rows.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-text-tertiary">
                    <tr>
                      <th className="py-1.5 pr-3 font-semibold">Mois</th>
                      <th className="py-1.5 pr-3 font-semibold">Montant</th>
                      <th className="py-1.5 pr-3 font-semibold">Consommation</th>
                      <th className="py-1.5 font-semibold">Période</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.line} className="border-t border-border">
                        <td className="py-1.5 pr-3 tabular-nums text-text-primary">{row.month}</td>
                        <td className="py-1.5 pr-3 tabular-nums text-text-primary">{formatFcfa(row.amount_xof)}</td>
                        <td className="py-1.5 pr-3 tabular-nums text-text-secondary">
                          {row.kwh_consumed != null ? `${formatNumberFr(row.kwh_consumed)}${NARROW_NBSP}kWh` : 'Non renseignée'}
                        </td>
                        <td className="py-1.5 text-text-secondary">{row.period_months === 2 ? 'Deux mois' : 'Un mois'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {data.rejected.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-alert">Lignes refusées</p>
                  <ul className="flex flex-col gap-1 text-sm text-text-secondary">
                    {data.rejected.map((row) => (
                      <li key={row.line}>
                        Ligne {row.line} : {row.raison}.
                      </li>
                    ))}
                  </ul>
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
