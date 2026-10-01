import { useState } from 'react'
import type { FormEvent } from 'react'

import { LevelSelector } from '@/components/level/LevelSelector'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDeleteModal, ConfirmEditModal, Modal, MutationError, type FieldChange } from '@/components/ui/Modal'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import { useAuthMe, useChangePassword, useUpdateProfile } from '@/hooks/queries/useAuthMe'
import { useCreateTeamMember, useDeleteTeamMember, useTeamMembers } from '@/hooks/queries/useTeam'
import { useThresholds, useUpdateThresholds } from '@/hooks/queries/useThresholds'
import { formatNumberFr, NARROW_NBSP } from '@/lib/formatters'
import { useLevel, useLevelStore } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'
import type { Session } from '@/types/domain'

const MAX_TEAM_MEMBERS = 4

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'
const ROW = 'flex flex-wrap items-baseline justify-between gap-2 border-t border-border py-2.5 text-sm'

function ProfileCard({ session }: { session: Session }) {
  const meQuery = useAuthMe()
  const updateProfileMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()

  const [dialog, setDialog] = useState<'name' | 'name-confirm' | 'password' | null>(null)
  const [nom, setNom] = useState(session.displayName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMismatch, setPasswordMismatch] = useState(false)

  function openName() {
    setNom(session.displayName)
    updateProfileMutation.reset()
    setDialog('name')
  }

  function openPassword() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMismatch(false)
    changePasswordMutation.reset()
    setDialog('password')
  }

  function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    changePasswordMutation.mutate({ current_password: currentPassword, new_password: newPassword }, { onSuccess: () => setDialog(null) })
  }

  const memberSince = meQuery.data
    ? new Date(meQuery.data.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const lastSignIn = meQuery.data?.last_sign_in_at ? new Date(meQuery.data.last_sign_in_at).toLocaleString('fr-FR') : null

  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Profil</h2>

      <MetricState status={meQuery.status}>
        <dl>
          <div className={ROW}>
            <dt className="text-text-secondary">Email</dt>
            <dd className="font-semibold text-text-primary">{meQuery.data?.email}</dd>
          </div>
          <div className={ROW}>
            <dt className="text-text-secondary">Type de compte</dt>
            <dd className="text-right font-semibold text-text-primary">{session.subtitle}</dd>
          </div>
          {memberSince && (
            <div className={ROW}>
              <dt className="text-text-secondary">Membre depuis</dt>
              <dd className="font-semibold text-text-primary">{memberSince}</dd>
            </div>
          )}
          {lastSignIn && (
            <div className={ROW}>
              <dt className="text-text-secondary">Dernière connexion</dt>
              <dd className="font-semibold text-text-primary">{lastSignIn}</dd>
            </div>
          )}
          <div className={ROW}>
            <dt className="text-text-secondary">Nom</dt>
            <dd className="font-semibold text-text-primary">{session.displayName}</dd>
          </div>
        </dl>
      </MetricState>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={openName}>
          Modifier le profil
        </Button>
        <Button type="button" variant="outline" onClick={openPassword}>
          Changer le mot de passe
        </Button>
      </div>

      {dialog === 'name' && (
        <Modal
          title="Modifier le profil"
          description="Le nom s’affiche en haut de chaque écran."
          onClose={() => setDialog(null)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button type="submit" form="profile-form">
                Enregistrer
              </Button>
            </>
          }
        >
          <form
            id="profile-form"
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (nom.trim()) setDialog('name-confirm')
            }}
          >
            <TextField label="Nom affiché" value={nom} onChange={(e) => setNom(e.target.value)} required />
            <TextField label="Email" value={meQuery.data?.email ?? ''} disabled readOnly />
            <p className="text-xs text-text-secondary">L’email et le type de compte ne sont pas modifiables ici.</p>
          </form>
        </Modal>
      )}

      {dialog === 'name-confirm' && (
        <ConfirmEditModal
          subject="Votre profil sera mis à jour."
          changes={nom.trim() === session.displayName ? [] : [{ label: 'Nom affiché', before: session.displayName, after: nom.trim() }]}
          pending={updateProfileMutation.isPending}
          error={updateProfileMutation.error}
          onBack={() => setDialog('name')}
          onConfirm={() => updateProfileMutation.mutate({ nom: nom.trim() }, { onSuccess: () => setDialog(null) })}
        />
      )}

      {dialog === 'password' && (
        <Modal
          title="Changer le mot de passe"
          description="Votre mot de passe actuel sert de validation."
          onClose={() => setDialog(null)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button type="submit" form="password-form" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Enregistrement…' : 'Changer le mot de passe'}
              </Button>
            </>
          }
        >
          <form id="password-form" onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <PasswordField label="Mot de passe actuel" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <PasswordField label="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
              <PasswordField label="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
            </div>
            {passwordMismatch && <p className="text-sm text-alert">Les deux mots de passe ne correspondent pas.</p>}
            <p className="text-xs text-text-secondary">Le changement sera enregistré dans l’onglet Audit (jamais le mot de passe).</p>
            <MutationError error={changePasswordMutation.error} />
          </form>
        </Modal>
      )}
    </section>
  )
}

