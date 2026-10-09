import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchAdminBoitierDetail, fetchBoitierDetail, fetchBoitierRows } from '@/api/boitiers'
import {
  rawSiteShutdown,
  rawAdminBoitierRequests,
  rawAdminBoitiers,
  rawAdminRevokeBoitier,
  rawAdminSetRequestStatus,
  rawBoitierPrice,
  rawBoitierRequests,
  rawCancelBoitierRequest,
  rawCreateBoitier,
  rawCreateBoitierRequest,
  rawRevokeBoitier,
  rawSetMachineControl,
  rawUpdateBoitier,
} from '@/api/rawBackend'
import type { BackendDeviceCreatePayload, BackendDeviceRequestPayload, BackendDeviceUpdatePayload } from '@/types/backend'

export const useBoitiers = () => useQuery({ queryKey: ['boitiers'], queryFn: fetchBoitierRows })
export const useBoitierDetail = (id: string) =>
  useQuery({
    queryKey: ['boitier', id],
    queryFn: () => fetchBoitierDetail(id),
  })
export const useBoitierRequests = () => useQuery({ queryKey: ['boitier-requests'], queryFn: rawBoitierRequests })
export const useBoitierPrice = () => useQuery({ queryKey: ['boitier-price'], queryFn: rawBoitierPrice })

export const useAdminBoitiers = () => useQuery({ queryKey: ['admin-boitiers'], queryFn: rawAdminBoitiers })
export const useAdminBoitierRequests = () =>
  useQuery({
    queryKey: ['admin-boitier-requests'],
    queryFn: rawAdminBoitierRequests,
  })
export const useAdminBoitierDetail = (id: string) =>
  useQuery({
    queryKey: ['admin-boitier', id],
    queryFn: () => fetchAdminBoitierDetail(id),
  })

/** Chaque action sur un boîtier est tracée dans l'Audit : on le rafraîchit avec la liste. */
function useRefresh() {
  const client = useQueryClient()
  return () => {
    for (const key of ['boitiers', 'boitier', 'boitier-requests', 'admin-boitiers', 'admin-boitier', 'admin-boitier-requests', 'audit', 'machines']) {
      void client.invalidateQueries({ queryKey: [key] })
    }
  }
}

export function useBoitierMutations() {
  const refresh = useRefresh()
  return {
    request: useMutation({
      mutationFn: (payload: BackendDeviceRequestPayload) => rawCreateBoitierRequest(payload),
      onSuccess: refresh,
    }),
    cancelRequest: useMutation({
      mutationFn: (id: string) => rawCancelBoitierRequest(id),
      onSuccess: refresh,
    }),
    createCode: useMutation({
      mutationFn: (payload: BackendDeviceCreatePayload) => rawCreateBoitier(payload),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: BackendDeviceUpdatePayload }) => rawUpdateBoitier(id, payload),
      onSuccess: refresh,
    }),
    revoke: useMutation({
      mutationFn: (id: string) => rawRevokeBoitier(id),
      onSuccess: refresh,
    }),
    setControl: useMutation({
      mutationFn: ({ code, controllable }: { code: string; controllable: boolean }) => rawSetMachineControl(code, controllable),
      onSuccess: refresh,
    }),
    /** Extinction demandée depuis le site : la personne connectée a déjà confirmé dans la modale. */
    shutdown: useMutation({
      mutationFn: ({ deviceId, code }: { deviceId: string; code: string }) => rawSiteShutdown(deviceId, code),
      onSuccess: refresh,
    }),
  }
}

export function useAdminBoitierMutations() {
  const refresh = useRefresh()
  return {
    setDelivered: useMutation({
      mutationFn: ({ id, status }: { id: string; status: 'a_livrer' | 'livre' }) => rawAdminSetRequestStatus(id, status),
      onSuccess: refresh,
    }),
    revoke: useMutation({
      mutationFn: (id: string) => rawAdminRevokeBoitier(id),
      onSuccess: refresh,
    }),
  }
}
