import { PhotoSlider } from '@/components/landing/PhotoSlider'
import { LevelSelector } from '@/components/level/LevelSelector'
import { isCnidEdition } from '@/lib/edition'
import type { Level } from '@/types/domain'

const PROFILES: { tag: string; caption: string; images: string[]; title: string; body: string; level: Level; badge?: string }[] = [
  {
    tag: 'Industrie',
    caption:
      'Équipements des 4 secteurs pilotes : industrie, grande distribution, hôtellerie, santé',
    images: [
      '/images/profiles/industrie-technicien.webp',
      '/images/profiles/supermarche.webp',
      '/images/profiles/industrie-hotellerie-clim.webp',
      '/images/profiles/industrie-sante-generateur.webp',
    ],
    title: 'Piloter la charge',
    body: 'Chaque machine surveillée, chaque dérive signalée, un plan d’action chiffré.',
    level: 'technique',
  },
  {
    tag: 'PME',
    caption:
      'Pressing (machines à laver, séchoirs) et bureau informatique (postes, serveur), les deux gros postes de consommation PME',
    images: ['/images/profiles/pme-pressing.webp', '/images/profiles/pme-informatique.webp'],
    title: 'Arbitrer sans risque',
    body: 'Des conseils classés par ce qu’ils vous font gagner, un rapport clair chaque mois.',
    level: 'amateur',
  },
  {
    tag: 'Ménage',
    caption: 'Climatiseur, réfrigérateur, téléviseur : les équipements domestiques les plus énergivores',
    images: [
      '/images/profiles/menage-climatiseur.webp',
      '/images/profiles/menage-frigo.webp',
      '/images/profiles/menage-televiseur.webp',
    ],
    title: 'Comprendre et anticiper',
    body: 'Suivez vos appareils gratuitement ; avec Essentiel, votre facture prévue à l’avance, avec Optimum, des conseils classés par impact.',
    level: 'debutant',
    badge: 'Inscription ouverte',
  },
]

export function ProfilesSection() {
  // Hors édition CNID, le profil ménage n'est pas présenté.
  const profiles = isCnidEdition() ? PROFILES : PROFILES.filter((profile) => profile.tag !== 'Ménage')
  return (
    <section id="profils" className="py-20 lg:py-28">
      <div className="mx-auto max-w-[75rem] px-6">
        <h2 className="max-w-[18ch] text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
          Le tableau de bord s&rsquo;adapte à qui l&rsquo;utilise
        </h2>
        <p className="mt-4 max-w-[60ch] text-text-secondary">
          {isCnidEdition() ? 'PME et Industrie en pilote, Ménage en inscription ouverte.' : 'PME et Industrie en pilote.'} Le niveau de détail suit votre profil.
        </p>

        <div className="mt-14 flex flex-col gap-16 lg:mt-16 lg:gap-20">
          {profiles.map((profile, index) => {
            return (
              <div
                key={profile.tag}
                className="grid items-center gap-8 md:grid-cols-[6fr_5fr] md:gap-10 lg:gap-14"
              >
                <div
                  className={`relative aspect-[4/3] w-full overflow-hidden lg:aspect-[16/11] ${
                    index % 2 === 1 ? 'md:order-2' : ''
                  }`}
                >
                  <PhotoSlider images={profile.images} label={profile.caption} offsetMs={index * 1200} />
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
