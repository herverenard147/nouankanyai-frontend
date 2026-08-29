import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchAdminUsers, promoteUser } from '@/api/adminUsers'
import { rawUserFacturation, rawUserMachines } from '@/api/rawBackend'

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin-users'], queryFn: fetchAdminUsers })
}

export function usePromoteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => promoteUser(userId, makeAdmin),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useUserMachines(targetUserId: string | null) {
  return useQuery({
    queryKey: ['admin-user-machines', targetUserId],
    queryFn: () => rawUserMachines(targetUserId as string),
    enabled: Boolean(targetUserId),
  })
}

export function useUserFacturation(targetUserId: string | null) {
  return useQuery({
    queryKey: ['admin-user-facturation', targetUserId],
    queryFn: () => rawUserFacturation(targetUserId as string),
    enabled: Boolean(targetUserId),
  })
}
