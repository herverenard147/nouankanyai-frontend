import { useQuery } from '@tanstack/react-query'

import { fetchMe } from '@/api/authMe'
import { useSessionStore } from '@/store/sessionStore'

export function useAuthMe() {
  const hasSession = useSessionStore((s) => Boolean(s.session))
  return useQuery({ queryKey: ['auth-me'], queryFn: fetchMe, enabled: hasSession })
}
