import { LevelSelector } from '@/components/level/LevelSelector'
import type { Level } from '@/types/domain'

const PROFILES: { tag: string; caption: string; images: string[]; title: string; body: string; level: Level; badge?: string }[] = [
  {
    tag: 'PME',
    caption:
      'Pressing (machines à laver, séchoirs) et bureau informatique (postes, serveur), les deux gros postes de consommation PME',
    images: ['/images/profiles/pme-pressing.jpg', '/images/profiles/pme-informatique.jpg'],
    title: 'Arbitrer sans risque',
    body: 'Seuils par appareil, conseils priorisés par impact sur la marge, rapport hebdomadaire exploitable sans expertise technique.',
    level: 'amateur',
  },
  {
    tag: 'Industrie',
    caption:
      'Équipements des 4 secteurs pilotes : industrie, grande distribution, hôtellerie, santé',
    images: [
      '/images/profiles/industrie-technicien.jpg',
      '/images/profiles/supermarche.jpg',
      '/images/profiles/industrie-hotellerie-clim.jpg',
      '/images/profiles/industrie-sante-generateur.jpg',
    ],
    title: 'Piloter la charge',
    body: 'Alertes multi-niveaux, détection d’anomalie machine, plan d’action chiffré. Pensé pour un usage technique quotidien.',
    level: 'technique',
  },
  {
    tag: 'Ménage',
    caption: 'Climatiseur, réfrigérateur, téléviseur : les équipements domestiques les plus énergivores',
    images: [
      '/images/profiles/menage-climatiseur.jpg',
      '/images/profiles/menage-frigo.jpg',
      '/images/profiles/menage-televiseur.jpg',
    ],
    title: 'Comprendre et anticiper',
    body: 'Prédiction hebdomadaire, un seuil global simple, conseils directs pour éviter la mauvaise surprise en fin de mois.',
    level: 'debutant',
    badge: 'Bientôt disponible',
  },
]

export function ProfilesSection() {
  return (
    <section id="profils" className="py-16">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-10 flex flex-col gap-2">
          <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">
            PME et Industrie d&rsquo;abord, ménages ensuite
          </p>
          <h2 className="text-h2-section font-bold text-text-primary">Le dashboard s&rsquo;adapte à qui l&rsquo;utilise</h2>
          <p className="max-w-[60ch] text-small-body text-text-secondary">
            PME et Industrie sont en phase pilote active dès aujourd&rsquo;hui. La formule Ménage arrive dans un
            second temps, une fois le pilote industriel consolidé. Le niveau de détail affiché s&rsquo;adapte à
            votre profil, et reste modifiable à tout moment.
          </p>
        </div>

        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
          {PROFILES.map((profile) => {
            const cycleSuffix = profile.images.length as 2 | 3 | 4
            return (
              <div
                key={profile.tag}
                className="flex flex-col rounded-segment border border-border bg-card transition-colors duration-150 ease-out hover:border-text-tertiary"
              >
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-t-segment"
                  role="img"
                  aria-label={profile.caption}
                >
                  {profile.images.map((src, i) =>
                    profile.images.length > 1 ? (
                      <img
                        key={src}
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className={`profile-photo-cycle-${cycleSuffix} absolute inset-0 h-full w-full object-cover`}
                        style={{ animationDelay: `${i * 3}s` }}
                      />
                    ) : (
                      <img key={src} src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                    ),
                  )}
                  {profile.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex gap-1.5" aria-hidden="true">
                      {profile.images.map((src, i) => (
                        <span
                          key={src}
                          className={`profile-dot-cycle-${cycleSuffix} h-1.5 w-1.5 rounded-full bg-white`}
                          style={{ animationDelay: `${i * 3}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-caption font-semibold uppercase tracking-wide text-text-secondary">
                      {profile.tag}
                    </p>
                    {profile.badge && (
                      <span className="w-fit text-caption font-semibold text-text-tertiary">· {profile.badge}</span>
                    )}
                  </div>
                  <h3 className="text-h3-card font-semibold text-text-primary">{profile.title}</h3>
                  <p className="text-sm text-text-secondary">{profile.body}</p>
                  <div className="mt-auto border-t border-border pt-3.5">
                    <LevelSelector value={profile.level} readOnly />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
