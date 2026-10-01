import { useState } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { Button } from '@/components/ui/Button'
import { ConfirmEditModal, Modal, SelectField } from '@/components/ui/Modal'
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
  const [step, setStep] = useState<'form' | 'confirm' | null>(null)
  const [target, setTarget] = useState<'client' | 'admin'>(isAdmin ? 'admin' : 'client')

  return (
    <section className="flex flex-col gap-5 border-t-2 border-text-primary pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-section-title font-semibold text-text-primary">{user.name}</h3>
          <p className="text-sm text-text-secondary">{user.email}</p>
        </div>
        {canManageRoles && !isSuperadmin && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              promoteMutation.reset()
              setTarget(isAdmin ? 'client' : 'admin')
              setStep('form')
            }}
          >
            Changer le rôle
          </Button>
        )}
        {isSuperadmin && <span className="text-sm font-semibold text-text-tertiary">Superadmin, rôle non modifiable</span>}
      </div>
      {step === 'form' && (
        <Modal
          title={`Changer le rôle de ${user.name}`}
          description={user.email}
          onClose={() => setStep(null)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setStep(null)}>
                Annuler
              </Button>
              <Button type="button" onClick={() => setStep('confirm')}>
                Enregistrer
              </Button>
            </>
          }
        >
          <SelectField
            label="Rôle plateforme"
            value={target}
            onChange={(value) => setTarget(value as 'client' | 'admin')}
            options={[
              { value: 'client', label: 'Client (aucun accès à l’administration)' },
              { value: 'admin', label: 'Administrateur' },
            ]}
          />
          <p className="text-xs text-text-secondary">
            Un administrateur voit tous les comptes et la piste d’audit de la plateforme. Le rôle superadmin ne peut pas être modifié ici.
          </p>
        </Modal>
      )}
      {step === 'confirm' && (
        <ConfirmEditModal
          subject={`Vous allez modifier les droits de ${user.name}.`}
          changes={
            target === (isAdmin ? 'admin' : 'client')
              ? []
              : [{ label: 'Rôle plateforme', before: isAdmin ? 'Administrateur' : 'Client', after: target === 'admin' ? 'Administrateur' : 'Client' }]
          }
          pending={promoteMutation.isPending}
          error={promoteMutation.error}
          onBack={() => setStep('form')}
          onConfirm={() => promoteMutation.mutate({ userId: user.id, makeAdmin: target === 'admin' }, { onSuccess: () => setStep(null) })}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-text-secondary">Machines</h4>
          <MetricState status={machinesQuery.status} isEmpty={machinesQuery.data?.length === 0}>
            <ul className="flex flex-col gap-1.5 text-sm">
              {machinesQuery.data?.map((m) => (
                <li key={m.id} className="flex justify-between border-b border-border pb-1.5 text-text-primary">
                  <span>{m.nom}</span>
                  <span className="text-text-secondary">{m.status}</span>
                </li>
              ))}
            </ul>
          </MetricState>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-text-secondary">Commission (mois en cours)</h4>
          <MetricState status={facturationQuery.status}>
            {facturationQuery.data && (
              <ul className="flex flex-col gap-1.5 text-sm text-text-primary">
                <li className="flex justify-between border-b border-border pb-1.5">
                  <span>Économies brutes</span>
                  <span className="tabular-nums">{formatFcfa(facturationQuery.data.grossSavingsThisMonth)}</span>
                </li>
                <li className="flex justify-between border-b border-border pb-1.5">
                  <span>Commission (10 %)</span>
                  <span className="tabular-nums">{formatFcfa(facturationQuery.data.gainShareThisMonth)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Factures enregistrées</span>
                  <span className="tabular-nums">{facturationQuery.data.billCount}</span>
                </li>
              </ul>
            )}
          </MetricState>
        </div>
      </div>
    </section>
  )
}

export function AdminUsersPage() {
  const query = useAdminUsers()
  const session = useSessionStore((s) => s.session)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const canManageRoles = session?.platformRole === 'superadmin'

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        Comptes utilisateurs de la plateforme, tous profils confondus. Cliquez une ligne pour voir machines et
        facturation.
      </p>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        {query.data && <DataTable columns={COLUMNS} rows={query.data} onRowClick={setSelected} searchPlaceholder="Rechercher un utilisateur…" />}
      </MetricState>
      {selected && <UserDetail user={selected} canManageRoles={canManageRoles} />}
    </div>
  )
}
