import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { rawPrepaid } from '@/api/rawBackend'
import { PrepaidForecast } from '@/components/billing/PrepaidSection'
import { formatNumberFr } from '@/lib/formatters'

const WEEKDAY = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

/**
 * Compteurs à carte dans la page Prédiction (demande du propriétaire, 2026-10-21) : quand le crédit sera épuisé et ce
 * que coûteront les 30 prochains jours, sans rien demander de plus au client.
 */
export function PrepaidPredictionCard() {
  const query = useQuery({ queryKey: ['prepaid'], queryFn: rawPrepaid })
  if (!query.data?.length) return null
  return (
    <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4" aria-label="Compteur à carte">
      <h2 className="text-section-title font-semibold text-text-primary">Compteur à carte</h2>
      {query.data.map((m) => (
        <div key={m.site_id} className="flex flex-col gap-1.5">
          {query.data.length > 1 && <h3 className="text-base font-semibold text-text-primary">{m.nom}</h3>}
          {m.credit.epuise_le && m.credit.kwh !== null ? (
            <p className={`text-sm ${m.bientot_epuise ? 'font-semibold text-alert' : 'text-text-primary'}`}>
              Crédit restant ≈ {formatNumberFr(m.credit.kwh, 0)}&nbsp;kWh : épuisé vers le {WEEKDAY[new Date(m.credit.epuise_le).getUTCDay()]}{' '}
              {m.credit.epuise_le.slice(8, 10)}/{m.credit.epuise_le.slice(5, 7)}.
            </p>
          ) : (
            <p className="text-sm text-text-secondary">Ajoutez une recharge avec ses kWh pour savoir quand le crédit sera épuisé.</p>
          )}
          <PrepaidForecast meter={m} />
        </div>
      ))}
      <Link to="/app/factures" className="focus-ring w-fit text-sm font-semibold text-accent-cta hover:underline">
        Mes recharges →
      </Link>
    </section>
  )
}
