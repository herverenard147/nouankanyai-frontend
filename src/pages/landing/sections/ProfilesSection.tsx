import { LevelSelector } from '@/components/level/LevelSelector'
import { PhotoPlaceholder } from '@/components/ui/PhotoPlaceholder'
import type { Level } from '@/types/domain'

const PROFILES: { tag: string; caption: string; title: string; body: string; level: Level; badge?: string }[] = [
  {
    tag: 'PME',
    caption: 'Gérant PME dans son commerce, en activité',
    title: 'Arbitrer sans risque',
    body: 'Seuils par appareil, conseils priorisés par impact sur la marge, rapport hebdomadaire exploitable sans expertise technique.',
    level: 'amateur',
  },
  {
    tag: 'Industrie',
    caption: 'Technicien devant un tableau électrique',
    title: 'Piloter la charge',
    body: 'Alertes multi-niveaux, détection d’anomalie machine, plan d’action chiffré. Pensé pour un usage technique quotidien.',
    level: 'technique',
  },
  {
    tag: 'Ménage',
    caption: 'Intérieur de foyer, ambiance quotidienne',
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
          <p className="font-mono text-[0.78rem] font-semibold uppercase tracking-wide text-text-secondary">
            PME et Industrie d&rsquo;abord, ménages ensuite
          </p>
          <h2 className="text-h2-section font-bold text-text-primary">Le dashboard s&rsquo;adapte à qui l&rsquo;utilise</h2>
          <p className="max-w-[60ch] text-[1.02rem] text-text-secondary">
            PME et Industrie sont en phase pilote active dès aujourd&rsquo;hui. La formule Ménage arrive dans un
            second temps, une fois le pilote industriel consolidé. Le niveau de détail affiché s&rsquo;adapte à
            votre profil, et reste modifiable à tout moment.
          </p>
        </div>

        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
          {PROFILES.map((profile) => (
            <div
              key={profile.tag}
              className="flex flex-col rounded-segment border border-border bg-card transition-transform duration-150 ease-out hover:-translate-y-[3px] hover:shadow-segment-hover"
            >
              <PhotoPlaceholder caption={profile.caption} aspect="4/3" className="rounded-b-none" />
              <div className="flex flex-1 flex-col gap-2 p-5.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-wide text-text-secondary">
                    {profile.tag}
                  </p>
                  {profile.badge && (
                    <span className="w-fit rounded-pill bg-bg-elevated px-2.5 py-0.5 text-[0.68rem] font-semibold text-text-secondary">
                      {profile.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-h3-card font-semibold text-text-primary">{profile.title}</h3>
                <p className="text-sm text-text-secondary">{profile.body}</p>
                <div className="mt-auto border-t border-border pt-3.5">
                  <LevelSelector value={profile.level} readOnly />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
