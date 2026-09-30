import { AlertSection } from '@/components/alerts/AlertSection'
import { KpiGrid } from '@/components/kpi/KpiGrid'
import { useLevel } from '@/store/levelStore'

export function AdminHealthPage() {
  const level = useLevel('admin')

  return (
    <div className="flex flex-col gap-7">
      <p className="text-sm text-text-secondary">
        État de la plateforme : alertes actives tous profils confondus et indicateurs de charge système.
      </p>
      <AlertSection profile="admin" level={level} />
      <KpiGrid profile="admin" />
    </div>
  )
}
