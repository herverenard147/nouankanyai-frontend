import { useState } from 'react'

import { AlertFeedbackForm } from '@/components/alerts/AlertFeedbackForm'
import { AlertSection } from '@/components/alerts/AlertSection'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { useAlertRegistry } from '@/hooks/queries/useAlertRegistry'
import { alertProvenance, levelLabel, resolutionLabel } from '@/lib/alertRegistry'
import { formatUtcDateTime } from '@/lib/formatters'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

export function AlertsPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  // Le registre est celui d'un compte : l'Admin (alertes de toute la plateforme) n'a pas d'appareil en propre.
  const ownAccount = Boolean(profile) && profile !== 'admin'
  const toDocument = useAlertRegistry('a_documenter', ownAccount)
  const history = useAlertRegistry('toutes', ownAccount)
  const [later, setLater] = useState<Set<string>>(new Set())

  if (!profile) return null
  const pending = toDocument.data?.filter((a) => !later.has(a.id)) ?? []
  const anticipated = history.data?.filter((a) => a.is_open && a.level === 'anticipee') ?? []

  return (
    <div className="flex flex-col gap-7">
      <p className="text-sm text-text-secondary">
        {profile === 'admin'
          ? 'Dérives détectées sur les équipements de tous les comptes de la plateforme.'
          : 'Dérives détectées sur vos équipements : celles en cours, puis l’historique de toutes les alertes, jamais effacé.'}
      </p>
      <AlertSection profile={profile} level={level} />

      {ownAccount && anticipated.length > 0 && (
        <section className="flex flex-col gap-1 border-t-2 border-text-primary pt-4">
          <h2 className="text-section-title font-semibold text-text-primary">Dépassements prévus</h2>
          <p className="text-sm text-text-secondary">
            Au rythme actuel, ces appareils vont dépasser leur seuil. Vérifiez-les avant que l&rsquo;alerte n&rsquo;arrive.
          </p>
          {anticipated.map((alert) => {
            const provenance = alertProvenance(alert)
            return (
              <div key={alert.id} className="border-t border-border py-4">
                <h3 className="text-[0.9375rem] font-bold text-text-primary">
                  {alert.machine_nom ?? alert.machine_code} : {alert.kind_label ?? alert.title}
                </h3>
                {alert.description && <p className="mt-1 text-sm text-text-secondary">{frenchNumbersWithUnits(alert.description)}</p>}
                {alert.reco.steps[0] && <p className="mt-1 text-sm text-text-secondary">À vérifier : {alert.reco.steps[0]}</p>}
                {provenance && (
                  <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-text-secondary">
                    Source : <ProvenanceBadge value={provenance} className="lowercase" />
                  </p>
                )}
              </div>
            )
          })}
        </section>
      )}

      {ownAccount && pending.length > 0 && (
        <section id="a-documenter" className="flex flex-col gap-1 border-t-2 border-text-primary pt-4">
          <h2 className="text-section-title font-semibold text-text-primary">Alertes terminées : qu&rsquo;avez-vous fait ?</h2>
          <p className="text-sm text-text-secondary">
            Ces alertes ont disparu. Dites-nous si vous êtes intervenu et quel était le problème : vos réponses nous aident à
            corriger nos recommandations.
          </p>
          {pending.map((alert) => (
            <AlertFeedbackForm key={alert.id} alert={alert} level={level} onLater={() => setLater((s) => new Set(s).add(alert.id))} />
          ))}
        </section>
      )}

      {ownAccount && (
        <section className="flex flex-col gap-3">
          <h2 className="text-section-title font-semibold text-text-primary">Historique des alertes</h2>
          <MetricState status={history.status} isEmpty={history.data?.length === 0}>
            <div className="flex flex-col border-t-2 border-text-primary">
              {history.data?.map((alert) => {
                const provenance = alertProvenance(alert)
                return (
                  <div key={alert.id} className="flex flex-wrap items-start gap-4 border-b border-border py-4">
                    <span className="text-sm tabular-nums text-text-tertiary">{formatUtcDateTime(alert.created_at)}</span>
                    <div className="min-w-[200px] flex-1">
                      <p className="font-semibold text-text-primary">
                        {alert.kind_label ?? alert.title}, {alert.machine_nom ?? alert.machine_code}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {levelLabel(alert.level)}
                        {alert.closed_at && ` · fermée le ${formatUtcDateTime(alert.closed_at)}`}
                        {provenance && (
                          <>
                            {' · source : '}
                            <ProvenanceBadge value={provenance} className="lowercase" />
                          </>
                        )}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${alert.is_open ? 'text-alert' : 'text-text-secondary'}`}>{resolutionLabel(alert)}</span>
                  </div>
                )
              })}
            </div>
          </MetricState>
        </section>
      )}
    </div>
  )
}
