import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

/**
 * E2E config for the real animation. A static server hosts the repo root and the
 * vanilla demo (`/demo/`) is exercised in a real Chromium — this is the
 * automated version of the manual CDP checks described in AGENTS.md.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx http-server . -p ${PORT} -c-1 --silent`,
    url: `${BASE_URL}/demo/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
