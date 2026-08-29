import { useMutation } from '@tanstack/react-query'

import { sendContactMessage } from '@/api/contact'

export function useSendContactMessage() {
  return useMutation({
    mutationFn: sendContactMessage,
  })
}
