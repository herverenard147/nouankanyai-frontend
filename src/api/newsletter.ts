const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Aucun service d'emailing réel n'est branché (ni sur ce frontend, ni exposé par
 * le backend Nouankany) : la capture "bientôt disponible" de la landing reste
 * simulée côté client, comme dans la maquette d'origine.
 */
export async function subscribeNewsletter(email: string): Promise<{ ok: true } | { ok: false; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: 'Adresse email invalide.' }
  }
  return { ok: true }
}
