import { PhotoPlaceholder } from '@/components/ui/PhotoPlaceholder'

const CAPTIONS = [
  'Devanture ou intérieur PME à Abidjan',
  'Technicien devant un équipement industriel',
  'Facture CIE photographiée au téléphone, gros plan',
]

export function ProofSection() {
  return (
    <section className="py-14">
      <div className="mx-auto grid max-w-[1120px] gap-5 px-6 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
        {CAPTIONS.map((caption) => (
          <PhotoPlaceholder key={caption} caption={caption} />
        ))}
      </div>
    </section>
  )
}
