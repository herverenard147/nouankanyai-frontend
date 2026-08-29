import { useMemo, useState } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { useJournal } from '@/hooks/queries/useJournal'
import { useSessionStore } from '@/store/sessionStore'

export function JournalPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const query = useJournal(profile!)
  const [typeFilter, setTypeFilter] = useState<string>('Tous')

  const types = useMemo(() => ['Tous', ...new Set((query.data ?? []).map((e) => e.type))], [query.data])
  const filtered = (query.data ?? []).filter((e) => typeFilter === 'Tous' || e.type === typeFilter)

  if (!profile) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            className={`focus-ring rounded-pill border px-3 py-1.5 text-sm font-medium ${
              typeFilter === type ? 'border-text-primary bg-text-primary text-white' : 'border-border text-text-secondary'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <MetricState status={query.status} isEmpty={filtered.length === 0}>
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="px-4 py-3 text-left font-mono text-mono-axis font-semibold uppercase tracking-wide text-text-secondary">Heure</th>
                <th className="px-4 py-3 text-left font-mono text-mono-axis font-semibold uppercase tracking-wide text-text-secondary">Type</th>
                <th className="px-4 py-3 text-left font-mono text-mono-axis font-semibold uppercase tracking-wide text-text-secondary">Détail</th>
                <th className="px-4 py-3 text-left font-mono text-mono-axis font-semibold uppercase tracking-wide text-text-secondary">Compteur</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-text-secondary">{entry.time}</td>
                  <td className="px-4 py-3 text-text-primary">{entry.type}</td>
                  <td className="px-4 py-3 text-text-secondary">{entry.detail}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-text-secondary">{entry.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MetricState>
    </div>
  )
}
