import { useMutation, useQuery } from '@tanstack/react-query'

import { rawAuditRequests, rawCreateAuditRequest } from '@/api/rawBackend'

export function useCreateAuditRequest() {
  return useMutation({
    mutationFn: rawCreateAuditRequest,
  })
}

export function useAuditRequests() {
  return useQuery({ queryKey: ['audit-requests'], queryFn: rawAuditRequests })
}
