import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

import { NAV_BY_PROFILE } from '../src/lib/navConfig'

/**
 * Parcours visuel de CHAQUE entrée du menu, pour chaque type de compte, à quatre largeurs
 * (téléphone, tablette, bureau, grand écran). Demandé par le propriétaire le 2026-10-11.
 *
 * À chaque page : aucune erreur JavaScript, aucune réponse 5xx, pas de défilement horizontal,
 * barre latérale collée au bord gauche sur bureau, et une capture d'écran dans test-results/.
 */

const API_BASE = 'http://localhost:8001'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKEND_DIR = path.resolve(__dirname, '../../NouanKanyAI/backend')
const SHOTS = path.resolve(__dirname, '../test-results/parcours')

const VIEWPORTS = [
  { name: 'telephone', width: 390, height: 844 },
  { name: 'tablette', width: 1024, height: 768 },
  { name: 'bureau', width: 1440, height: 900 },
  { name: 'grand-ecran', width: 1920, height: 1080 },
]

const TYPE_COMPTE = { menage: 'Particulier', pme: 'PME', industrie: 'Industrie', admin: 'PME' } as const
type ProfileKey = keyof typeof TYPE_COMPTE

async function createAccount(request: APIRequestContext, profile: ProfileKey) {
  const email = `parcours-${profile}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.demo`
  const signup = await request.post(`${API_BASE}/api/auth/signup`, {
    data: { email, password: 'demo1234', nom: `Parcours ${profile}`, type_compte: TYPE_COMPTE[profile] },
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
  // Un peu de contenu : un site (PME, Industrie) et deux appareils.
  let siteId: string | undefined
  if (profile !== 'menage') {
    const site = await request.post(`${API_BASE}/api/sites`, { headers, data: { nom: 'Site principal', localisation: 'Abidjan' } })
    siteId = (await site.json()).id
  }
  for (const [nom, power] of [['Climatiseur', 1.2], ['Réfrigérateur', 0.2]] as const) {
    await request.post(`${API_BASE}/api/machines`, { headers, data: { nom, power_kw: power, quantite: 1, site_id: siteId } })
  }
  return email
}

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill('demo1234')
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL(/\/app\//)
}

for (const profile of ['menage', 'pme', 'industrie', 'admin'] as const) {
  test(`parcours ${profile} : chaque menu, à chaque largeur`, async ({ page, request }) => {
    test.setTimeout(10 * 60_000)
    const problems: string[] = []
    let where = ''
    page.on('pageerror', (error) => problems.push(`${where} : erreur JavaScript : ${error.message}`))
    page.on('response', (response) => {
      if (response.status() >= 500) problems.push(`${where} : ${response.status()} sur ${new URL(response.url()).pathname}`)
    })

    const email = await createAccount(request, profile)
    await page.setViewportSize({ width: 1440, height: 900 })
    await login(page, email)

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      for (const entry of NAV_BY_PROFILE[profile]) {
        where = `${profile} ${viewport.name} ${entry.path}`
        await page.goto(entry.path)
        // Pas de « networkidle » : certaines pages interrogent le serveur à intervalle régulier.
        await page.waitForLoadState('load')
        await page.waitForTimeout(1200)
        // La page demandée s'affiche (pas de renvoi vers une autre : le menu ne propose rien d'interdit).
        expect(new URL(page.url()).pathname, where).toBe(entry.path)
        await expect(page.locator('#main-content'), where).toBeVisible()

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        if (overflow > 1) problems.push(`${where} : défilement horizontal de ${overflow} px`)

        if (viewport.width >= 1024) {
          const left = await page.locator('aside').first().evaluate((el) => el.getBoundingClientRect().left)
          if (left !== 0) problems.push(`${where} : barre latérale à ${left} px du bord gauche`)
        }
        await page.screenshot({ path: path.join(SHOTS, profile, viewport.name, `${entry.path.replace(/\//g, '_')}.png`), fullPage: true })
      }
    }
    expect(problems, problems.join('\n')).toEqual([])
  })
}
