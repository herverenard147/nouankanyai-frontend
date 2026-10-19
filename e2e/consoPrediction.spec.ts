import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test, type Page } from '@playwright/test'

/**
 * Correction 7 du test du site (2026-10-18) : Consommation (kWh réels par heure, jour, semaine, mois, en courbes,
 * tarif CIE expliqué) et Prédiction (jours civils, vue Mois). Trois comptes avec 120 jours de relevés horaires
 * (scripts/seed_year.py, jeu « e2e »), captures dans test-results/conso/.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKEND_DIR = path.resolve(__dirname, '../../NouanKanyAI/backend')
const SHOTS = path.resolve(__dirname, '../test-results/conso')
const VIEWPORTS = [
  { name: 'bureau', width: 1440, height: 900 },
  { name: 'telephone', width: 390, height: 844 },
]

function seedAccounts(): Record<string, string> {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'seed-')), 'comptes.txt')
  // 120 jours : deux mois entiers, donc des factures (bimestrielles pour le ménage). Le script finit par son
  // contrôle de qualité, qui peut signaler un écart sans empêcher les comptes d'exister : on lit le fichier.
  const run = spawnSync('.venv/bin/python', ['scripts/seed_year.py', '--invite', 'e2e', '--days', '120', '--replace', '--out', out], {
    cwd: BACKEND_DIR,
    env: { ...process.env, DATABASE_URL: process.env.E2E_DATABASE_URL, JWT_SECRET: 'test-secret' },
    encoding: 'utf-8',
  })
  if (run.status !== 0) console.log(`seed_year : code ${run.status}\n${run.stdout.slice(-2000)}\n${run.stderr.slice(-2000)}`)
  const accounts: Record<string, string> = {}
  for (const line of readFileSync(out, 'utf-8').split('\n')) {
    const m = line.match(/^(\S+@\S+) : (\S+)$/)
    if (m) accounts[m[1]] = m[2]
  }
  return accounts
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL(/\/app\//)
}

test('consommation et prédiction : trois profils, chaque vue', async ({ browser }) => {
  test.setTimeout(25 * 60_000)
  const problems: string[] = []
  const accounts = seedAccounts()
  expect(Object.keys(accounts).length).toBe(3)

  for (const [email, password] of Object.entries(accounts)) {
    const profile = email.split('@')[0].replace('e2e-', '')
    // Un contexte neuf par compte : la session est gardée dans le stockage du navigateur, pas dans un cookie.
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    page.on('pageerror', (error) => problems.push(`${profile} : erreur JavaScript : ${error.message}`))
    page.on('response', (r) => {
      if (r.status() >= 500) problems.push(`${profile} : ${r.status()} sur ${new URL(r.url()).pathname}`)
    })
    await login(page, email, password)
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/app/consommation')
      await expect(page.getByText('Énergie consommée')).toBeVisible({ timeout: 30_000 })
      await expect(page.getByText('Votre tarif CIE')).toBeVisible()
      if (profile === 'industrie') await expect(page.getByText('Heures de pointe').first()).toBeVisible()
      else await expect(page.getByText('Tranche 2')).toBeVisible()
      for (const label of ['Heure', 'Jour', 'Semaine', 'Mois']) {
        await page.getByRole('button', { name: label, exact: true }).click()
        await page.waitForTimeout(1500)
        await page.screenshot({ path: path.join(SHOTS, profile, viewport.name, `conso-${label}.png`), fullPage: true })
      }
      await page.goto('/app/prediction')
      for (const label of ['Heure', 'Jour', 'Mois']) {
        await page.getByRole('button', { name: label, exact: true }).click()
        await page.waitForTimeout(2500)
        await page.screenshot({ path: path.join(SHOTS, profile, viewport.name, `prediction-${label}.png`), fullPage: true })
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      if (overflow > 1) problems.push(`${profile} ${viewport.name} : défilement horizontal de ${overflow} px`)
    }
    await context.close()
  }
  expect(problems, problems.join('\n')).toEqual([])
})
