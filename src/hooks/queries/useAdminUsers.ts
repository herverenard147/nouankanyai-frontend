import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchAdminUsers, promoteUser } from '@/api/adminUsers'
import {
  deleteUser,
  fetchPlatformConsumption,
  fetchPlatformPredictions,
  fetchUserAlerts,
  fetchUserPredictions,
  resetUserMachine,
  resetUserPassword,
  suspendUser,
  updateUserProfile,
  verifyUserMachine,
} from '@/api/adminUserDetail'
import { rawUserFacturation, rawUserMachines } from '@/api/rawBackend'

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin-users'], queryFn: fetchAdminUsers })
}

export function usePromoteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => promoteUser(userId, makeAdmin),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
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

export function useUserPredictions(targetUserId: string | null) {
  return useQuery({
    queryKey: ['admin-user-predictions', targetUserId],
    queryFn: () => fetchUserPredictions(targetUserId as string),
    enabled: Boolean(targetUserId),
  })
}

export function useUserAlerts(targetUserId: string | null) {
  return useQuery({
    queryKey: ['admin-user-alerts', targetUserId],
    queryFn: () => fetchUserAlerts(targetUserId as string),
    enabled: Boolean(targetUserId),
  })
}

export function useAdminPlatformPredictions() {
  return useQuery({ queryKey: ['admin-platform-predictions'], queryFn: fetchPlatformPredictions })
}

export function useAdminPlatformConsumption() {
  return useQuery({ queryKey: ['admin-platform-consumption'], queryFn: fetchPlatformConsumption })
}

/** Action support sur l'équipement d'un utilisateur (vérifier/réinitialiser, depuis une alerte
 * remontée côté Admin) : rafraîchit tout ce qui en dérive, y compris côté plateforme et côté
 * compte du client lui-même si l'admin y navigue ensuite. */
export function useAdminMachineActions() {
  const client = useQueryClient()
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin-platform-predictions'] })
    void client.invalidateQueries({ queryKey: ['admin-platform-consumption'] })
    void client.invalidateQueries({ queryKey: ['alerts-action', 'admin'] })
    void client.invalidateQueries({ queryKey: ['admin-user-predictions'] })
    void client.invalidateQueries({ queryKey: ['admin-user-alerts'] })
  }
  return {
    verify: useMutation({ mutationFn: (machineId: string) => verifyUserMachine(machineId), onSuccess: refresh }),
    reset: useMutation({ mutationFn: (machineId: string) => resetUserMachine(machineId), onSuccess: refresh }),
  }
}

/** Suspendre/réactiver, réinitialiser le mot de passe, modifier le nom, supprimer : les 4
 * actions de la fiche détail utilisateur (Admin). Rafraîchit la liste des comptes après
 * chacune, pour que le statut affiché dans le tableau reste à jour sans recharger la page. */
export function useUserManagementMutations() {
  const client = useQueryClient()
  const refresh = (targetUserId: string) => {
    // ['admin-metrics'] est le cache partagé sous-jacent (voir getCachedAdminMetrics) : sans
    // l'invalider aussi, fetchAdminUsers() rejouerait une donnée périmée (staleTime global) malgré
    // l'invalidation de ['admin-users'], et le statut affiché resterait faux jusqu'à 20 s.
    void client.invalidateQueries({ queryKey: ['admin-metrics'] })
    void client.invalidateQueries({ queryKey: ['admin-users'] })
    void client.invalidateQueries({ queryKey: ['admin-user-machines', targetUserId] })
  }
  return {
    suspend: useMutation({
      mutationFn: ({ userId, suspended }: { userId: string; suspended: boolean }) => suspendUser(userId, suspended),
      onSuccess: (_data, { userId }) => refresh(userId),
    }),
    resetPassword: useMutation({
      mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) => resetUserPassword(userId, newPassword),
    }),
    updateProfile: useMutation({
      mutationFn: ({ userId, nom }: { userId: string; nom: string }) => updateUserProfile(userId, nom),
      onSuccess: (_data, { userId }) => refresh(userId),
    }),
    remove: useMutation({
      mutationFn: (userId: string) => deleteUser(userId),
      onSuccess: (_data, userId) => refresh(userId),
    }),
  }
}
