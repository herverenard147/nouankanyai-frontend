import { joinWaitlist } from '@/api/waitlist'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Inscription « Être informé » de la landing : enregistrée pour de vrai dans la liste
 * d'attente du backend (POST /api/v1/waitlist, idempotente sur l'email), consultable
 * par les administrateurs. Avant, elle était simulée côté client et rien n'était gardé.
 */
export async function subscribeNewsletter(email: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = email.trim()
  if (!EMAIL_RE.test(trimmed)) {
    return { ok: false, message: 'Adresse email invalide.' }
  }
  try {
    await joinWaitlist({ email: trimmed })
    return { ok: true }
  } catch {
    return { ok: false, message: 'Inscription impossible pour le moment. Réessayez dans quelques instants.' }
  }
}
