import { useState } from 'react'

import { AdminPlatformPrediction } from '@/components/prediction/AdminPlatformPrediction'
import { PredictionContent } from '@/components/prediction/PredictionPanel'
import { MetricState } from '@/components/state/MetricState'
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
  // L'Admin n'utilise pas la plateforme comme un compte des 3 autres profils (pas d'équipement
  // en propre) : sa page Prédiction appelait /api/predict sur son propre compte, toujours vide
  // (bug trouvé par audit, 2026-10-01) — hook conditionnel plutôt qu'appelé puis ignoré, pour
  // ne jamais lancer la requête par compte en plus de la requête plateforme.
  const query = usePredictionsBundle(profile ?? 'menage', granularity, { enabled: profile !== 'admin' })
  const showModelDetails = levelAtLeast(level, 'technique')

  if (!profile) return null

  if (profile === 'admin') {
    return (
      <div className="flex flex-col gap-7">
        <p className="text-sm text-text-secondary">
          Prédiction de consommation par équipement, pour tous les comptes de la plateforme.
        </p>
        <AdminPlatformPrediction />
      </div>
    )
  }

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

      <section className="flex flex-col gap-4 border-t-2 border-text-primary pt-4" aria-label="Prédiction globale">
        <MetricState status={query.status} isEmpty={!query.data?.global}>
          {query.data?.global && (
            <PredictionContent prediction={query.data.global} showModelDetails={showModelDetails} />
          )}
        </MetricState>
      </section>

      {query.data && query.data.perDevice.length > 1 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-section-title font-semibold text-text-primary">Par équipement</h2>
          <div className="flex flex-col">
            {query.data.perDevice.map((prediction, index) => (
              <div key={`${prediction.title}-${index}`} className="flex flex-col gap-4 border-t-2 border-text-primary py-4">
                <PredictionContent prediction={prediction} showModelDetails={showModelDetails} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
