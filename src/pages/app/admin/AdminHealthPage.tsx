import { AlertSection } from '@/components/alerts/AlertSection'
import { KpiGrid } from '@/components/kpi/KpiGrid'

export function AdminHealthPage() {
  return (
    <div className="flex flex-col gap-7">
      <AlertSection profile="admin" />
      <KpiGrid profile="admin" />
    </div>
  )
}
