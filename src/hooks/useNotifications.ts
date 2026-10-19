import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { rawNotifications } from '@/api/rawBackend'
import { useAdvice } from '@/hooks/queries/useAdvice'
import { adviceAnchor } from '@/lib/notificationLinks'
import { useNotificationStore } from '@/store/notificationStore'
import type { BackendNotification } from '@/types/backend'
import type { Profile } from '@/types/domain'

/** Profils qui ont des notifications de leur propre compte. */
export const NOTIFIED_PROFILES: Profile[] = ['menage', 'pme', 'industrie']
const POLL_MS = 60_000

/**
 * Toutes les notifications du compte (demande du propriétaire, 2026-10-18) : alertes, retours attendus, factures,
 * relevés, plan d'action, boîtiers (serveur) et conseils (calculés par le site). Relues chaque minute tant que
 * l'onglet est visible. Une nouvelle alerte fait relire ce qui est à l'écran : plus de bandeau surgissant, la
 * cloche porte le compteur.
 */
export function useNotifications(profile: Profile) {
  const enabled = NOTIFIED_PROFILES.includes(profile)
  const queryClient = useQueryClient()
  const server = useQuery({
    queryKey: ['notifications'],
    queryFn: rawNotifications,
    enabled,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  })
  const advice = useAdvice(profile)
  const seen = useNotificationStore((s) => s.seenNotificationIds)
  const markSeen = useNotificationStore((s) => s.markNotificationsSeen)

  const items: BackendNotification[] = useMemo(() => {
    const list = [...(server.data ?? [])]
    if (enabled && advice.data) {
      for (const a of advice.data) {
        list.push({
          id: `conseil:${a.machineId ?? ''}:${a.title}`,
          kind: 'conseil',
          title: a.title,
          detail: a.impactKind === 'gain' ? a.impactLabel : a.detail,
          at: null,
          link: `/app/conseils#${adviceAnchor(a)}`,
          level: 'info',
        })
      }
    }
    return list
  }, [server.data, advice.data, enabled])

  // Nouvelle alerte pendant la visite : les données à l'écran se relisent (compteurs, pages, tuiles).
  const knownAlerts = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!server.data) return
    const ids = server.data.filter((n) => n.kind === 'alerte').map((n) => n.id)
    if (knownAlerts.current !== null && ids.some((id) => !knownAlerts.current!.has(id))) {
      void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'notifications' })
    }
    knownAlerts.current = new Set(ids)
  }, [server.data, queryClient])

  const unseen = items.filter((n) => !seen.includes(n.id))
  return { enabled, items, unseenCount: unseen.length, isUnseen: (id: string) => !seen.includes(id), markSeen, status: server.status }
}
