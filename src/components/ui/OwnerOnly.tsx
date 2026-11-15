import type { ReactNode } from 'react'

import { useSessionStore } from '@/store/sessionStore'

/** Un membre d'équipe (PME/Industrie rattaché à un compte principal) ne supprime rien : le serveur répond 403 (S-21). */
export function useCanDelete(): boolean {
  return useSessionStore((s) => !s.session || !((s.session.profile === 'pme' || s.session.profile === 'industrie') && !s.session.isTeamOwner))
}

/** Affiche une action de suppression, ou à sa place une mention claire pour un membre d'équipe. */
export function OwnerOnly({ children }: { children: ReactNode }) {
  if (useCanDelete()) return <>{children}</>
  return <span className="text-xs text-text-secondary">Réservé au compte principal</span>
}
