import { AlertSection } from '@/components/alerts/AlertSection'
import { KpiGrid } from '@/components/kpi/KpiGrid'
import { useLevel } from '@/store/levelStore'

export function AdminHealthPage() {
  const level = useLevel('admin')

  return (
    <div className="flex flex-col gap-7">
      <AlertSection profile="admin" level={level} />
      <KpiGrid profile="admin" />
    </div>
  )
}
