import { PhotoPlaceholder } from '@/components/ui/PhotoPlaceholder'

const CAPTIONS = [
  'Facture CIE photographiée au téléphone, gros plan',
  'Compteur électrique CIE, cadrage serré',
  'Devanture ou intérieur PME à Abidjan',
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
