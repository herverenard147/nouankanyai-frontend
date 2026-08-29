import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <div id="main-content" className="mx-auto max-w-[720px] px-6 py-16">
      <Link to="/" className="text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
        ← Retour à l&rsquo;accueil
      </Link>
      <h1 className="mt-4 text-h2-secondary font-bold text-text-primary">Conditions Générales d&rsquo;Utilisation</h1>
      <p className="mt-2 text-sm text-text-secondary">Dernière mise à jour : 2026.</p>

      <div className="mt-6 flex flex-col gap-6 text-sm text-text-secondary">
        <section>
          <h2 className="text-sm font-semibold text-text-primary">1. Objet</h2>
          <p className="mt-2">
            Les présentes Conditions Générales d&rsquo;Utilisation (CGU) régissent l&rsquo;accès et l&rsquo;usage de
            la plateforme Nouankany, éditée par Nouankany (Côte d&rsquo;Ivoire), accessible via le site et
            l&rsquo;application web. En créant un compte ou en utilisant le service, vous acceptez ces conditions.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-primary">2. Description du service</h2>
          <p className="mt-2">
            Nouankany est une plateforme de pilotage énergétique combinant intelligence artificielle, analyse de
            consommation électrique et, pour les comptes PME et Industrie, une instrumentation IoT ciblée sur les
            équipements prioritaires. Le service comprend des prédictions de consommation, des recommandations, des
            alertes et un tableau de bord. Chaque donnée affichée porte l&rsquo;indication de sa provenance
            (mesurée, estimée ou synthétique) — voir la page{' '}
            <Link to="/comment-ca-marche" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
              Comment ça marche
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-primary">3. Comptes utilisateurs</h2>
          <p className="mt-2">
            La création d&rsquo;un compte nécessite un email valide et un mot de passe. Vous êtes responsable de la
            confidentialité de vos identifiants et de toute activité effectuée depuis votre compte. Un compte
            principal PME/Industrie peut inviter jusqu&rsquo;à 4 comptes membres partageant les mêmes données
            d&rsquo;équipements ; seul le compte principal peut ajouter ou retirer des membres.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-primary">4. Contrat pilote PME/Industrie</h2>
          <p className="mt-2">
            Pour les comptes PME et Industrie, l&rsquo;accès au service s&rsquo;inscrit dans un contrat pilote de 6 à
            9 mois : audit initial, installation ciblée sur les équipements prioritaires, période de mesure, puis
            généralisation si les résultats sont concluants. Les conditions commerciales précises (part sur les
            économies constatées, abonnement, audit de référence) sont définies contractuellement lors de
            l&rsquo;audit et ne sont pas fixées par les présentes CGU.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-primary">5. Vos contenus et données</h2>
          <p className="mt-2">
            Vous restez propriétaire des données que vous déclarez ou téléversez (factures, équipements). Vous
            nous accordez le droit de les traiter pour fournir le service (prédictions, recommandations, détection
            d&rsquo;anomalies). Voir la{' '}
            <Link to="/legal/confidentialite" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
              Politique de confidentialité
            </Link>{' '}
            pour le détail du traitement.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-primary">6. Propriété intellectuelle</h2>
          <p className="mt-2">
            La plateforme, son code, ses modèles et son design restent la propriété de Nouankany. Aucune licence
            d&rsquo;utilisation autre que l&rsquo;accès au service dans le cadre de votre compte ne vous est
            concédée.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-primary">7. Niveau de maturité et limites</h2>
          <p className="mt-2">
            Le produit est en développement actif. Les prédictions et recommandations reposent sur des modèles
            statistiques et, en l&rsquo;absence de capteur installé, sur des données estimées ou synthétiques —
            elles constituent une aide à la décision, pas une garantie de résultat. Les économies annoncées pendant
            un pilote sont mesurées, pas garanties avant validation.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-primary">8. Résiliation</h2>
          <p className="mt-2">
            Vous pouvez demander la clôture de votre compte à tout moment en nous contactant. Un compte principal
            PME/Industrie peut retirer ses comptes membres depuis les Paramètres. Nouankany peut suspendre un
            compte en cas d&rsquo;usage abusif ou de non-respect des présentes CGU.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-primary">9. Droit applicable</h2>
          <p className="mt-2">
            Les présentes CGU sont régies par le droit ivoirien. Tout litige relève, à défaut de résolution
            amiable, des juridictions compétentes de Côte d&rsquo;Ivoire.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-text-primary">10. Contact</h2>
          <p className="mt-2">
            Pour toute question sur ces CGU :{' '}
            <a href="mailto:contact@nouankany.demo" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
              contact@nouankany.demo
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
