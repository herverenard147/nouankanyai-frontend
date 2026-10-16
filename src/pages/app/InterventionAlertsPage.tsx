import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { rawAlertRegistry } from '@/api/rawBackend'
import { AlertFeedbackForm } from '@/components/alerts/AlertFeedbackForm'
import { BoitierSectionBlock } from '@/components/boitier/BoitierParts'
import { MetricState } from '@/components/state/MetricState'
import { closureLabel, levelLabel, resolutionLabel } from '@/lib/alertRegistry'
import { formatUtcDateTime } from '@/lib/formatters'
import { useInterventionStore } from '@/store/interventionStore'
import type { BackendAlertEntry, BackendAlertStatus } from '@/types/backend'

/**
 * Alertes du compte en intervention (décision du propriétaire, 2026-10-16) : le technicien Nouankany, sur site ou à
 * distance, voit les alertes du client et documente celles qu'il a traitées. Chaque réponse porte son nom dans le
 * journal du client. Les appels passent par l'en-tête d'intervention (apiClient, INSTALL_ROUTES).
 */
function useAccountAlerts(status: BackendAlertStatus) {
  const account = useInterventionStore((s) => s.accountId)
  // Clé préfixée par « alert-registry » : un retour envoyé rafraîchit aussi ces listes (useAlertFeedback).
  return useQuery({ queryKey: ['alert-registry', status, 'intervention', account], queryFn: () => rawAlertRegistry(status), enabled: Boolean(account) })
}

function AlertLine({ alert }: { alert: BackendAlertEntry }) {
  return (
    <li className="border-b border-border py-3">
      <p className="font-semibold text-text-primary">
        {alert.machine_nom ?? alert.machine_code} : {alert.kind_label ?? alert.title}
      </p>
      <p className="text-sm text-text-secondary">
        {levelLabel(alert.level)} · ouverte le {formatUtcDateTime(alert.created_at)} UTC
        {alert.is_open ? '' : ` · ${alert.feedback ? resolutionLabel(alert) : closureLabel(alert)}`}
        {alert.feedback?.by_technician ? ' · documentée par un technicien Nouankany' : ''}
      </p>
      {alert.is_open && alert.reco.steps.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-sm text-text-secondary">
          {alert.reco.steps.slice(0, 4).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function InterventionAlertsPage() {
  const open = useAccountAlerts('ouvertes')
  const toDocument = useAccountAlerts('a_documenter')
  const history = useAccountAlerts('fermees')
  // « Plus tard » : masque le formulaire pendant cette visite, l'alerte reste à documenter.
  const [later, setLater] = useState<string[]>([])

  return (
    <div className="flex flex-col gap-6">
      <BoitierSectionBlock title="Alertes ouvertes" rule>
        <MetricState status={open.status} isEmpty={open.data?.length === 0}>
          <ul>{open.data?.map((a) => <AlertLine key={a.id} alert={a} />)}</ul>
        </MetricState>
      </BoitierSectionBlock>

      <BoitierSectionBlock title="Alertes terminées : qu’avez-vous fait ?" rule>
        <p className="text-sm text-text-secondary">
          Répondez pour celles que vous avez traitées : la réponse aide à améliorer les recommandations, et le client la voit.
        </p>
        <MetricState status={toDocument.status} isEmpty={toDocument.data?.length === 0}>
          {toDocument.data?.filter((a) => !later.includes(a.id)).map((a) => (
            <AlertFeedbackForm key={a.id} alert={a} level="technique" onLater={() => setLater((ids) => [...ids, a.id])} />
          ))}
        </MetricState>
      </BoitierSectionBlock>

      <BoitierSectionBlock title="Historique" rule>
        <MetricState status={history.status} isEmpty={history.data?.length === 0}>
          <ul>{history.data?.slice(0, 20).map((a) => <AlertLine key={a.id} alert={a} />)}</ul>
        </MetricState>
      </BoitierSectionBlock>
    </div>
  )
}
