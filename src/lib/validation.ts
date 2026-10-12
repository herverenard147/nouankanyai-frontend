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

type Validatable = HTMLInputElement | HTMLTextAreaElement

/** Message d'un champ invalide, écrit par nous : le navigateur affichait le sien, dans sa langue. */
export function frenchValidityMessage(field: Validatable): string {
  const v = field.validity
  const number = (value: string) => Number(value).toLocaleString('fr-FR')
  if (v.valueMissing) return 'Ce champ est obligatoire.'
  if (v.typeMismatch || v.patternMismatch) {
    return field.type === 'email' ? 'Entrez une adresse email complète, par exemple vous@exemple.com.' : 'Le format de cette valeur n’est pas reconnu.'
  }
  if (v.tooLong) return `${number(String(field.maxLength))} caractères au plus.`
  if (v.tooShort) return `${number(String(field.minLength))} caractères au moins.`
  if (field instanceof HTMLInputElement) {
    if (v.rangeUnderflow) return field.type === 'month' ? 'Ce mois est trop ancien.' : `La valeur doit être au moins ${number(field.min)}.`
    if (v.rangeOverflow) return field.type === 'month' ? 'Ce mois est trop loin dans le futur.' : `La valeur doit être au plus ${number(field.max)}.`
    if (v.stepMismatch || v.badInput) return 'Entrez un nombre valide.'
  }
  return ''
}

/** À poser sur un champ : remplace la bulle du navigateur par notre message, effacé dès la saisie. */
export const FRENCH_VALIDITY = {
  onInvalid: (event: { currentTarget: Validatable }) => {
    event.currentTarget.setCustomValidity('')
    event.currentTarget.setCustomValidity(frenchValidityMessage(event.currentTarget))
  },
  onInput: (event: { currentTarget: Validatable }) => event.currentTarget.setCustomValidity(''),
}
