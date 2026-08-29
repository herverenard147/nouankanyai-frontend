import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTeamMember, deleteTeamMember, fetchTeamMembers } from '@/api/team'

export function useTeamMembers() {
  return useQuery({ queryKey: ['team-members'], queryFn: fetchTeamMembers })
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  })
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  })
}