function TeamCard({ isOwner }: { isOwner: boolean }) {
  const query = useTeamMembers()
  const createMutation = useCreateTeamMember()
  const deleteMutation = useDeleteTeamMember()
  const [form, setForm] = useState({ nom: '', email: '', password: '' })
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<{ id: string; nom: string; email: string } | null>(null)

  const memberCount = (query.data?.length ?? 1) - 1 // exclut le propriétaire lui-même
  const atCap = memberCount >= MAX_TEAM_MEMBERS

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMutation.mutate(form, { onSuccess: () => { setForm({ nom: '', email: '', password: '' }); setAdding(false) } })
  }

  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Équipe</h2>
      <p className="text-sm text-text-secondary">
        {isOwner
          ? `Jusqu'à ${MAX_TEAM_MEMBERS} comptes membres peuvent utiliser ce dashboard avec vous — mêmes machines, mêmes factures, mêmes alertes. Vous seul pouvez en ajouter ou en retirer.`
          : 'Vous faites partie de cette équipe. Le compte principal de l’entreprise gère les membres.'}
      </p>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <ul>
          {query.data?.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2.5">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {member.nom} {member.isOwner && <span className="font-normal text-text-tertiary">· Propriétaire</span>}
                </p>
                <p className="text-sm text-text-secondary">{member.email}</p>
              </div>
              {isOwner && !member.isOwner && (
                <button
                  type="button"
                  className="focus-ring text-sm font-semibold text-alert hover:underline"
                  aria-label={`Retirer ${member.nom}`}
                  onClick={() => {
                    deleteMutation.reset()
                    setRemoving({ id: member.id, nom: member.nom, email: member.email })
                  }}
                >
                  Retirer
                </button>
              )}
            </li>
          ))}
        </ul>
      </MetricState>

      {isOwner && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <p className="text-sm font-medium text-text-primary">
            {memberCount}/{MAX_TEAM_MEMBERS} comptes membres utilisés
          </p>
          {atCap ? (
            <p className="text-sm text-text-secondary">Plafond atteint — retirez un membre pour pouvoir en ajouter un nouveau.</p>
          ) : (
            <Button type="button" className="w-fit" onClick={() => { createMutation.reset(); setAdding(true) }}>
              Ajouter un membre
            </Button>
          )}
        </div>
      )}

      {adding && (
        <Modal
          title="Ajouter un membre"
          description="Il pourra se connecter avec cet email et ce mot de passe."
          onClose={() => setAdding(false)}
          width="lg"
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                Annuler
              </Button>
              <Button type="submit" form="member-form" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Ajout…' : 'Ajouter le membre'}
              </Button>
            </>
          }
        >
          <form id="member-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
              <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <PasswordField label="Mot de passe initial" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} minLength={6} required />
            <p className="text-xs text-text-secondary">
              Le membre aura accès aux mêmes machines, factures et alertes que vous. Vous seul pouvez ajouter ou retirer des membres. 4 membres maximum.
            </p>
            <p className="text-xs text-text-secondary">Cette action sera enregistrée dans l’onglet Audit.</p>
            <MutationError error={createMutation.error} />
          </form>
        </Modal>
      )}

      {removing && (
        <ConfirmDeleteModal
          title={`Retirer ${removing.nom} ?`}
          description={removing.email}
          consequences={['Son compte est supprimé : il ne pourra plus se connecter.', 'Ses actions passées restent visibles dans l’Audit, à son nom.']}
          confirmLabel="Retirer le membre"
          pending={deleteMutation.isPending}
          error={deleteMutation.error}
          onCancel={() => setRemoving(null)}
          onConfirm={() => deleteMutation.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
        />
      )}
    </section>
  )
}

