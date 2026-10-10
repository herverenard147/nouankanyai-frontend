import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

/**
 * Tests visuels réels (vrai Chromium) pour la fonctionnalité machine-par-photo —
 * complète les tests jsdom (vitest) qui ne rendent jamais dans un vrai navigateur.
 * Backend en AI_MODE=mock (voir playwright.config.ts), base `nouankany_test` dédiée.
 */

const API_BASE = 'http://localhost:8001'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_PHOTO = path.join(__dirname, 'fixtures', 'appareil.jpg')

async function signupAndLogin(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext, prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.demo`
  const password = 'demo1234'
  const signup = await request.post(`${API_BASE}/api/auth/signup`, {
    data: { email, password, nom: `${prefix} E2E`, type_compte: 'PME' },
  })
  expect(signup.ok()).toBeTruthy()
  const { token } = await signup.json()

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL(/\/app\//)

  return { email, password, token }
}

test('vignette de la photo visible dans la liste des équipements', async ({ page, request }) => {
  const { token } = await signupAndLogin(page, request, 'photo-liste')
  const photoDataUrl = 'data:image/jpeg;base64,/9j/e2eListeFake=='

  const create = await request.post(`${API_BASE}/api/machines`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { nom: 'Four E2E Liste', power_kw: 1.5, photo_data_url: photoDataUrl },
  })
  expect(create.ok()).toBeTruthy()

  await page.goto('/app/equipements')
  const img = page.locator(`img[src="${photoDataUrl}"]`)
  await expect(img).toBeVisible()
})

test('photo en grand dans la fiche détail au clic sur la ligne', async ({ page, request }) => {
  const { token } = await signupAndLogin(page, request, 'photo-fiche')
  const photoDataUrl = 'data:image/jpeg;base64,/9j/e2eFicheFake=='
  // La fiche détail s'ouvre avec `title = categorie` (pas `nom`, voir EquipmentPage.tsx)
  // — une catégorie unique et explicite est nécessaire pour cibler la bonne ligne et
  // vérifier l'alt-text exact de la grande photo (`Photo : ${title}`).
  const categorie = `CategorieE2EFiche-${Date.now()}`

  const create = await request.post(`${API_BASE}/api/machines`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { nom: 'Four E2E Fiche', power_kw: 1.5, categorie, photo_data_url: photoDataUrl },
  })
  expect(create.ok()).toBeTruthy()

  await page.goto('/app/equipements')
  await page.getByRole('cell', { name: categorie, exact: true }).click()
  const detailPhoto = page.locator(`img[alt="Photo : ${categorie}"]`)
  await expect(detailPhoto).toBeVisible()
  await expect(detailPhoto).toHaveAttribute('src', photoDataUrl)
})

test('flux complet : upload photo -> pré-remplissage -> ajout -> vignette dans la liste', async ({ page, request }) => {
  await signupAndLogin(page, request, 'photo-upload')

  await page.goto('/app/equipements')
  await page.getByRole('button', { name: 'Ajouter un équipement' }).click()
  await page.getByRole('button', { name: 'Ajouter par photo' }).click()

  await page.locator('input[type="file"]').setInputFiles(FIXTURE_PHOTO)

  // Les deux réponses mock possibles (voir MOCK_MACHINE_VISION_RESPONSES, main.py)
  // ont toutes deux un nom_suggere préfixé "[MOCK]" et une catégorie reconnue
  // ("Climatiseur" ou "Compresseur d'air") — le test reste robuste au tirage aléatoire.
  const nomField = page.getByLabel('Nom', { exact: true })
  await expect(nomField).toHaveValue(/\[MOCK\]/, { timeout: 15_000 })
  const categorieField = page.getByLabel('Catégorie', { exact: true })
  await expect(categorieField).toHaveValue(/Climatiseur|Compresseur d'air/)

  const categorieAjoutee = await categorieField.inputValue()
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()

  // La nouvelle ligne apparaît avec sa catégorie extraite ET une vignette (image
  // réelle ou espace réservé, jamais une absence de colonne) — confirme que
  // l'upload a bien atteint l'affichage liste, pas seulement le formulaire.
  const row = page.getByRole('row', { name: new RegExp(categorieAjoutee) })
  await expect(row).toBeVisible({ timeout: 10_000 })
  await expect(row.locator('img, svg').first()).toBeVisible()
})
