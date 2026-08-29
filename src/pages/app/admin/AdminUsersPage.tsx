import { useState } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAdminUsers, usePromoteUser, useUserFacturation, useUserMachines } from '@/hooks/queries/useAdminUsers'
import { formatFcfa } from '@/lib/formatters'
import { useSessionStore } from '@/store/sessionStore'
import type { AdminUser } from '@/types/domain'

const COLUMNS: TableColumn<AdminUser>[] = [
  { key: 'name', label: 'Nom' },
  { key: 'email', label: 'Email' },
  { key: 'profile', label: 'Profil' },
  { key: 'accountLabel', label: 'Compte' },
  { key: 'status', label: 'Statut' },
  { key: 'lastLogin', label: 'Dernière connexion' },
]

function UserDetail({ user, canManageRoles }: { user: AdminUser; canManageRoles: boolean }) {
  const machinesQuery = useUserMachines(user.id)
  const facturationQuery = useUserFacturation(user.id)
  const promoteMutation = usePromoteUser()

  const isSuperadmin = user.platformRole === 'superadmin'
  const isAdmin = user.platformRole === 'admin'

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-section-title font-semibold text-text-primary">{user.name}</h3>
          <p className="text-sm text-text-secondary">{user.email}</p>
        </div>
        {canManageRoles && !isSuperadmin && (
          <Button
            type="button"
            variant={isAdmin ? 'ghost' : 'primary'}
            disabled={promoteMutation.isPending}
            onClick={() => promoteMutation.mutate({ userId: user.id, makeAdmin: !isAdmin })}
          >
            {promoteMutation.isPending ? 'Mise à jour…' : isAdmin ? "Retirer l'accès admin" : 'Promouvoir admin'}
          </Button>
        )}
        {isSuperadmin && <span className="text-sm font-semibold text-text-tertiary">Superadmin — rôle non modifiable</span>}
      </div>
      {promoteMutation.isError && (
        <p className="text-sm text-alert">Échec de la mise à jour du rôle. Réservé au superadmin.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-text-secondary">Machines</h4>
          <MetricState status={machinesQuery.status} isEmpty={machinesQuery.data?.length === 0}>
            <ul className="flex flex-col gap-1.5 text-sm">
              {machinesQuery.data?.map((m) => (
                <li key={m.id} className="flex justify-between border-b border-border pb-1.5 text-text-primary">
                  <span>{m.nom}</span>
                  <span className="font-mono text-text-secondary">{m.status}</span>
                </li>
              ))}
            </ul>
          </MetricState>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-text-secondary">Facturation (mois en cours)</h4>
          <MetricState status={facturationQuery.status}>
            {facturationQuery.data && (
              <ul className="flex flex-col gap-1.5 text-sm text-text-primary">
                <li className="flex justify-between border-b border-border pb-1.5">
                  <span>Économies brutes</span>
                  <span className="font-mono">{formatFcfa(facturationQuery.data.grossSavingsThisMonth)}</span>
                </li>
                <li className="flex justify-between border-b border-border pb-1.5">
                  <span>Commission (10 %)</span>
                  <span className="font-mono">{formatFcfa(facturationQuery.data.gainShareThisMonth)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Factures enregistrées</span>
                  <span className="font-mono">{facturationQuery.data.billCount}</span>
                </li>
              </ul>
            )}
          </MetricState>
        </div>
      </div>
    </Card>
  )
}

export function AdminUsersPage() {
  const query = useAdminUsers()
  const session = useSessionStore((s) => s.session)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const canManageRoles = session?.platformRole === 'superadmin'

  return (
    <div className="flex flex-col gap-5">
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        {query.data && <DataTable columns={COLUMNS} rows={query.data} onRowClick={setSelected} searchPlaceholder="Rechercher un utilisateur…" />}
      </MetricState>
      {selected && <UserDetail user={selected} canManageRoles={canManageRoles} />}
    </div>
  )
}
