import { useMutation } from '@tanstack/react-query'

import { joinWaitlist } from '@/api/waitlist'

export function useJoinWaitlist() {
  return useMutation({
    mutationFn: joinWaitlist,
  })
}
