import { frenchValidityMessage } from '@/lib/validation'

/**
 * Messages de saisie du site à la place des bulles du navigateur (test du site, 2026-10-18 : les formulaires
 * montraient la bulle de Chrome, dans son style et parfois sa langue). Un seul mécanisme pour tous les
 * formulaires : à l'envoi, le premier champ invalide reçoit le focus et un message sous lui, aux couleurs du
 * site ; il disparaît dès qu'on corrige, qu'on fait défiler ou qu'on quitte le champ. Le message est posé dans
 * <body>, hors de l'arbre React : aucun composant n'a à le connaître.
 */
type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

let bubble: HTMLParagraphElement | null = null
let handledThisSubmit = false
let shownAt = 0

function hide() {
  bubble?.remove()
  bubble = null
}

export function messageFor(field: Field): string {
  if (field.validationMessage && field.validity.customError) return field.validationMessage
  if (field instanceof HTMLSelectElement) return field.validity.valueMissing ? 'Choisissez une valeur.' : 'Valeur non valide.'
  return frenchValidityMessage(field)
}

function show(field: Field) {
  hide()
  const rect = field.getBoundingClientRect()
  bubble = document.createElement('p')
  bubble.setAttribute('role', 'alert')
  bubble.dataset.siteValidity = ''
  bubble.textContent = messageFor(field)
  bubble.className = 'fixed z-[70] max-w-xs border border-alert bg-card px-3 py-2 text-sm text-alert shadow-assistant-panel'
  bubble.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - 48)}px`
  bubble.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 328))}px`
  document.body.appendChild(bubble)
  shownAt = Date.now()
}

// Le focus fait défiler la page jusqu'au champ : ce défilement-là ne doit pas cacher le message.
function hideOnScroll() {
  if (Date.now() - shownAt > 400) hide()
}

function onInvalid(event: Event) {
  const field = event.target as Field
  event.preventDefault() // pas de bulle du navigateur
  if (handledThisSubmit) return // seul le premier champ invalide est signalé
  handledThisSubmit = true
  setTimeout(() => {
    handledThisSubmit = false
  }, 0)
  field.scrollIntoView?.({ block: 'center' })
  field.focus({ preventScroll: true })
  show(field)
}

export function installSiteValidity(): void {
  document.addEventListener('invalid', onInvalid, true)
  for (const name of ['input', 'change', 'focusout']) document.addEventListener(name, hide, true)
  document.addEventListener('scroll', hideOnScroll, true)
  window.addEventListener('resize', hide)
}
