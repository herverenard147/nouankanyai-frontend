import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal, ConfirmEditModal, Modal, MutationError, SelectField } from '@/components/ui/Modal'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import {
  useAdminUsers,
  usePromoteUser,
  useUserAlerts,
  useUserFacturation,
  useUserMachines,
  useUserManagementMutations,
  useUserPredictions,
} from '@/hooks/queries/useAdminUsers'
import { formatFcfa } from '@/lib/formatters'
import { useSessionStore } from '@/store/sessionStore'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'
const STATUS_LABEL: Record<string, string> = { actif: 'Compte actif', suspendu: 'Compte suspendu', supprime: 'Compte supprimé' }

type Dialog = 'role-form' | 'role-confirm' | 'rename-form' | 'rename-confirm' | 'reset-password' | 'suspend' | 'delete'

/**
 * Fiche détail d'un utilisateur, ouverte depuis Admin → Utilisateurs (DESIGN.md : « afficher
 * par utilisateur dans une page détail pour ne pas surcharger la page actuelle »). Regroupe ce
 * que l'Admin ne voit nulle part ailleurs — lui-même n'a pas d'équipement, de facture ni de
 * prédiction en propre, contrairement aux 3 profils client.
 */
export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const session = useSessionStore((s) => s.session)
  const usersQuery = useAdminUsers()
  const user = usersQuery.data?.find((u) => u.id === userId)

  const machinesQuery = useUserMachines(userId ?? null)
  const facturationQuery = useUserFacturation(userId ?? null)
  const predictionsQuery = useUserPredictions(userId ?? null)
  const alertsQuery = useUserAlerts(userId ?? null)
  const promoteMutation = usePromoteUser()
  const { suspend, resetPassword, updateProfile, remove } = useUserManagementMutations()

  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [roleTarget, setRoleTarget] = useState<'client' | 'admin'>('client')
  const [nom, setNom] = useState('')
  const [newPassword, setNewPassword] = useState('')

  if (usersQuery.status === 'pending') return <p className="text-sm text-text-secondary">Chargement…</p>

  if (!user) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-secondary">Utilisateur introuvable.</p>
        <Link to="/app/admin/utilisateurs" className="focus-ring w-fit text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
          Retour à la liste
        </Link>
      </div>
    )
  }

  const canManageRoles = session?.platformRole === 'superadmin'
  const canDelete = session?.platformRole === 'superadmin'
  const isSelf = user.id === session?.userId
  const isSuperadmin = user.platformRole === 'superadmin'
  const isAdminRole = user.platformRole === 'admin'
  // Même garde-fou que côté backend (_get_manageable_target) : un admin n'agit ni sur
  // son propre compte depuis ce panneau, ni sur le superadmin.
  const canAct = !isSelf && !isSuperadmin && user.status !== 'supprime'

  return (
    <div className="flex flex-col gap-7">
      <Link
        to="/app/admin/utilisateurs"
        className="focus-ring inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent-cta hover:text-accent-cta-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour aux utilisateurs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 border-t-2 border-text-primary pt-4">
        <div>
          <h2 className="text-h2-secondary font-bold text-text-primary">{user.name}</h2>
          <p className="text-sm text-text-secondary">{user.email}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {user.accountLabel} · {STATUS_LABEL[user.status]} · Dernière connexion : {user.lastLogin}
          </p>
        </div>
        {isSelf && <span className="text-sm font-semibold text-text-tertiary">Votre propre compte, non gérable ici</span>}
        {isSuperadmin && !isSelf && <span className="text-sm font-semibold text-text-tertiary">Superadmin, non modifiable</span>}
        {canAct && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNom(user.name)
                updateProfile.reset()
                setDialog('rename-form')
              }}
            >
              Modifier le nom
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewPassword('')
                resetPassword.reset()
                setDialog('reset-password')
              }}
            >
              Réinitialiser le mot de passe
            </Button>
            {canManageRoles && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  promoteMutation.reset()
                  setRoleTarget(isAdminRole ? 'client' : 'admin')
                  setDialog('role-form')
                }}
              >
                Changer le rôle
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                suspend.reset()
                setDialog('suspend')
              }}
            >
              {user.isSuspended ? 'Réactiver' : 'Suspendre'}
            </Button>
            {canDelete && (
              <Button
                type="button"
                variant="outline"
                className="border-alert text-alert hover:bg-alert/10"
                onClick={() => {
                  remove.reset()
                  setDialog('delete')
                }}
              >
                Supprimer le compte
              </Button>
            )}
          </div>
        )}
      </div>

      {dialog === 'rename-form' && (
        <Modal
          title={`Modifier le nom de ${user.name}`}
          description={user.email}
          onClose={() => setDialog(null)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button type="submit" form="rename-form">
                Enregistrer
              </Button>
            </>
          }
        >
          <form
            id="rename-form"
            onSubmit={(event) => {
              event.preventDefault()
              setDialog('rename-confirm')
            }}
          >
            <TextField label="Nom" value={nom} onChange={(event) => setNom(event.target.value)} required />
          </form>
        </Modal>
      )}
      {dialog === 'rename-confirm' && (
        <ConfirmEditModal
          subject={`Vous allez modifier le nom de ${user.name}.`}
          changes={nom.trim() === user.name ? [] : [{ label: 'Nom', before: user.name, after: nom.trim() }]}
          pending={updateProfile.isPending}
          error={updateProfile.error}
          onBack={() => setDialog('rename-form')}
          onConfirm={() => updateProfile.mutate({ userId: user.id, nom: nom.trim() }, { onSuccess: () => setDialog(null) })}
        />
      )}

      {dialog === 'reset-password' && (
        <Modal
          title={`Réinitialiser le mot de passe de ${user.name}`}
          description="L'utilisateur devra utiliser ce nouveau mot de passe à sa prochaine connexion."
          onClose={() => setDialog(null)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button type="submit" form="reset-password-form" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? 'Enregistrement…' : 'Réinitialiser'}
              </Button>
            </>
          }
        >
          <form
            id="reset-password-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (newPassword.length < 6) return
              resetPassword.mutate({ userId: user.id, newPassword }, { onSuccess: () => setDialog(null) })
            }}
            className="flex flex-col gap-3"
          >
            <PasswordField
              label="Nouveau mot de passe"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
            <p className="text-xs text-text-secondary">Au moins 6 caractères.</p>
            <MutationError error={resetPassword.error} />
          </form>
        </Modal>
      )}

      {dialog === 'suspend' && (
        <Modal
          title={user.isSuspended ? `Réactiver le compte de ${user.name} ?` : `Suspendre le compte de ${user.name} ?`}
          description={
            user.isSuspended
              ? 'La connexion redevient possible immédiatement.'
              : "La connexion est refusée immédiatement, y compris si l'utilisateur a déjà une session ouverte. Ses données restent intactes et sont conservées."
          }
          onClose={() => setDialog(null)}
          danger={!user.isSuspended}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button
                type="button"
                disabled={suspend.isPending}
                onClick={() => suspend.mutate({ userId: user.id, suspended: !user.isSuspended }, { onSuccess: () => setDialog(null) })}
                className={user.isSuspended ? undefined : 'bg-alert hover:bg-alert/90'}
              >
                {suspend.isPending ? 'Enregistrement…' : user.isSuspended ? 'Réactiver' : 'Suspendre'}
              </Button>
            </>
          }
        >
          <MutationError error={suspend.error} />
        </Modal>
      )}

      {dialog === 'role-form' && (
        <Modal
          title={`Changer le rôle de ${user.name}`}
          description={user.email}
          onClose={() => setDialog(null)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button type="button" onClick={() => setDialog('role-confirm')}>
                Enregistrer
              </Button>
            </>
          }
        >
          <SelectField
            label="Rôle plateforme"
            value={roleTarget}
            onChange={(value) => setRoleTarget(value as 'client' | 'admin')}
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
      {dialog === 'role-confirm' && (
        <ConfirmEditModal
          subject={`Vous allez modifier les droits de ${user.name}.`}
          changes={
            roleTarget === (isAdminRole ? 'admin' : 'client')
              ? []
              : [{ label: 'Rôle plateforme', before: isAdminRole ? 'Administrateur' : 'Client', after: roleTarget === 'admin' ? 'Administrateur' : 'Client' }]
          }
          pending={promoteMutation.isPending}
          error={promoteMutation.error}
          onBack={() => setDialog('role-form')}
          onConfirm={() => promoteMutation.mutate({ userId: user.id, makeAdmin: roleTarget === 'admin' }, { onSuccess: () => setDialog(null) })}
        />
      )}

      {dialog === 'delete' && (
        <ConfirmDeleteModal
          title={`Supprimer le compte de ${user.name} ?`}
          description="Le compte est anonymisé (email, nom, mot de passe) et la connexion définitivement refusée. L'historique déjà enregistré (audit, commission) n'est pas effacé."
          consequences={[
            'Connexion impossible, immédiatement.',
            'Équipements et sites associés restent en base mais ne sont plus accessibles à personne.',
            'Action irréversible.',
          ]}
          confirmText={user.name}
          pending={remove.isPending}
          error={remove.error}
          onCancel={() => setDialog(null)}
          onConfirm={() => remove.mutate(user.id, { onSuccess: () => setDialog(null) })}
        />
      )}

      <div className="grid gap-7 sm:grid-cols-2">
        <section className={SECTION}>
          <h3 className="text-sm font-medium text-text-secondary">Équipements</h3>
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
        </section>
        <section className={SECTION}>
          <h3 className="text-sm font-medium text-text-secondary">Commission (mois en cours)</h3>
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
        </section>
      </div>

      <section className={SECTION}>
        <h3 className="text-sm font-medium text-text-secondary">Prédiction (heure suivante, par équipement)</h3>
        <MetricState status={predictionsQuery.status} isEmpty={predictionsQuery.data?.length === 0}>
          <ul className="flex flex-col gap-1.5 text-sm">
            {predictionsQuery.data?.map((p) => (
              <li key={p.machineId} className="flex justify-between border-b border-border pb-1.5 text-text-primary">
                <span>{p.nom}</span>
                <span className="tabular-nums text-text-secondary">{p.nextHourValue ?? (p.error ? 'Indisponible' : '—')}</span>
              </li>
            ))}
          </ul>
        </MetricState>
      </section>

      <section className={SECTION}>
        <h3 className="text-sm font-medium text-text-secondary">Alertes et recommandations</h3>
        <MetricState status={alertsQuery.status} isEmpty={alertsQuery.data?.length === 0}>
          <ul className="flex flex-col">
            {alertsQuery.data?.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 border-b border-border py-3">
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-semibold text-text-primary">{a.title}</p>
                  <p className="text-sm text-text-secondary">{a.detail}</p>
                </div>
                <span className="text-sm font-semibold text-text-secondary">{a.severityOrGain}</span>
                <ProvenanceBadge value={a.provenance} />
              </li>
            ))}
          </ul>
        </MetricState>
      </section>
    </div>
  )
}
