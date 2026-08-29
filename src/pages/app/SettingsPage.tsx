import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { LevelSelector } from '@/components/level/LevelSelector'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import { useThresholds, useUpdateThresholds } from '@/hooks/queries/useThresholds'
import { useLevel, useLevelStore } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

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
