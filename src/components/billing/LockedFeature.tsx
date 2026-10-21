import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Fonction que la formule du compte n'inclut pas (2026-10-21) : on dit laquelle l'inclut, avec un lien vers l'Abonnement. */
export function LockedFeature({ title, message }: { title: string; message: string }) {
  return (
    <section className="flex flex-col gap-2 border border-border bg-card p-4" aria-label={title}>
      <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
        {title}
      </p>
      <p className="text-sm text-text-secondary">{message}</p>
      <Link to="/app/facturation" className="focus-ring w-fit text-sm font-semibold text-accent-cta hover:underline">
        Voir les formules →
      </Link>
    </section>
  )
}

export const LOCKED = {
  predictions: { title: 'Prédictions', message: 'Les prédictions et la facture prévue sont incluses dans Essentiel (2 appareils) et Optimum (4 appareils).' },
  anomalies: { title: 'Conseils et détection d’anomalies', message: 'Les conseils et les écarts « À vérifier » sont inclus dans la formule Optimum.' },
  thresholds: { title: 'Seuils d’alerte personnalisés', message: 'Régler vos propres seuils et recevoir les alertes par email : formules Essentiel et Optimum. Les seuils par défaut vous protègent déjà.' },
}
