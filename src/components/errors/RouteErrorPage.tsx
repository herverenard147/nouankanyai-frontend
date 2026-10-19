import { useEffect } from 'react'
import { Link, useRouteError } from 'react-router-dom'

import { isChunkLoadError, reloadForNewVersion } from '@/lib/newVersion'

/** Page d'erreur des routes : jamais le message technique de React Router affiché au client. */
export function RouteErrorPage() {
  const error = useRouteError()
  const newVersion = isChunkLoadError(error)

  useEffect(() => {
    if (newVersion) reloadForNewVersion()
  }, [newVersion])

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-4 py-12">
      <h1 className="text-section-title font-semibold text-text-primary">
        {newVersion ? 'Une nouvelle version du site est disponible' : 'Une erreur est survenue'}
      </h1>
      <p className="text-sm text-text-secondary">
        {newVersion
          ? 'La page va se recharger. Si rien ne se passe, cliquez sur « Recharger ».'
          : 'Rechargez la page. Si le problème continue, revenez à l’accueil ou contactez-nous.'}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="focus-ring inline-flex min-h-10 items-center justify-center bg-accent-cta px-4 py-2 text-sm font-semibold text-white hover:bg-accent-cta-hover"
        >
          Recharger
        </button>
        <Link to="/" className="focus-ring inline-flex min-h-10 items-center text-sm font-semibold text-accent-cta hover:underline">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  )
}
