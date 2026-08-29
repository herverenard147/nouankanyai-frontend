import { rawJoinWaitlist } from '@/api/rawBackend'

export function joinWaitlist(payload: { email: string; telephone?: string }) {
  return rawJoinWaitlist(payload)
}
