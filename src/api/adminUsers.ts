import { rawAdminMetrics, rawUpdateUserRole } from '@/api/rawBackend'
import { deriveProfile } from '@/lib/profileMapping'
import type { AdminUser } from '@/types/domain'

function accountLabel(profile: ReturnType<typeof deriveProfile>, ownerName: string | null): string {
  if (ownerName) return `Membre : ${ownerName}`
  if (profile === 'pme' || profile === 'industrie') return 'Compte principal'
  return '—'
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const metrics = await rawAdminMetrics()
  return metrics.users.map((u) => {
    const profile = deriveProfile(u.role, u.platform_role)
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      profile,
      status: u.status,
      isSuspended: u.is_suspended,
      isDeleted: u.is_deleted,
      lastLogin: u.last_active,
      provenance: 'telemetrie_systeme' as const,
      platformRole: u.platform_role,
      ownerId: u.owner_id,
      ownerName: u.owner_name,
      accountLabel: accountLabel(profile, u.owner_name),
    }
  })
}

/** Superadmin uniquement — un admin ordinaire reçoit un 403 (voir CLAUDE.md du backend). */
export function promoteUser(targetUserId: string, makeAdmin: boolean) {
  return rawUpdateUserRole(targetUserId, makeAdmin ? 'admin' : null)
}
