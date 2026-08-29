import { useMutation } from '@tanstack/react-query'

import { subscribeNewsletter } from '@/api/newsletter'

export function useNewsletterSignup() {
  return useMutation({
    mutationFn: (email: string) => subscribeNewsletter(email),
  })
}
