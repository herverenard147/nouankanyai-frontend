export function PrivacyContent() {
  return (
    <>
      <section>
        <h3 className="text-sm font-semibold text-text-primary">1. Responsable de traitement</h3>
        <p className="mt-2">
          Nouankany, Abidjan, Côte d&rsquo;Ivoire, est responsable du traitement des données décrites ci-dessous.
          Contact :{' '}
          <a href="mailto:contact@nouankany.com" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
            contact@nouankany.com
          </a>
          .
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">2. Données que nous collectons</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
          <li>Identité et connexion : nom, email, mot de passe (stocké sous forme hachée, jamais en clair).</li>
          <li>
            Données de consommation : équipements déclarés, factures téléversées ou saisies, relevés de capteurs
            lorsqu&rsquo;ils sont installés.
          </li>
          <li>Données commerciales (PME/Industrie) : informations transmises via le formulaire de demande d&rsquo;audit.</li>
          <li>Contact liste d&rsquo;attente (Ménage) : email et, si vous le renseignez, numéro de téléphone.</li>
          <li>Journal technique : horodatage de connexion, actions effectuées sur votre compte.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">3. Finalités du traitement</h3>
        <p className="mt-2">
          Fournir le service (prédictions, recommandations, alertes, dashboard), gérer votre compte et votre équipe,
          traiter les demandes d&rsquo;audit, vous recontacter à l&rsquo;ouverture de la formule Ménage si vous vous
          êtes inscrit(e), et assurer la sécurité de la plateforme.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">4. Base légale</h3>
        <p className="mt-2">
          L&rsquo;exécution du contrat (fourniture du service à un compte créé), votre consentement (inscription à la
          liste d&rsquo;attente, formulaire d&rsquo;audit), et notre intérêt légitime à assurer la sécurité et le bon
          fonctionnement du service.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">5. Durée de conservation</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
          <li>Compte actif : vos données sont gardées tant que le compte existe.</li>
          <li>
            Compte supprimé : votre nom, votre adresse, vos photos, les noms de vos sites et appareils, vos
            conversations et vos notes sont effacés de la plateforme.
          </li>
          <li>
            Identité de l&rsquo;abonné et pièces comptables (relevés de facturation) : 10 ans après la fin du service,
            dans une archive protégée, comme la loi l&rsquo;impose.
          </li>
          <li>
            Historique des actions du compte : gardé pour la même durée, lisible par un administrateur seulement, en
            cas de litige ou de demande légale. Chaque consultation est tracée.
          </li>
          <li>Demandes d&rsquo;audit, liste d&rsquo;attente, messages de contact et journaux techniques : 3 ans.</li>
          <li>Sauvegardes de la base : 90 jours au plus.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">6. Données techniques gardées sans lien avec vous</h3>
        <p className="mt-2">
          Quand un compte est supprimé, les caractéristiques des appareils, les relevés et les consommations sont
          gardés sous un identifiant neuf, sans table de correspondance avec l&rsquo;ancien compte. Ces données ne
          permettent plus de remonter à vous. Elles servent à améliorer les prévisions et n&rsquo;apparaissent jamais
          dans l&rsquo;espace d&rsquo;un autre client. La localisation est ramenée à la commune ou au pays.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">7. Destinataires et hébergement</h3>
        <p className="mt-2">
          Vos données sont accessibles à l&rsquo;équipe Nouankany dans le cadre du service, et, pour un compte membre
          PME/Industrie, aux autres comptes de la même équipe (voir les CGU). Elles ne sont ni vendues, ni transmises à
          des tiers à des fins publicitaires.
        </p>
        <p className="mt-2">
          La plateforme s&rsquo;appuie sur des prestataires techniques situés hors de Côte d&rsquo;Ivoire : hébergement
          de l&rsquo;application et de la base de données, calcul des prévisions, envoi des emails, et un service
          d&rsquo;intelligence artificielle pour la lecture des factures, l&rsquo;analyse des photos et
          l&rsquo;assistant. Ils ne reçoivent que les données nécessaires à leur tâche.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">8. Stockage technique local</h3>
        <p className="mt-2">
          La plateforme conserve votre session de connexion et vos préférences d&rsquo;affichage dans le stockage
          local de votre navigateur (localStorage), propre à votre appareil, pas de cookie tiers de suivi
          publicitaire.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">9. Vos droits</h3>
        <p className="mt-2">
          Conformément à la loi ivoirienne n° 2013-450 relative à la protection des données à caractère personnel,
          vous disposez d&rsquo;un droit d&rsquo;accès, de rectification, d&rsquo;effacement et d&rsquo;opposition. Vous
          pouvez supprimer votre compte vous-même dans Paramètres, et couper les avis par email au même endroit. Pour
          toute autre demande, contactez{' '}
          <a href="mailto:contact@nouankany.com" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
            contact@nouankany.com
          </a>
          . Vous pouvez aussi saisir l&rsquo;autorité de protection, l&rsquo;ARTCI.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">10. Sécurité</h3>
        <p className="mt-2">
          Les mots de passe sont hachés, les échanges avec la plateforme sont chiffrés (HTTPS), et l&rsquo;accès aux
          données d&rsquo;un compte est réservé à ce compte et, le cas échéant, aux membres de la même équipe.
        </p>
      </section>
    </>
  )
}
