/** Encart permanent : aucune promesse de temps réel, aucun capteur déployé aujourd'hui. */
export function SensorDisclaimer() {
  return (
    <div className="mt-auto border-t border-dark-field-border px-3.5 pt-3">
      <p className="text-xs font-semibold text-white">Capteurs IoT</p>
      <p className="mt-1 text-xs leading-snug text-dark-text">
        Aucun capteur déployé. Les valeurs sont estimées depuis vos factures ou issues du modèle.
      </p>
    </div>
  )
}
