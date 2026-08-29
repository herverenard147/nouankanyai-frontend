import { Link } from 'react-router-dom'

export function ContactPage() {
  return (
    <div id="main-content" className="mx-auto max-w-[720px] px-6 py-16">
      <Link to="/" className="text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
        ← Retour à l&rsquo;accueil
      </Link>
      <h1 className="mt-4 text-h2-secondary font-bold text-text-primary">Contact</h1>
      <p className="mt-3 text-text-secondary">
        Nous répondons habituellement sous 48h ouvrées.
      </p>

      <div className="mt-6 rounded-card border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-text-primary">Par email</h2>
        <p className="mt-1 text-sm text-text-secondary">
          <a href="mailto:contact@nouankany.demo" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
            contact@nouankany.demo
          </a>
        </p>
      </div>

      <div className="mt-4 rounded-card border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-text-primary">Vous êtes une PME ou une Industrie ?</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Pour une demande d&rsquo;audit énergétique, passez directement par le formulaire dédié — votre demande est
          traitée par l&rsquo;équipe commerciale.
        </p>
        <Link
          to="/demander-un-audit"
          className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-control bg-accent-cta px-5 py-3 text-sm font-semibold text-white hover:bg-accent-cta-hover"
        >
          Demander un audit
        </Link>
      </div>

      <div className="mt-4 rounded-card border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-text-primary">Une question sur le produit ?</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Consultez d&rsquo;abord la{' '}
          <Link to="/faq" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
            FAQ
          </Link>{' '}
          — la réponse s&rsquo;y trouve peut-être déjà.
        </p>
      </div>
    </div>
  )
}
