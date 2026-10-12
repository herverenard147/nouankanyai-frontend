/**
 * Limites de saisie, les mêmes que celles du serveur (`app/schemas/_validators.py` et `main.py`).
 * Le formulaire les applique avant l'envoi : l'utilisateur est prévenu sur le champ, sans aller-retour.
 */
export const LIMITS = {
  name: 200,
  location: 300,
  message: 5000,
  assistantMessage: 4000,
  email: 254,
  phone: 40,
  deliveryContact: 120,
  amountFcfa: 100_000_000_000,
  powerKw: 100_000,
  temperatureMaxC: 1000,
  vibrationMaxHz: 10_000,
  overconsumptionRatio: 100,
  billMonthsAhead: 2,
} as const

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

/** Attributs HTML d'un champ courriel : même règle que le serveur, message d'aide en français. */
export const EMAIL_INPUT = {
  type: 'email',
  maxLength: LIMITS.email,
  pattern: '[^@\\s]+@[^@\\s]+\\.[^@\\s]+',
  title: 'Une adresse email complète, par exemple vous@exemple.com',
} as const

/** Dernier mois accepté pour une facture saisie, au format « AAAA-MM » d'un champ de type mois. */
export function maxBillMonth(today: Date = new Date()): string {
  const limit = new Date(today.getFullYear(), today.getMonth() + LIMITS.billMonthsAhead, 1)
  return `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, '0')}`
}
