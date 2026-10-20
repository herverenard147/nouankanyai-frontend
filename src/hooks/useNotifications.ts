import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'

import { rawNotifications } from '@/api/rawBackend'
import { useAdvice } from '@/hooks/queries/useAdvice'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import { isRouteAllowed } from '@/lib/navConfig'
import { adviceAnchor, kindsSeenOnPage, notificationLink } from '@/lib/notificationLinks'
import { useNotificationStore } from '@/store/notificationStore'
import type { BackendNotification } from '@/types/backend'
import type { Profile } from '@/types/domain'

/** Profils qui ont des notifications de leur propre compte. L'administrateur reçoit celles du serveur (collecte
 * prête pour le réentraînement) : sans cloche, il ne les voyait jamais (test du 2026-10-20). */
export const NOTIFIED_PROFILES: Profile[] = ['menage', 'pme', 'industrie', 'admin']
/** Profils dont les conseils, calculés par le site, s'ajoutent à la liste. */
const ADVICE_PROFILES: Profile[] = ['menage', 'pme', 'industrie']
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
    const list = (server.data ?? []).map((n) => ({ ...n, detail: frenchNumbersWithUnits(n.detail ?? '') }))
    // Une panne déjà notifiée comme alerte n'est pas répétée en conseil ; un conseil d'économie chiffré reste.
    const alerted = new Set(list.filter((n) => n.kind === 'alerte' && n.machine).map((n) => n.machine!.toUpperCase()))
    if (ADVICE_PROFILES.includes(profile) && advice.data) {
      for (const a of advice.data) {
        if (a.impactKind !== 'gain' && a.machineId && alerted.has(a.machineId.toUpperCase())) continue
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
    // Lien adapté au type de compte ; une notification qui mènerait à une page interdite n'est pas montrée.
    return list
      .map((n) => ({ ...n, link: notificationLink(profile, n.link) }))
      .filter((n) => isRouteAllowed(n.link.split('#')[0], profile))
  }, [server.data, advice.data, profile])

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

  // Ouvrir la page qui liste un type de notification les marque vues, comme les compteurs du menu : la cloche
  // affichait encore « 6 nouvelles » après la visite des pages Alertes et Conseils (test du 2026-10-20).
  const { pathname } = useLocation()
  useEffect(() => {
    const kinds = kindsSeenOnPage(pathname)
    const ids = items.filter((n) => kinds.includes(n.kind) && !seen.includes(n.id)).map((n) => n.id)
    if (ids.length) markSeen(ids)
  }, [pathname, items, seen, markSeen])

  const unseen = items.filter((n) => !seen.includes(n.id))
  return { enabled, items, unseenCount: unseen.length, isUnseen: (id: string) => !seen.includes(id), markSeen, status: server.status }
}
