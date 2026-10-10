import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addManualInvoice,
  attachInvoicePhoto,
  confirmInvoiceActual,
  deleteInvoice,
  fetchInvoicePhoto,
  fetchInvoices,
  updateInvoice,
  generateForecastInvoice,
  uploadInvoicePhoto,
} from '@/api/invoices'
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

export function useAttachInvoicePhoto(profile: Profile) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ billId, file }: { billId: string; file: File }) => attachInvoicePhoto(billId, file),
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

export function useUpdateInvoice(profile: Profile) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ billId, payload }: { billId: string; payload: { month?: string; amountXof?: number; kwhConsumed?: number } }) =>
      updateInvoice(billId, payload),
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

export function useUploadInvoicePhoto(profile: Profile) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadInvoicePhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices', profile] }),
  })
}

/** Récupération à la demande (ouverture de la modale "Voir plus"), pas au
 * chargement de la liste — voir GET /api/bills/{id}/photo côté backend. */
export function useInvoicePhoto(billId: string | null) {
  return useQuery({
    queryKey: ['invoice-photo', billId],
    queryFn: () => fetchInvoicePhoto(billId!),
    enabled: billId !== null,
  })
}
