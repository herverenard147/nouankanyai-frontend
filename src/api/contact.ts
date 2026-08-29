import { rawSendContactMessage } from '@/api/rawBackend'

export function sendContactMessage(payload: { nom: string; email: string; message: string }) {
  return rawSendContactMessage(payload)
}
