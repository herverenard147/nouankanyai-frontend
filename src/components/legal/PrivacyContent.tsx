export function PrivacyContent() {
  return (
    <>
      <section>
        <h3 className="text-sm font-semibold text-text-primary">1. Responsable de traitement</h3>
        <p className="mt-2">
          Nouankany, Abidjan, Côte d&rsquo;Ivoire, est responsable du traitement des données décrites ci-dessous.
          Contact :{' '}
          <a href="mailto:contact@nouankany.demo" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
            contact@nouankany.demo
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
        <p className="mt-2">
          Les données d&rsquo;un compte actif sont conservées tant que le compte existe. En cas de suppression
          d&rsquo;un compte membre, l&rsquo;historique d&rsquo;audit associé est détaché plutôt que supprimé, pour la
          traçabilité des actions déjà effectuées. Les demandes d&rsquo;audit et inscriptions à la liste d&rsquo;attente
          sont conservées jusqu&rsquo;à leur traitement par l&rsquo;équipe, ou votre demande de suppression.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">6. Destinataires</h3>
        <p className="mt-2">
          Vos données sont accessibles à l&rsquo;équipe Nouankany dans le cadre du service, et, pour un compte membre
          PME/Industrie, aux autres comptes de la même équipe (mêmes équipements, mêmes données opérationnelles, voir
          les CGU). Elles ne sont ni vendues, ni transmises à des tiers à des fins publicitaires.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">7. Stockage technique local</h3>
        <p className="mt-2">
          La plateforme conserve votre session de connexion et vos préférences d&rsquo;affichage dans le stockage
          local de votre navigateur (localStorage), propre à votre appareil, pas de cookie tiers de suivi
          publicitaire.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">8. Vos droits</h3>
        <p className="mt-2">
          Conformément au RGPD et à la loi ivoirienne relative à la protection des données à caractère personnel, vous
          disposez d&rsquo;un droit d&rsquo;accès, de rectification, d&rsquo;effacement et d&rsquo;opposition sur vos
          données. Pour l&rsquo;exercer, contactez{' '}
          <a href="mailto:contact@nouankany.demo" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
            contact@nouankany.demo
          </a>
          .
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-text-primary">9. Sécurité</h3>
        <p className="mt-2">
          Les mots de passe sont hachés, les échanges avec la plateforme sont chiffrés (HTTPS), et l&rsquo;accès aux
          données d&rsquo;un compte est réservé à ce compte et, le cas échéant, aux membres de la même équipe.
        </p>
      </section>
    </>
  )
}
