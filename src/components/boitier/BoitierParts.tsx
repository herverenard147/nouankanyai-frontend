import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { COMMAND_RESULT_LABEL, COMMAND_VIA_LABEL, LIGHT_COLOR } from '@/api/boitiers'
import { MetricState } from '@/components/state/MetricState'
import { formatUtcDateTime } from '@/lib/formatters'
import type { BackendBoitierLight, BackendDeviceCommand } from '@/types/backend'

export function LightDot({ light, size = 14 }: { light: BackendBoitierLight; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: LIGHT_COLOR[light],
        boxShadow: `0 0 0 1px rgba(0,0,0,.25), 0 0 ${size}px ${LIGHT_COLOR[light]}99`,
      }}
    />
  )
}

export function BoitierSectionBlock({ title, children, action, rule = false }: { title: string; children: ReactNode; action?: ReactNode; rule?: boolean }) {
  return (
    <section aria-label={title} className={`flex min-w-0 flex-col gap-2.5 ${rule ? 'border-t-2 border-text-primary pt-4' : ''}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-section-title font-bold text-text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="focus-ring self-start text-sm font-semibold text-accent-cta">
      ← {children}
    </Link>
  )
}

export function Th({ children }: { children?: ReactNode }) {
  return <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">{children}</th>
}

export function DefinitionRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="border-b border-border">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 border-t border-border py-2 text-sm">
          <dt className="text-text-secondary">{label}</dt>
          <dd className="break-all text-right font-semibold tabular-nums text-text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Ce que le boîtier a fait : une ligne par demande d'extinction, avec « simulé » tant qu'aucun appareil réel n'est commandé. */
export function CommandsTable({ commands, status }: { commands: BackendDeviceCommand[]; status: 'pending' | 'error' | 'success' }) {
  return (
    <MetricState status={status} isEmpty={false}>
      {commands.length === 0 ? (
        <p className="border-t border-border py-2.5 text-sm text-text-secondary">Le boîtier n’a encore rien éteint.</p>
      ) : (
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead className="bg-bg-elevated">
              <tr>
                <Th>Quand</Th>
                <Th>Appareil</Th>
                <Th>Demandé</Th>
                <Th>Résultat</Th>
              </tr>
            </thead>
            <tbody>
              {commands.map((command) => (
                <tr key={command.id} className="border-t border-border">
                  <td className="px-3 py-2.5 tabular-nums text-text-secondary">{formatUtcDateTime(command.created_at).slice(0, 16)}</td>
                  <td className="px-3 py-2.5 text-text-primary">{command.machine_nom ?? '—'}</td>
                  <td className="px-3 py-2.5 text-text-secondary">{COMMAND_VIA_LABEL[command.requested_via]}</td>
                  <td className="px-3 py-2.5 text-text-primary">
                    {COMMAND_RESULT_LABEL[command.status]}
                    {command.simulated && command.status === 'executed' ? ' · simulé' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MetricState>
  )
}
