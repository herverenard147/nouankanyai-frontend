import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import {
  downloadContactCsv,
  rawContactMessages,
  rawDeleteExportedContactMessages,
  rawDeleteSpamMessages,
  rawMarkContactMessage,
  rawWaitlistEntries,
} from '@/api/rawBackend'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, MutationError } from '@/components/ui/Modal'
import { formatNumberFr } from '@/lib/formatters'
import type { ContactMessageFilter } from '@/types/backend'

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary'
const date = (iso: string) => new Date(iso).toLocaleString('fr-FR')
const PER_PAGE = 50
const FILTERS: { value: ContactMessageFilter; label: string }[] = [
  { value: 'a_traiter', label: 'À traiter' },
  { value: 'traites', label: 'Traités' },
  { value: 'tous', label: 'Tous' },
]

/**
 * Messages du formulaire de contact et inscrits à la liste d'attente. Test du site (2026-10-18) : des milliers de
 * messages de test sans pagination, sans « traité » ni suppression. Maintenant : filtre et recherche, 50 par page,
 * « traité », export CSV, puis suppression des messages exportés (jamais avant : la copie existe hors du site).
 */
export function AdminMessagesPage() {
  const queryClient = useQueryClient()
  const [statut, setStatut] = useState<ContactMessageFilter>('a_traiter')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Spam : nombre de messages de la recherche, tous statuts confondus (celui que l'admin doit retaper).
  const [spamCount, setSpamCount] = useState<number | null>(null)
  const [exportError, setExportError] = useState<unknown>(null)
  const messages = useQuery({
    queryKey: ['admin-contact', statut, search, page],
    queryFn: () => rawContactMessages(statut, search, page, PER_PAGE),
    placeholderData: keepPreviousData,
  })
  const waitlist = useQuery({ queryKey: ['admin-waitlist'], queryFn: rawWaitlistEntries })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-contact'] })
  const mark = useMutation({ mutationFn: ({ id, traite }: { id: string; traite: boolean }) => rawMarkContactMessage(id, traite), onSuccess: refresh })
  const remove = useMutation({
    mutationFn: () => rawDeleteExportedContactMessages(search),
    onSuccess: () => {
      setConfirmDelete(false)
      setPage(1)
      void refresh()
    },
  })
  const spam = useMutation({
    mutationFn: (count: number) => rawDeleteSpamMessages(search, count),
    onSuccess: () => {
      setSpamCount(null)
      setPage(1)
      void refresh()
    },
  })
  async function askSpam() {
    spam.reset()
    const { total: found } = await rawContactMessages('tous', search, 1, 1)
    setSpamCount(found)
  }
  const total = messages.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))

  async function exportCsv() {
    setExportError(null)
    try {
      await downloadContactCsv(statut, search)
      void refresh()
    } catch (error) {
      setExportError(error)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Messages de contact</h2>
        <div className="flex flex-wrap items-end gap-3">
          <fieldset className="flex border border-border">
            <legend className="sr-only">Messages affichés</legend>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={statut === f.value}
                onClick={() => {
                  setStatut(f.value)
                  setPage(1)
                }}
                className={`focus-ring min-h-10 px-4 text-sm font-semibold ${statut === f.value ? 'bg-dark-bg text-white' : 'bg-card text-text-primary hover:bg-bg-elevated'}`}
              >
                {f.label}
              </button>
            ))}
          </fieldset>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setSearch(q)
              setPage(1)
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
              Rechercher (nom, email, texte)
              <input
                value={q}
                maxLength={200}
                onChange={(e) => setQ(e.target.value)}
                className="focus-ring min-h-10 rounded-control border border-border bg-card px-3 text-sm"
              />
            </label>
            <Button type="submit" variant="outline">
              Rechercher
            </Button>
          </form>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={total === 0} onClick={() => void exportCsv()}>
              Exporter ({formatNumberFr(total)})
            </Button>
            <Button type="button" variant="outline" disabled={total === 0} onClick={() => setConfirmDelete(true)} className="text-alert">
              Supprimer les messages exportés
            </Button>
            {/* Spam évident (décision du propriétaire, 2026-10-19) : sans export, seulement sur une recherche. */}
            <Button type="button" variant="outline" disabled={!search.trim() || total === 0} onClick={() => void askSpam()} className="text-alert">
              Supprimer comme spam
            </Button>
          </div>
        </div>
        <MutationError error={exportError ?? mark.error} />
        <MetricState status={messages.status} isEmpty={total === 0}>
          <p className="text-sm text-text-secondary">
            {formatNumberFr(total)} message{total > 1 ? 's' : ''}
            {search ? ` pour « ${search} »` : ''}, page {page} sur {pages}
          </p>
          <div className="relative overflow-x-auto border-y border-border">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-bg-elevated">
                <tr>
                  {['Reçu le', 'Nom', 'Email', 'Message', ''].map((label) => (
                    <th key={label} className={TH}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {messages.data?.items.map((m) => (
                  <tr key={m.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary">{date(m.created_at)}</td>
                    <td className="px-4 py-3 text-text-primary">{m.nom}</td>
                    <td className="px-4 py-3 text-text-secondary">{m.email}</td>
                    <td className="max-w-md whitespace-pre-line px-4 py-3 text-text-secondary">{m.message}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={mark.isPending}
                        onClick={() => mark.mutate({ id: m.id, traite: !m.handled_at })}
                        className="focus-ring text-sm font-semibold text-accent-cta hover:underline disabled:opacity-60"
                      >
                        {m.handled_at ? 'Remettre à traiter' : 'Marquer traité'}
                      </button>
                      {m.exported_at && <span className="block text-xs text-text-tertiary">exporté</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav aria-label="Pages des messages" className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Précédente
              </Button>
              <span className="text-sm tabular-nums text-text-secondary">
                {page} / {pages}
              </span>
              <Button type="button" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Suivante
              </Button>
            </nav>
          )}
        </MetricState>
      </section>

      {spamCount !== null && (
        <ConfirmDeleteModal
          title="Supprimer ces messages comme spam ?"
          description={`Recherche « ${search} » : ${formatNumberFr(spamCount)} message${spamCount > 1 ? 's' : ''}, tous statuts confondus.`}
          consequences={[
            'Ils sont supprimés sans export : aucune copie ne sera gardée.',
            'À réserver au spam évident ; pour un vrai message, exportez d’abord.',
            'Pour confirmer, tapez le nombre de messages ci-dessous.',
          ]}
          confirmText={String(spamCount)}
          confirmFieldLabel="Pour confirmer, tapez le nombre de messages"
          confirmLabel="Supprimer comme spam"
          pending={spam.isPending}
          error={spam.error}
          onConfirm={() => spam.mutate(spamCount)}
          onCancel={() => setSpamCount(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          title="Supprimer les messages exportés ?"
          description={search ? `Messages exportés qui correspondent à « ${search} ».` : 'Tous les messages exportés.'}
          consequences={[
            'Seuls les messages déjà exportés sont supprimés : la copie est dans le fichier CSV téléchargé.',
            'Si un message de la recherche n’a pas encore été exporté, rien n’est supprimé et le site le dit.',
          ]}
          confirmLabel="Supprimer les messages exportés"
          pending={remove.isPending}
          error={remove.error}
          onConfirm={() => remove.mutate()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Liste d&rsquo;attente et newsletter</h2>
        <MetricState status={waitlist.status} isEmpty={waitlist.data?.length === 0}>
          <div className="relative overflow-x-auto border-y border-border">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead className="bg-bg-elevated">
                <tr>
                  {['Inscrit le', 'Email', 'Téléphone'].map((label) => (
                    <th key={label} className={TH}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waitlist.data?.map((w) => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary">{date(w.created_at)}</td>
                    <td className="px-4 py-3 text-text-primary">{w.email}</td>
                    <td className="px-4 py-3 tabular-nums text-text-secondary">{w.telephone ?? 'Non renseigné'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MetricState>
      </section>
    </div>
  )
}
