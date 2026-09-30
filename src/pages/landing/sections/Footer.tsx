import { useState } from 'react'
import { Link } from 'react-router-dom'

import { CguContent } from '@/components/legal/CguContent'
import { LegalModal } from '@/components/legal/LegalModal'
import { PrivacyContent } from '@/components/legal/PrivacyContent'

export function Footer() {
  const [openDoc, setOpenDoc] = useState<'cgu' | 'confidentialite' | null>(null)

  return (
    <footer className="border-t border-border py-14">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-9 grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr))]">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Nouankany" className="h-[26px] w-[26px] object-contain" />
              <span className="font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                Nouankany
              </span>
            </div>
            <p className="mt-2 text-[0.8rem] text-text-secondary">
              Plateforme logicielle en démonstration active, avec instrumentation IoT ciblée dès le pilote
              industriel de 6 à 9 mois. Nous ne confondons pas preuve de concept et industrialisation à grande
              échelle.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-label font-semibold uppercase tracking-wide text-text-primary">
              Produit
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-text-secondary">
              <li>
                <Link to="/#profils" className="hover:text-text-primary">
                  Pour qui
                </Link>
              </li>
              <li>
                <Link to="/comment-ca-marche" className="hover:text-text-primary">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link to="/#formules" className="hover:text-text-primary">
                  Formules
                </Link>
              </li>
              <li>
                <Link to="/#confiance" className="hover:text-text-primary">
                  Notre engagement
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-label font-semibold uppercase tracking-wide text-text-primary">
              Entreprise
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-text-secondary">
              <li>
                <Link to="/#apropos" className="hover:text-text-primary">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="hover:text-text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/#faq" className="hover:text-text-primary">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-label font-semibold uppercase tracking-wide text-text-primary">Légal</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-text-secondary">
              <li>
                <button type="button" onClick={() => setOpenDoc('cgu')} className="text-left hover:text-text-primary">
                  Conditions Générales d&rsquo;Utilisation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setOpenDoc('confidentialite')}
                  className="text-left hover:text-text-primary"
                >
                  Politique de confidentialité
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5 text-sm text-text-secondary">
          <span>© 2026 Nouankany. Tous droits réservés.</span>
        </div>
      </div>

      {openDoc === 'cgu' && (
        <LegalModal title="Conditions Générales d’Utilisation" onClose={() => setOpenDoc(null)}>
          <CguContent />
        </LegalModal>
      )}
      {openDoc === 'confidentialite' && (
        <LegalModal title="Politique de confidentialité" onClose={() => setOpenDoc(null)}>
          <PrivacyContent />
        </LegalModal>
      )}
    </footer>
  )
}
