import { useRawMachines } from '@/hooks/queries/useRawMachines'
import { useSeedDemoData } from '@/hooks/queries/useDemo'
import { Button } from '@/components/ui/Button'

/**
 * Essai gratuit (PME/Industrie/Ménage) : un compte fraîchement créé n'a ni
 * site, ni équipement, ni facture — le dashboard est vide et ne montre rien
 * du produit. Ce bandeau ne s'affiche que dans ce cas précis (0 machine) et
 * disparaît dès que le compte a des données, qu'elles viennent de ce bouton
 * ou d'un ajout manuel réel.
 */
export function DemoDataBanner() {
  const rawQuery = useRawMachines()
  const seedMutation = useSeedDemoData()

  if (rawQuery.status !== 'success' || rawQuery.data.length > 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-5">
      <div>
        <p className="text-sm font-semibold text-text-primary">Essai gratuit : ce compte est vide</p>
        <p className="mt-1 text-sm text-text-secondary">
          Chargez des sites, équipements et factures fictifs pour explorer le tableau de bord — tout est
          clairement identifié comme simulé, rien n&rsquo;est présenté comme une mesure réelle.
        </p>
      </div>
      <Button type="button" disabled={seedMutation.isPending} onClick={() => seedMutation.mutate()}>
        {seedMutation.isPending ? 'Génération…' : 'Charger des données de démonstration'}
      </Button>
      {seedMutation.isError && <p className="w-full text-sm text-alert">Échec du chargement des données.</p>}
    </div>
  )
}
