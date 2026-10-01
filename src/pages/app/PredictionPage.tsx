import { useState } from 'react'

import { PredictionContent } from '@/components/prediction/PredictionPanel'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { levelAtLeast } from '@/lib/levelGating'
import { usePredictionsBundle } from '@/hooks/queries/usePrediction'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'
import type { PredictionGranularity } from '@/types/domain'

const GRANULARITIES: { id: PredictionGranularity; label: string }[] = [
  { id: 'heure', label: 'Heure' },
  { id: 'jour', label: 'Jour' },
  { id: 'semaine', label: 'Semaine' },
]

export function PredictionPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  const [granularity, setGranularity] = useState<PredictionGranularity>('heure')
  const query = usePredictionsBundle(profile ?? 'menage', granularity)
  const showModelDetails = levelAtLeast(level, 'technique')

  if (!profile) return null

  return (
    <div className="flex flex-col gap-7">
      <p className="text-sm text-text-secondary">
        Projection de votre consommation à venir, recalibrée à chaque écart mesuré entre prévision et réalité.
      </p>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Granularité de la prédiction">
        {GRANULARITIES.map((g) => (
          <Pill key={g.id} active={granularity === g.id} onClick={() => setGranularity(g.id)}>
            {g.label}
          </Pill>
        ))}
      </div>

      <Card className="flex flex-col gap-4 p-6" aria-label="Prédiction globale">
        <MetricState status={query.status}>
          {query.data && <PredictionContent prediction={query.data.global} showModelDetails={showModelDetails} showModelName={profile === 'admin'} />}
        </MetricState>
      </Card>

      {query.data && query.data.perDevice.length > 1 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-section-title font-semibold text-text-primary">Par équipement</h2>
          <div className="flex flex-col gap-4">
            {query.data.perDevice.map((prediction, index) => (
              <Card key={`${prediction.title}-${index}`} className="flex flex-col gap-4 p-6">
                <PredictionContent prediction={prediction} showModelDetails={showModelDetails} showModelName={profile === 'admin'} />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
