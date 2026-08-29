import { rawCreateTeamMember, rawDeleteTeamMember, rawTeamMembers } from '@/api/rawBackend'
import type { TeamMember } from '@/types/domain'

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const members = await rawTeamMembers()
  return members.map((m) => ({
    id: m.id,
    nom: m.nom,
    email: m.email,
    isOwner: m.is_owner,
    createdAt: m.created_at,
    lastSignInAt: m.last_sign_in_at,
  }))
}

export function createTeamMember(payload: { nom: string; email: string; password: string }) {
  return rawCreateTeamMember(payload)
}

export function deleteTeamMember(memberId: string) {
  return rawDeleteTeamMember(memberId)
}
