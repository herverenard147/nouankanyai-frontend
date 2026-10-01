import { useNavigate } from 'react-router-dom'

import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { useAdminUsers } from '@/hooks/queries/useAdminUsers'
import type { AdminUser } from '@/types/domain'

const COLUMNS: TableColumn<AdminUser>[] = [
  { key: 'name', label: 'Nom' },
  { key: 'email', label: 'Email' },
  { key: 'profile', label: 'Profil' },
  { key: 'accountLabel', label: 'Compte' },
  { key: 'status', label: 'Statut' },
  { key: 'lastLogin', label: 'Dernière connexion' },
]

export function AdminUsersPage() {
  const query = useAdminUsers()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        Comptes utilisateurs de la plateforme, tous profils confondus. Cliquez une ligne pour voir sa fiche
        détail (équipements, facturation, prédiction, alertes, actions).
      </p>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        {query.data && (
          <DataTable
            columns={COLUMNS}
            rows={query.data}
            onRowClick={(row) => navigate(`/app/admin/utilisateurs/${row.id}`)}
            searchPlaceholder="Rechercher un utilisateur…"
          />
        )}
      </MetricState>
    </div>
  )
}
