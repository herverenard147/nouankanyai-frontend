import { useEffect } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'

import { BoitierSectionBlock, Th } from '@/components/boitier/BoitierParts'
import { MetricState } from '@/components/state/MetricState'
import { useInterventionAccounts } from '@/hooks/queries/useSources'
import { formatUtcDateTime } from '@/lib/formatters'
import { useInterventionStore } from '@/store/interventionStore'

/** Technicien : comptes clients qui lui ont ouvert l'accès (étape 5 et 6, 2026-10-16). */
export function InterventionsPage() {
  const accounts = useInterventionAccounts()
  const stop = useInterventionStore((s) => s.stop)
  useEffect(() => stop(), [stop])
  const rows = accounts.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-[44rem] text-sm text-text-secondary">
        Les comptes dont le titulaire vous a ouvert l’accès, jusqu’à la date indiquée. Vous n’y touchez qu’à l’installation ; chacune de vos actions est inscrite dans leur journal.{' '}
        <Link to="/app/aide#regles" className="text-accent-cta underline underline-offset-2">
          Les règles
        </Link>
      </p>
      <MetricState status={accounts.status}>
        {rows.length === 0 ? (
          <p className="text-sm text-text-secondary">Aucun compte ouvert pour le moment. Le client l’ouvre depuis « Accès technicien » (Sources de mesures ou Paramètres).</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-text-primary">
                  <Th>Compte</Th>
                  <Th>Type</Th>
                  <Th>Accès jusqu’au (UTC)</Th>
                  <Th>Précision</Th>
                  <Th>
                    <span className="sr-only">Intervenir</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-border">
                    <td className="py-2.5 pr-4 font-medium text-text-primary">{a.nom}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">{a.type_compte ?? '-'}</td>
                    <td className="py-2.5 pr-4 text-text-primary">{formatUtcDateTime(a.expires_at).slice(0, 16)}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">{a.note ?? '-'}</td>
                    <td className="py-2.5 text-right">
                      <Link to={`/app/interventions/${a.id}?nom=${encodeURIComponent(a.nom)}`} className="font-medium text-accent-cta underline underline-offset-2">
                        Intervenir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MetricState>
    </div>
  )
}

/**
 * Intervention en cours dans le compte d'un client : le bandeau dit lequel, et les routes d'installation partent avec
 * l'en-tête `X-Intervention-Compte` (apiClient). Quitter la page termine l'intervention.
 */
export function InterventionLayout() {
  const { accountId = '' } = useParams()
  const accounts = useInterventionAccounts()
  const start = useInterventionStore((s) => s.start)
  const stop = useInterventionStore((s) => s.stop)
  const current = useInterventionStore((s) => s.accountId)
  const name = accounts.data?.find((a) => a.id === accountId)?.nom ?? new URLSearchParams(window.location.search).get('nom') ?? 'client'

  useEffect(() => {
    start(accountId, name)
    return () => stop()
  }, [accountId, name, start, stop])

  return (
    <div className="flex flex-col gap-4">
      <BoitierSectionBlock title={`Intervention dans le compte « ${name} »`}>
        <p className="text-sm text-text-secondary">
          Vous agissez pour ce client, seulement sur son installation.{' '}
          <Link to="/app/interventions" className="font-medium text-accent-cta underline underline-offset-2">
            Quitter l’intervention
          </Link>
        </p>
      </BoitierSectionBlock>
      {current === accountId ? <Outlet /> : null}
    </div>
  )
}
