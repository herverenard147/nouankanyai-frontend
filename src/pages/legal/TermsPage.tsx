import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <div id="main-content" className="mx-auto max-w-[720px] px-6 py-16">
      <Link to="/" className="text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
        ← Retour à l&rsquo;accueil
      </Link>
      <h1 className="mt-4 text-h2-secondary font-bold text-text-primary">Conditions Générales d&rsquo;Utilisation</h1>
      <p className="mt-3 text-text-secondary">
        Ce document est en cours de rédaction avec un juriste local, conformément au RGPD et à la loi ivoirienne sur
        les données personnelles. Il sera publié avant l&rsquo;ouverture des inscriptions.
      </p>
    </div>
  )
}
