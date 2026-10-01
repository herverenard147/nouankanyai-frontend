import { useState } from 'react'
import { Link } from 'react-router-dom'

import { CguContent } from '@/components/legal/CguContent'
import { LegalModal } from '@/components/legal/LegalModal'
import { PrivacyContent } from '@/components/legal/PrivacyContent'

export function Footer() {
  const [openDoc, setOpenDoc] = useState<'cgu' | 'confidentialite' | null>(null)

  return (
    <footer className="bg-dark-bg py-14 text-dark-text">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-9 grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr))]">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Nouankany" className="h-[26px] w-[26px] object-contain" />
              <span className="font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Nouankany
              </span>
            </div>
            <p className="mt-2 text-[0.85rem] text-dark-text">
              Plateforme logicielle en démonstration active, avec instrumentation IoT ciblée dès le pilote
              industriel de 6 à 9 mois. Nous ne confondons pas preuve de concept et industrialisation à grande
              échelle.
            </p>
          </div>

          <div>
            <h4 className="text-[0.95rem] font-bold text-white">
              Produit
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-dark-text">
              <li>
                <Link to="/#profils" className="hover:text-white">
                  Pour qui
                </Link>
              </li>
              <li>
                <Link to="/comment-ca-marche" className="hover:text-white">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link to="/#formules" className="hover:text-white">
                  Formules
                </Link>
              </li>
              <li>
                <Link to="/#confiance" className="hover:text-white">
                  Notre engagement
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[0.95rem] font-bold text-white">
              Entreprise
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-dark-text">
              <li>
                <Link to="/#apropos" className="hover:text-white">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/#faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[0.95rem] font-bold text-white">Légal</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-dark-text">
              <li>
                <button type="button" onClick={() => setOpenDoc('cgu')} className="text-left hover:text-white">
                  Conditions Générales d&rsquo;Utilisation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setOpenDoc('confidentialite')}
                  className="text-left hover:text-white"
                >
                  Politique de confidentialité
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dark-field-border pt-5 text-sm text-dark-text">
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
