import { useMutation, useQuery } from '@tanstack/react-query'

import { fetchAssistantContext, sendAssistantMessage } from '@/api/assistant'
import type { Profile } from '@/types/domain'

export function useAssistantContext(profile: Profile) {
  return useQuery({ queryKey: ['assistant-context', profile], queryFn: () => fetchAssistantContext(profile) })
}

export function useAssistantReply(profile: Profile) {
  return useMutation({
    mutationFn: (message: string) => sendAssistantMessage(profile, message),
  })
}
