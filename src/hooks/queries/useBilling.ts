import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  rawAdminApproveTier,
  rawAdminComputeStatement,
  rawAdminMarkPaid,
  rawAdminPendingBills,
  rawAdminValidateBill,
  rawAdminSaveContract,
  rawAdminTierRequests,
  rawAdminUnpaid,
  rawBilling,
  rawRequestTier,
} from '@/api/rawBackend'
import type { BackendContractPayload, BillingTierId } from '@/types/backend'

export const useBilling = () => useQuery({ queryKey: ['billing'], queryFn: rawBilling })
export const useUnpaidStatements = () => useQuery({ queryKey: ['admin-unpaid'], queryFn: rawAdminUnpaid })
export const useTierRequests = () => useQuery({ queryKey: ['admin-tier-requests'], queryFn: rawAdminTierRequests })
export const usePendingBills = () => useQuery({ queryKey: ['admin-pending-bills'], queryFn: rawAdminPendingBills })

/** Validation d'une facture CIE par un admin : elle seule fait entrer la facture dans les relevés. */
export function useValidateBill() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ billId, decision }: { billId: string; decision: 'validee' | 'rejetee' }) => rawAdminValidateBill(billId, decision),
    onSuccess: () => {
      for (const key of ['admin-pending-bills', 'admin-unpaid', 'admin-user-billing']) void client.invalidateQueries({ queryKey: [key] })
    },
  })
}

export function useRequestTier() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (tier: BillingTierId) => rawRequestTier(tier),
    onSuccess: () => client.invalidateQueries({ queryKey: ['billing'] }),
  })
}

/** Actions admin sur la facturation d'un compte : tout rafraîchit la fiche, les impayés et les demandes. */
export function useAdminBillingMutations(userId: string) {
  const client = useQueryClient()
  const refresh = () => {
    for (const key of ['admin-user-billing', 'admin-unpaid', 'admin-tier-requests']) void client.invalidateQueries({ queryKey: [key] })
  }
  return {
    saveContract: useMutation({ mutationFn: (payload: BackendContractPayload) => rawAdminSaveContract(userId, payload), onSuccess: refresh }),
    approveTier: useMutation({ mutationFn: () => rawAdminApproveTier(userId), onSuccess: refresh }),
    compute: useMutation({ mutationFn: (month: string) => rawAdminComputeStatement(userId, month), onSuccess: refresh }),
    markPaid: useMutation({ mutationFn: (statementId: string) => rawAdminMarkPaid(statementId), onSuccess: refresh }),
  }
}
