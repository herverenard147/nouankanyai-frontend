import { defineConfig, devices } from '@playwright/test'

/**
 * Tests visuels réels (vrai Chromium), en complément des tests jsdom (vitest).
 * Démarre backend + frontend automatiquement (AI_MODE=mock, base `nouankany_test`
 * dédiée — jamais la base de dev/prod). `reuseExistingServer` : si l'un des deux
 * tourne déjà manuellement sur ces ports, Playwright ne le relance pas.
 *
 * L'URL de la base de test vient de E2E_DATABASE_URL (voir .env.example) : pas de
 * mot de passe dans un fichier versionné.
 */
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
if (!e2eDatabaseUrl) {
  throw new Error(
    'E2E_DATABASE_URL manquant : exportez l’URL de la base de test dédiée (jamais dev/prod), voir .env.example.',
  )
}
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command:
        'cd "../NouanKanyAI/backend" && ' +
        'JWT_SECRET=test-secret AI_MODE=mock PORT=8001 ' +
        `DATABASE_URL='${e2eDatabaseUrl}' ` +
        '.venv/bin/python main.py',
      url: 'http://localhost:8001/docs',
      timeout: 60_000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      timeout: 60_000,
      reuseExistingServer: true,
    },
  ],
})
