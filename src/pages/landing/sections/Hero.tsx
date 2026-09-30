import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-dark-bg text-white">
      <img
        src="/images/profiles/industrie-hotellerie-clim.jpg"
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
      />
      <div className="mx-auto flex min-h-[560px] max-w-[1200px] flex-col justify-end px-6 pb-16 pt-28 lg:min-h-[680px] lg:pb-20">
        <div className="max-w-[880px]">
          <h1 className="text-[clamp(2.5rem,7vw,5.25rem)] font-bold leading-[1.02] tracking-[-0.025em]">
            Pilotez la consommation électrique de votre site.
          </h1>
          <p className="mt-6 max-w-[40ch] text-[1.2rem] leading-snug lg:text-[1.375rem]">
            Avant qu&rsquo;elle ne pilote vos coûts. Un audit initial, un pilote de 6 à 9 mois sur vos
            équipements prioritaires, une généralisation si les résultats sont concluants.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/demander-un-audit"
              className="focus-ring inline-flex min-h-12 items-center bg-accent px-6 py-3.5 text-base font-semibold text-text-primary hover:brightness-110"
            >
              Demander un audit
            </Link>
            <Link
              to="/comment-ca-marche"
              className="focus-ring text-base font-semibold underline underline-offset-4 hover:opacity-80"
            >
              Voir comment ça marche
            </Link>
          </div>
          <p className="mt-6 text-[0.9rem] text-white">
            <span className="font-semibold text-white">Ménages :</span> la formule arrive dans les prochains
            mois.{' '}
            <Link to="/comment-ca-marche" className="font-semibold text-white underline underline-offset-4">
              Être informé à l&rsquo;ouverture
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
