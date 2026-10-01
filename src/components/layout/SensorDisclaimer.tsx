/** Encart permanent : aucune promesse de temps réel ; dit d'où vient chaque valeur (décision du propriétaire, DESIGN.md §6). */
export function SensorDisclaimer() {
  return (
    <div className="mt-auto border-t border-dark-field-border px-3.5 pt-3">
      <p className="text-xs font-semibold text-white">Vos appareils</p>
      <p className="mt-1 text-xs leading-snug text-dark-text">
        Chaque valeur indique d’où elle vient : relevé enregistré sur l’appareil, ou estimation tirée de vos factures.
      </p>
    </div>
  )
}