function ThresholdsCard() {
  const query = useThresholds()
  const mutation = useUpdateThresholds()
  const [step, setStep] = useState<'form' | 'confirm' | null>(null)
  const [form, setForm] = useState({ temperature_max_c: 60, vibration_max_hz: 45, surconsommation_ratio: 1.2 })

  const current = query.data
  const changes: FieldChange[] = current
    ? [
        { label: 'Température max', before: `${formatNumberFr(current.temperature_max_c, 1)}${NARROW_NBSP}°C`, after: `${formatNumberFr(form.temperature_max_c, 1)}${NARROW_NBSP}°C` },
        { label: 'Vibration max', before: `${formatNumberFr(current.vibration_max_hz, 1)}${NARROW_NBSP}Hz`, after: `${formatNumberFr(form.vibration_max_hz, 1)}${NARROW_NBSP}Hz` },
        { label: 'Ratio de surconsommation', before: String(current.surconsommation_ratio).replace('.', ','), after: String(form.surconsommation_ratio).replace('.', ',') },
      ].filter((change) => change.before !== change.after)
    : []

  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Seuils d&rsquo;alerte</h2>
      <MetricState status={query.status}>
        {current && (
          <dl>
            <div className={ROW}>
              <dt className="text-text-secondary">Température max</dt>
              <dd className="font-semibold text-text-primary">{formatNumberFr(current.temperature_max_c, 1)}{NARROW_NBSP}°C</dd>
            </div>
            <div className={ROW}>
              <dt className="text-text-secondary">Vibration max</dt>
              <dd className="font-semibold text-text-primary">{formatNumberFr(current.vibration_max_hz, 1)}{NARROW_NBSP}Hz</dd>
            </div>
            <div className={ROW}>
              <dt className="text-text-secondary">Ratio de surconsommation</dt>
              <dd className="font-semibold text-text-primary">{String(current.surconsommation_ratio).replace('.', ',')}</dd>
            </div>
          </dl>
        )}
      </MetricState>
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={!current}
        onClick={() => {
          if (current) setForm(current)
          mutation.reset()
          setStep('form')
        }}
      >
        Modifier les seuils
      </Button>

      {step === 'form' && (
        <Modal
          title="Modifier les seuils d’alerte"
          description="S’appliquent à tous vos appareils."
          onClose={() => setStep(null)}
          width="lg"
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setStep(null)}>
                Annuler
              </Button>
              <Button type="submit" form="thresholds-form">
                Enregistrer
              </Button>
            </>
          }
        >
          <form
            id="thresholds-form"
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              setStep('confirm')
            }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField label="Température max (°C)" type="number" step="0.1" value={form.temperature_max_c} onChange={(e) => setForm((f) => ({ ...f, temperature_max_c: Number(e.target.value) }))} />
              <TextField label="Vibration max (Hz)" type="number" step="0.1" value={form.vibration_max_hz} onChange={(e) => setForm((f) => ({ ...f, vibration_max_hz: Number(e.target.value) }))} />
              <TextField label="Ratio de surconsommation" type="number" step="0.1" value={form.surconsommation_ratio} onChange={(e) => setForm((f) => ({ ...f, surconsommation_ratio: Number(e.target.value) }))} />
            </div>
            <p className="text-xs text-text-secondary">Au-delà de ces valeurs, un appareil passe en « Anomalie détectée » et une alerte apparaît.</p>
          </form>
        </Modal>
      )}

      {step === 'confirm' && (
        <ConfirmEditModal
          subject="Les alertes seront recalculées avec ces seuils."
          changes={changes}
          pending={mutation.isPending}
          error={mutation.error}
          onBack={() => setStep('form')}
          onConfirm={() => mutation.mutate(form, { onSuccess: () => setStep(null) })}
        />
      )}
    </section>
  )
}

export function SettingsPage() {
  const session = useSessionStore((s) => s.session)
  const logout = useSessionStore((s) => s.logout)
  const level = useLevel(session?.profile ?? 'menage')
  const setLevel = useLevelStore((s) => s.setLevel)

  if (!session) return null

  return (
    <div className="flex flex-col gap-7">
      <ProfileCard session={session} />

      {session.profile !== 'menage' && (
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="text-section-title font-semibold text-text-primary">Niveau d&rsquo;affichage</h2>
          <p className="text-sm text-text-secondary">
            Contrôle la densité d&rsquo;information affichée sur le dashboard. Accessible ici sur mobile ; en haut de
            l&rsquo;écran sur desktop.
          </p>
          <LevelSelector value={level} onChange={(l) => setLevel(session.profile, l)} />
        </Card>
      )}

      {(session.profile === 'pme' || session.profile === 'industrie') && (
        <TeamCard isOwner={session.isTeamOwner} />
      )}

      {session.profile !== 'admin' && <ThresholdsCard />}

      <button
        type="button"
        onClick={logout}
        className="focus-ring w-fit rounded-control border border-border px-5 py-3 text-sm font-semibold text-text-primary hover:bg-bg-elevated"
      >
        Se déconnecter
      </button>
    </div>
  )
}
