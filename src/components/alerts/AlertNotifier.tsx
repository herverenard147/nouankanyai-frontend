import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { rawAlertRegistry } from '@/api/rawBackend'
import { useInterventionStore } from '@/store/interventionStore'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendAlertEntry } from '@/types/backend'

/** Profils qui reçoivent les alertes de leur propre compte. */
const CLIENT_PROFILES = ['menage', 'pme', 'industrie']
const POLL_MS = 60_000

/**
 * Notification quand le client est connecté (décision du propriétaire, 2026-10-16) : les alertes ouvertes sont relues
 * chaque minute, tant que l'onglet est visible. Une alerte qui apparaît (ouverte par le boîtier, un capteur ou le
 * balayage du moteur) s'annonce dans un bandeau, avec un lien vers la page Alertes, et met à jour le compteur du menu.
 * Rien n'est annoncé au premier chargement : seules les alertes apparues pendant la visite.
 */
export function AlertNotifier() {
  const profile = useSessionStore((s) => s.session?.profile)
  const intervention = useInterventionStore((s) => s.accountId)
  const enabled = Boolean(profile && CLIENT_PROFILES.includes(profile) && !intervention)
  const queryClient = useQueryClient()
  const known = useRef<Set<string> | null>(null)
  const [fresh, setFresh] = useState<BackendAlertEntry[]>([])

  const open = useQuery({
    queryKey: ['alert-registry-open-poll'],
    queryFn: () => rawAlertRegistry('ouvertes', 50),
    enabled,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  })

  useEffect(() => {
    if (!open.data) return
    if (known.current === null) {
      known.current = new Set(open.data.map((a) => a.id))
      return
    }
    const added = open.data.filter((a) => !known.current!.has(a.id))
    if (added.length === 0) return
    added.forEach((a) => known.current!.add(a.id))
    setFresh((list) => [...added, ...list].slice(0, 3))
    // Tout ce qui est affiché relit ses données (compteur du menu, page Alertes, tuiles de la vue d'ensemble) : seules
    // les requêtes à l'écran repartent, une fois par nouvelle alerte.
    void queryClient.invalidateQueries()
  }, [open.data, queryClient])

  if (!enabled || fresh.length === 0) return null

  return (
    <div className="fixed left-1/2 top-3 z-40 flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
      {fresh.map((alert) => (
        <div key={alert.id} className="flex items-start gap-3 rounded-control border border-alert/40 bg-card p-3 shadow-assistant-panel">
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-alert" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-text-primary">
              {alert.level === 'anticipee' ? 'Dépassement prévu' : 'Nouvelle alerte'} : {alert.machine_nom ?? alert.machine_code ?? 'appareil'}
            </p>
            <p className="text-text-secondary">{alert.kind_label ?? alert.title}</p>
            <Link
              to="/app/alertes"
              onClick={() => setFresh((list) => list.filter((a) => a.id !== alert.id))}
              className="mt-1 inline-block font-semibold text-accent-cta underline underline-offset-2"
            >
              Voir
            </Link>
          </div>
          <button
            type="button"
            aria-label="Fermer la notification"
            onClick={() => setFresh((list) => list.filter((a) => a.id !== alert.id))}
            className="focus-ring rounded-control p-1 text-text-secondary hover:text-text-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
