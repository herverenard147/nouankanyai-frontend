import { defineConfig, devices } from '@playwright/test'

/**
 * Tests visuels réels (vrai Chromium), en complément des tests jsdom (vitest).
 * Démarre backend + frontend automatiquement (AI_MODE=mock, base `nouankany_test`
 * dédiée — jamais la base de dev/prod). `reuseExistingServer` : si l'un des deux
 * tourne déjà manuellement sur ces ports, Playwright ne le relance pas.
 */
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
        'DATABASE_URL=postgresql://nouankany:3426199e735f0775f57df638996bce93@localhost:5434/nouankany_test ' +
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
