import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addManualInvoice, confirmInvoiceActual, deleteInvoice, fetchInvoices, generateForecastInvoice } from '@/api/invoices'
import type { Profile } from '@/types/domain'

export function useInvoices(profile: Profile) {
  return useQuery({ queryKey: ['invoices', profile], queryFn: () => fetchInvoices(profile) })
}

export function useGenerateForecastInvoice(profile: Profile) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateForecastInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices', profile] }),
  })
}

export function useAddManualInvoice(profile: Profile) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addManualInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices', profile] }),
  })
}

export function useConfirmInvoiceActual(profile: Profile) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ billId, actualAmountXof }: { billId: string; actualAmountXof: number }) =>
      confirmInvoiceActual(billId, actualAmountXof),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices', profile] }),
  })
}

export function useDeleteInvoice(profile: Profile) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices', profile] }),
  })
}
