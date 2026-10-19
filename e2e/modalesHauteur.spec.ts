import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

import { NAV_BY_PROFILE } from '../src/lib/navConfig'

/**
 * Échec de test du 2026-10-18 : le test responsive ne faisait varier que la largeur, et une modale longue
 * dépassait l'écran (titre, × et boutons hors d'atteinte en 1366×570). Ici, sur des écrans BAS, chaque
 * bouton qui ouvre une fenêtre est cliqué sur chaque page, et la fenêtre doit tenir dans l'écran : titre,
 * bouton de fermeture et dernier bouton d'action visibles sans faire défiler la page.
 */

const API_BASE = 'http://localhost:8001'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKEND_DIR = path.resolve(__dirname, '../../NouanKanyAI/backend')
const SHOTS = path.resolve(__dirname, '../test-results/modales')

const VIEWPORTS = [
  { name: 'portable-bas', width: 1366, height: 570 },
  { name: 'telephone-paysage', width: 800, height: 360 },
  { name: 'telephone', width: 390, height: 844 },
]

// Boutons qui ouvrent une fenêtre (jamais une action directe) ; les actions sans retour sont exclues.
const OPENS_DIALOG = /^(\+ )?(Ajouter|Modifier|Nouve|Supprimer|Importer|Créer|Inviter|Changer|Demander|Voir|Détail|Mentions|Confidentialit|Conditions|Rôle|Retirer|Renommer|Saisir|Joindre)/i
const NEVER_CLICK = /définitivement|déconnexion|se déconnecter/i

const TYPE_COMPTE = { menage: 'Particulier', pme: 'PME', industrie: 'Industrie', admin: 'PME' } as const
type ProfileKey = keyof typeof TYPE_COMPTE

async function createAccount(request: APIRequestContext, profile: ProfileKey) {
  const email = `modales-${profile}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.demo`
  const signup = await request.post(`${API_BASE}/api/auth/signup`, {
    data: { email, password: 'demo1234', nom: `Modales ${profile}`, type_compte: TYPE_COMPTE[profile] },
  })
  expect(signup.ok()).toBeTruthy()
  const { token } = await signup.json()
  const headers = { Authorization: `Bearer ${token}` }
  if (profile === 'admin') {
    execSync(`.venv/bin/python scripts/promote_admin.py --email ${email} --role admin`, {
      cwd: BACKEND_DIR,
      env: { ...process.env, DATABASE_URL: process.env.E2E_DATABASE_URL, JWT_SECRET: 'test-secret' },
    })
    return email
  }
  let siteId: string | undefined
  if (profile !== 'menage') {
    const site = await request.post(`${API_BASE}/api/sites`, { headers, data: { nom: 'Site principal', localisation: 'Abidjan' } })
    siteId = (await site.json()).id
  }
  for (const [nom, power] of [['Climatiseur', 1.2], ['Réfrigérateur', 0.2]] as const) {
    await request.post(`${API_BASE}/api/machines`, { headers, data: { nom, power_kw: power, quantite: 1, site_id: siteId } })
  }
  await request.post(`${API_BASE}/api/bills/manual`, { headers, data: { month: '2026-08', amount_xof: 45000, kwh_consumed: 420 } })
  return email
}

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill('demo1234')
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL(/\/app\//)
}

/** Vrai si l'élément est entièrement dans la fenêtre du navigateur. */
async function inViewport(page: Page, selector: ReturnType<Page['locator']>) {
  const box = await selector.boundingBox()
  const size = page.viewportSize()
  if (!box || !size) return false
  return box.y >= -1 && box.x >= -1 && box.y + box.height <= size.height + 1 && box.x + box.width <= size.width + 1
}

for (const profile of ['menage', 'pme', 'industrie', 'admin'] as const) {
  test(`modales ${profile} : tiennent dans un écran bas`, async ({ page, request }) => {
    test.setTimeout(15 * 60_000)
    const problems: string[] = []
    const checked: string[] = []
    const email = await createAccount(request, profile)
    await page.setViewportSize({ width: 1440, height: 900 })
    await login(page, email)

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      for (const entry of NAV_BY_PROFILE[profile]) {
        await page.goto(entry.path)
        await page.waitForLoadState('load')
        await page.waitForTimeout(1000)
        const triggers = page.locator('#main-content button:visible')
        const count = await triggers.count()
        const names: string[] = []
        for (let i = 0; i < count; i += 1) {
          const name = ((await triggers.nth(i).innerText().catch(() => '')) || (await triggers.nth(i).getAttribute('aria-label')) || '').trim()
          if (OPENS_DIALOG.test(name) && !NEVER_CLICK.test(name) && !names.includes(name)) names.push(name)
        }
        for (const name of names) {
          const where = `${profile} ${viewport.name} ${entry.path} « ${name} »`
          const button = page.locator('#main-content button:visible', { hasText: name }).first()
          if (!(await button.isEnabled().catch(() => false))) continue
          await button.scrollIntoViewIfNeeded().catch(() => {})
          await button.click().catch(() => {})
          const dialog = page.getByRole('dialog').last()
          if (!(await dialog.isVisible({ timeout: 1500 }).catch(() => false))) continue
          checked.push(where)
          const title = dialog.getByRole('heading').first()
          const close = dialog.getByRole('button', { name: /fermer/i }).last()
          const actions = dialog.locator('button:visible')
          const lastAction = actions.nth((await actions.count()) - 1)
          if (!(await inViewport(page, dialog))) problems.push(`${where} : la fenêtre dépasse l'écran`)
          if ((await title.count()) && !(await inViewport(page, title))) problems.push(`${where} : titre hors de l'écran`)
          if ((await close.count()) && !(await inViewport(page, close))) problems.push(`${where} : bouton de fermeture hors de l'écran`)
          if (!(await inViewport(page, lastAction))) problems.push(`${where} : bouton d'action hors de l'écran`)
          await page.screenshot({ path: path.join(SHOTS, profile, viewport.name, `${entry.path.replace(/\//g, '_')}_${name.replace(/[^\p{L}\d]+/gu, '-')}.png`) })
          await page.keyboard.press('Escape')
          if (await dialog.isVisible().catch(() => false)) await close.click().catch(() => {})
          await page.waitForTimeout(200)
        }
      }
    }
    console.log(`${profile} : ${checked.length} fenêtres contrôlées`)
    expect(problems, problems.join('\n')).toEqual([])
  })
}
