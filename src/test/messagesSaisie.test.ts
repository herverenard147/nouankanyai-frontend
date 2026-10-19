import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { installSiteValidity } from '@/lib/siteValidity'

/** Test du site du 2026-10-18 : bulles du navigateur au lieu des messages du site. */
describe('Messages de saisie du site', () => {
  beforeAll(() => installSiteValidity())
  afterEach(async () => {
    document.body.innerHTML = ''
    await new Promise((resolve) => setTimeout(resolve, 0)) // un envoi de formulaire par test
  })

  function form(html: string) {
    document.body.innerHTML = `<form>${html}<button type="submit">Envoyer</button></form>`
    return document.querySelector('form') as HTMLFormElement
  }

  it('signale le premier champ invalide sous le champ, sans bulle du navigateur', () => {
    const f = form('<input name="nom" required /><input name="email" type="email" required />')
    const nom = f.querySelector('input[name="nom"]') as HTMLInputElement
    const event = new Event('invalid', { cancelable: true })
    nom.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    const bulles = document.querySelectorAll('[data-site-validity]')
    expect(bulles).toHaveLength(1)
    expect(bulles[0].textContent).toBe('Ce champ est obligatoire.')
    expect(document.activeElement).toBe(nom)
  })

  it('le message disparaît dès que l’on corrige', () => {
    const f = form('<select name="s" required><option value="">--</option><option>A</option></select>')
    const select = f.querySelector('select') as HTMLSelectElement
    select.dispatchEvent(new Event('invalid', { cancelable: true }))
    expect(document.querySelector('[data-site-validity]')?.textContent).toBe('Choisissez une valeur.')
    select.dispatchEvent(new Event('change', { bubbles: true }))
    expect(document.querySelector('[data-site-validity]')).toBeNull()
  })
})
