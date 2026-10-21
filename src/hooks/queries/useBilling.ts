import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  rawAdminApproveTier,
  rawAdminComputeStatement,
  rawAdminMarkPaid,
  rawAdminRecordSubscription,
  rawAdminPendingBills,
  rawAdminRequestProof,
  rawAdminValidateBill,
  rawAdminSaveContract,
  rawAdminTierRequests,
  rawAdminUnpaid,
  rawBilling,
  rawChangeTier,
} from '@/api/rawBackend'
import type { BackendContractPayload, BillingTierId, SubscriptionPaymentPayload } from '@/types/backend'

export const useBilling = () => useQuery({ queryKey: ['billing'], queryFn: rawBilling })
export const useUnpaidStatements = () => useQuery({ queryKey: ['admin-unpaid'], queryFn: rawAdminUnpaid })
export const useTierRequests = () => useQuery({ queryKey: ['admin-tier-requests'], queryFn: rawAdminTierRequests })
export const usePendingBills = () => useQuery({ queryKey: ['admin-pending-bills'], queryFn: rawAdminPendingBills })

/** Validation d'une facture CIE par un admin : elle seule fait entrer la facture dans les relevés. */
export function useValidateBill() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ billId, decision, compteur, note }: { billId: string; decision: 'validee' | 'rejetee'; compteur?: string; note?: string }) =>
      rawAdminValidateBill(billId, decision, compteur, note),
    onSuccess: () => {
      for (const key of ['admin-pending-bills', 'admin-unpaid', 'admin-user-billing', 'compteur']) void client.invalidateQueries({ queryKey: [key] })
    },
  })
}

export function useRequestProof() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ billId, motif }: { billId: string; motif: string }) => rawAdminRequestProof(billId, motif),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['admin-pending-bills'] }),
  })
}

/** Changement d'abonnement immédiat : tout ce qui dépend de la formule se relit (prédictions, alertes, conseils). */
export function useChangeTier() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (tier: BillingTierId) => rawChangeTier(tier),
    onSuccess: () => client.invalidateQueries(),
  })
}

/** Ce que la formule permet maintenant. Sans réponse (chargement, administrateur), tout est permis : le serveur garde le dernier mot. */
export function useAccess() {
  const access = useBilling().data?.access
  return {
    loaded: Boolean(access),
    assistant: access?.assistant_ia ?? true,
    customThresholds: access?.alertes_avancees ?? true,
    anomalies: access?.detection_anomalies ?? true,
    predictions: access?.max_previsions !== 0,
    maxPredictions: access?.max_previsions ?? null,
    predicted: access?.appareils_prevus ?? null,
  }
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
    recordSubscription: useMutation({
      mutationFn: (payload: SubscriptionPaymentPayload) => rawAdminRecordSubscription(userId, payload),
      onSuccess: refresh,
    }),
  }
}
