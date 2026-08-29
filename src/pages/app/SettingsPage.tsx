import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { LevelSelector } from '@/components/level/LevelSelector'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import { useCreateTeamMember, useDeleteTeamMember, useTeamMembers } from '@/hooks/queries/useTeam'
import { useThresholds, useUpdateThresholds } from '@/hooks/queries/useThresholds'
import { useLevel, useLevelStore } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

const MAX_TEAM_MEMBERS = 4

function TeamCard({ isOwner }: { isOwner: boolean }) {
  const query = useTeamMembers()
  const createMutation = useCreateTeamMember()
  const deleteMutation = useDeleteTeamMember()
  const [form, setForm] = useState({ nom: '', email: '', password: '' })

  const memberCount = (query.data?.length ?? 1) - 1 // exclut le propriétaire lui-même
  const atCap = memberCount >= MAX_TEAM_MEMBERS

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMutation.mutate(form, { onSuccess: () => setForm({ nom: '', email: '', password: '' }) })
  }

  return (
    <Card className="flex flex-col gap-3 p-6">
      <h2 className="text-section-title font-semibold text-text-primary">Équipe</h2>
      <p className="text-sm text-text-secondary">
        {isOwner
          ? `Jusqu'à ${MAX_TEAM_MEMBERS} comptes membres peuvent utiliser ce dashboard avec vous — mêmes machines, mêmes factures, mêmes alertes. Vous seul pouvez en ajouter ou en retirer.`
          : 'Vous faites partie de cette équipe. Le compte principal de l’entreprise gère les membres.'}
      </p>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <ul className="flex flex-col gap-2">
          {query.data?.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {member.nom} {member.isOwner && <span className="text-text-tertiary">— Propriétaire</span>}
                </p>
                <p className="text-sm text-text-secondary">{member.email}</p>
              </div>
              {isOwner && !member.isOwner && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(member.id)}
                >
                  Retirer
                </Button>
              )}
            </li>
          ))}
        </ul>
      </MetricState>
      {deleteMutation.isError && <p className="text-sm text-alert">Échec du retrait du membre.</p>}

      {isOwner && (
        <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm font-medium text-text-primary">
            {memberCount}/{MAX_TEAM_MEMBERS} comptes membres utilisés
          </p>
          {atCap ? (
            <p className="text-sm text-text-secondary">
              Plafond atteint — retirez un membre pour pouvoir en ajouter un nouveau.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
              <TextField
                label="Nom"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                required
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <PasswordField
                label="Mot de passe initial"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={6}
                required
              />
              <Button type="submit" disabled={createMutation.isPending} className="sm:col-span-3 sm:w-fit">
                {createMutation.isPending ? 'Ajout…' : 'Ajouter un membre'}
              </Button>
              {createMutation.isError && (
                <p className="text-sm text-alert sm:col-span-3">
                  Échec de l&rsquo;ajout — vérifiez que l&rsquo;email n&rsquo;est pas déjà utilisé.
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </Card>
  )
}

function ThresholdsCard() {
  const query = useThresholds()
  const mutation = useUpdateThresholds()
  const [form, setForm] = useState({ temperature_max_c: 60, vibration_max_hz: 45, surconsommation_ratio: 1.2 })

  useEffect(() => {
    if (query.data) setForm(query.data)
  }, [query.data])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate(form)
  }

  return (
    <Card className="flex flex-col gap-3 p-6">
      <h2 className="text-section-title font-semibold text-text-primary">Seuils d&rsquo;alerte</h2>
      <MetricState status={query.status}>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <TextField
            label="Température max (°C)"
            type="number"
            value={form.temperature_max_c}
            onChange={(e) => setForm((f) => ({ ...f, temperature_max_c: Number(e.target.value) }))}
          />
          <TextField
            label="Vibration max (Hz)"
            type="number"
            value={form.vibration_max_hz}
            onChange={(e) => setForm((f) => ({ ...f, vibration_max_hz: Number(e.target.value) }))}
          />
          <TextField
            label="Ratio de surconsommation"
            type="number"
            step="0.1"
            value={form.surconsommation_ratio}
            onChange={(e) => setForm((f) => ({ ...f, surconsommation_ratio: Number(e.target.value) }))}
          />
          <Button type="submit" disabled={mutation.isPending} className="sm:col-span-3 sm:w-fit">
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          {mutation.isSuccess && <p className="text-sm text-confirm sm:col-span-3">Seuils mis à jour.</p>}
        </form>
      </MetricState>
    </Card>
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
      <Card className="flex flex-col gap-3 p-6">
        <h2 className="text-section-title font-semibold text-text-primary">Profil</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Compte</dt>
            <dd className="text-text-primary">{session.displayName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Type de compte</dt>
            <dd className="text-right text-text-primary">{session.subtitle}</dd>
          </div>
        </dl>
      </Card>

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
