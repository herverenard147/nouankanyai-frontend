/** Encart permanent : aucune promesse de temps réel, aucun capteur déployé aujourd'hui. */
export function SensorDisclaimer() {
  return (
    <div className="mt-auto rounded-card bg-bg-elevated p-3.5">
      <p className="text-xs font-semibold text-text-primary">Capteurs IoT</p>
      <p className="mt-1 text-xs text-text-secondary">
        Aucun capteur déployé. Les valeurs sont estimées depuis vos factures ou issues du modèle.
      </p>
    </div>
  )
}
