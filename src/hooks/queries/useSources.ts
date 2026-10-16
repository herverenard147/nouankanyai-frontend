import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addMeterPoint,
  createSource,
  deleteMeterPoint,
  fetchAliases,
  fetchFileMapping,
  fetchFiles,
  fetchInstallation,
  fetchInterventionAccounts,
  fetchMeterPoints,
  fetchMeterTemplates,
  fetchSources,
  fetchTechnicianAccess,
  grantTechnicianAccess,
  renewKey,
  retestMeterPoint,
  revokeSource,
  revokeTechnicianAccess,
  saveAliases,
  saveFileMapping,
  uploadFile,
} from '@/api/sources'
import { useInterventionStore } from '@/store/interventionStore'
import type { BackendDeviceCreatePayload, BackendFileMapping, BackendMeterPointCreate, BackendSourceAlias } from '@/types/backend'

/** Les données d'installation dépendent du compte ouvert : le sien, ou celui du client en intervention. */
function useAccountKey() {
  return useInterventionStore((s) => s.accountId) ?? 'moi'
}

export function useSources() {
  const account = useAccountKey()
  return useQuery({ queryKey: ['sources', account], queryFn: fetchSources })
}

export function useInstallation() {
  const account = useAccountKey()
  return useQuery({ queryKey: ['installation', account], queryFn: fetchInstallation })
}

export const useMeterTemplates = () => useQuery({ queryKey: ['meter-templates'], queryFn: fetchMeterTemplates, staleTime: Infinity })

export function useMeterPoints(id: string, enabled: boolean) {
  const account = useAccountKey()
  // Une lecture d'essai arrive de la passerelle à sa prochaine minute : la liste se rafraîchit seule tant qu'un essai est en attente.
  return useQuery({
    queryKey: ['meter-points', account, id],
    queryFn: () => fetchMeterPoints(id),
    enabled,
    refetchInterval: (query) => (query.state.data?.some((p) => p.status === 'a_tester') ? 15_000 : false),
  })
}

export function useAliases(id: string, enabled: boolean) {
  const account = useAccountKey()
  return useQuery({ queryKey: ['aliases', account, id], queryFn: () => fetchAliases(id), enabled })
}

export function useFileMapping(id: string, enabled: boolean) {
  const account = useAccountKey()
  return useQuery({ queryKey: ['file-mapping', account, id], queryFn: () => fetchFileMapping(id), enabled })
}

export function useSourceFiles(id: string, enabled: boolean) {
  const account = useAccountKey()
  return useQuery({ queryKey: ['source-files', account, id], queryFn: () => fetchFiles(id), enabled })
}

export function useSourceMutations(id?: string) {
  const client = useQueryClient()
  const refresh = () => {
    for (const key of ['sources', 'meter-points', 'aliases', 'file-mapping', 'source-files', 'boitiers', 'audit']) {
      void client.invalidateQueries({ queryKey: [key] })
    }
  }
  const need = () => {
    if (!id) throw new Error('source manquante')
    return id
  }
  return {
    create: useMutation({ mutationFn: (payload: BackendDeviceCreatePayload) => createSource(payload), onSuccess: refresh }),
    revoke: useMutation({ mutationFn: () => revokeSource(need()), onSuccess: refresh }),
    addMeter: useMutation({ mutationFn: (payload: BackendMeterPointCreate) => addMeterPoint(need(), payload), onSuccess: refresh }),
    retestMeter: useMutation({ mutationFn: (pointId: string) => retestMeterPoint(need(), pointId), onSuccess: refresh }),
    deleteMeter: useMutation({ mutationFn: (pointId: string) => deleteMeterPoint(need(), pointId), onSuccess: refresh }),
    saveAliases: useMutation({ mutationFn: (items: BackendSourceAlias[]) => saveAliases(need(), items), onSuccess: refresh }),
    renewKey: useMutation({ mutationFn: () => renewKey(need()), onSuccess: refresh }),
    saveMapping: useMutation({
      mutationFn: ({ mapping, columns }: { mapping: BackendFileMapping; columns?: string[] }) => saveFileMapping(need(), mapping, columns),
      onSuccess: refresh,
    }),
    upload: useMutation({ mutationFn: (file: File) => uploadFile(need(), file), onSuccess: refresh }),
  }
}

export const useTechnicianAccess = () => useQuery({ queryKey: ['technician-access'], queryFn: fetchTechnicianAccess })

export function useTechnicianAccessMutations() {
  const client = useQueryClient()
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['technician-access'] })
    void client.invalidateQueries({ queryKey: ['audit'] })
  }
  return {
    grant: useMutation({ mutationFn: ({ days, note }: { days: number; note?: string }) => grantTechnicianAccess(days, note), onSuccess: refresh }),
    revoke: useMutation({ mutationFn: revokeTechnicianAccess, onSuccess: refresh }),
  }
}

export const useInterventionAccounts = () => useQuery({ queryKey: ['intervention-accounts'], queryFn: fetchInterventionAccounts })
