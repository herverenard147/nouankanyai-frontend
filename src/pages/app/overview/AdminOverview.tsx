import { Link } from 'react-router-dom'

import { AlertSection } from '@/components/alerts/AlertSection'
import { PredictionPanel } from '@/components/prediction/PredictionPanel'
import { KpiGrid } from '@/components/kpi/KpiGrid'
import { Card } from '@/components/ui/Card'
import { useLevel } from '@/store/levelStore'

const QUICK_LINKS = [
  { to: '/app/admin/sante', label: 'Santé plateforme' },
  { to: '/app/admin/modeles', label: 'Modèles & observabilité' },
  { to: '/app/admin/utilisateurs', label: 'Utilisateurs' },
  { to: '/app/journal', label: 'Journal d’activité' },
]

export function AdminOverview() {
  const level = useLevel('admin')

  return (
    <div className="flex flex-col gap-7">
      <AlertSection profile="admin" level={level} maxActionAlerts={2} />
      <KpiGrid profile="admin" />
      <PredictionPanel profile="admin" level={level} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="p-5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-elevated">
              {link.label} →
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}
