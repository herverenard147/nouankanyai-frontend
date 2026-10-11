import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { changePassword, fetchMe, updateMe } from '@/api/authMe'
import { useSessionStore } from '@/store/sessionStore'

export function useAuthMe() {
  const hasSession = useSessionStore((s) => Boolean(s.session))
  return useQuery({ queryKey: ['auth-me'], queryFn: fetchMe, enabled: hasSession })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setDisplayName = useSessionStore((s) => s.setDisplayName)
  return useMutation({
    mutationFn: updateMe,
    onSuccess: (user) => {
      setDisplayName(user.nom)
      queryClient.setQueryData(['auth-me'], user)
    },
  })
}

export function useChangePassword() {
  // Le serveur ferme toutes les sessions et renvoie une nouvelle paire de jetons pour celle-ci (Volet 5).
  return useMutation({
    mutationFn: changePassword,
    onSuccess: (result) => {
      if (result.token) useSessionStore.getState().setTokens(result.token, result.refresh_token)
    },
  })
}
