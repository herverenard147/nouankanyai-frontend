import { LevelSelector } from '@/components/level/LevelSelector'
import type { Level } from '@/types/domain'

const PROFILES: { tag: string; caption: string; images: string[]; title: string; body: string; level: Level; badge?: string }[] = [
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
    tag: 'PME',
    caption:
      'Pressing (machines à laver, séchoirs) et bureau informatique (postes, serveur), les deux gros postes de consommation PME',
    images: ['/images/profiles/pme-pressing.jpg', '/images/profiles/pme-informatique.jpg'],
    title: 'Arbitrer sans risque',
    body: 'Seuils par appareil, conseils priorisés par impact sur la marge, rapport hebdomadaire exploitable sans expertise technique.',
    level: 'amateur',
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
    <section id="profils" className="py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="max-w-[18ch] text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
          Le dashboard s&rsquo;adapte à qui l&rsquo;utilise
        </h2>
        <p className="mt-4 max-w-[60ch] text-text-secondary">
          PME et Industrie sont en phase pilote active dès aujourd&rsquo;hui. La formule Ménage arrive dans un
          second temps, une fois le pilote industriel consolidé. Le niveau de détail affiché s&rsquo;adapte à
          votre profil, et reste modifiable à tout moment.
        </p>

        <div className="mt-14 flex flex-col gap-16 lg:mt-16 lg:gap-20">
          {PROFILES.map((profile, index) => {
            const cycleSuffix = profile.images.length as 2 | 3 | 4
            return (
              <div
                key={profile.tag}
                className="grid items-center gap-8 lg:grid-cols-[6fr_5fr] lg:gap-14"
              >
                <div
                  className={`relative aspect-[4/3] w-full overflow-hidden lg:aspect-[16/11] ${
                    index % 2 === 1 ? 'lg:order-2' : ''
                  }`}
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
                <div className="flex flex-col gap-3">
                  <p className="font-mono text-sm font-semibold text-accent-cta">
                    {profile.tag}
                    {profile.badge && <span> · {profile.badge}</span>}
                  </p>
                  <h3 className="text-[clamp(1.75rem,3vw,2.125rem)] font-bold leading-tight tracking-[-0.02em] text-text-primary">
                    {profile.title}
                  </h3>
                  <p className="text-text-secondary">{profile.body}</p>
                  <p className="text-sm text-text-secondary">{profile.caption}.</p>
                  <div className="mt-2 border-t border-border pt-4">
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
