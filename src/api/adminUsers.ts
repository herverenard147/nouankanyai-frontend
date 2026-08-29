import { rawAdminMetrics, rawUpdateUserRole } from '@/api/rawBackend'
import { deriveProfile } from '@/lib/profileMapping'
import type { AdminUser } from '@/types/domain'

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const metrics = await rawAdminMetrics()
  return metrics.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    profile: deriveProfile(u.role, u.platform_role),
    status: u.status === 'actif' ? 'actif' : 'suspendu',
    lastLogin: u.last_active,
    provenance: 'telemetrie_systeme' as const,
    platformRole: u.platform_role,
  }))
}

/** Superadmin uniquement — un admin ordinaire reçoit un 403 (voir CLAUDE.md du backend). */
export function promoteUser(targetUserId: string, makeAdmin: boolean) {
  return rawUpdateUserRole(targetUserId, makeAdmin ? 'admin' : null)
}
