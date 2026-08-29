import { useQuery } from '@tanstack/react-query'

import { fetchFacturation } from '@/api/facturation'

export function useFacturation() {
  return useQuery({ queryKey: ['facturation'], queryFn: fetchFacturation })
}
