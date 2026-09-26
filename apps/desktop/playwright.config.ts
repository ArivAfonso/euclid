import { defineConfig, devices } from '@playwright/test'

const WEB_PORT = 5174
const webURL = `http://localhost:${WEB_PORT}`

/**
 * Playwright E2E configuration.
 *
 * Two projects:
 *  - `web`      → runs the renderer in Chromium against the Vite dev server
 *                 (`npm run test:e2e`)
 *  - `electron` → launches the real Electron app (main + preload must be built
 *                 first: `npm run test:e2e:electron`)
 *
 * Both share the same dev server started below. The Electron main process is
 * pointed at it via the ELECTRON_RENDERER_URL env var.
 */
export default defineConfig({
  testDir: './e2e',
  // The renderer is served by Vite in dev mode — first paint of the editor can
  // be slow while dependencies are being transformed, so keep generous budgets.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: process.env.CI ? 1 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: webURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'web',
      testDir: './e2e/web',
      use: { ...devices['Desktop Chrome'], baseURL: webURL },
    },
    {
      name: 'electron',
      testDir: './e2e/electron',
    },
  ],

  webServer: {
    command: 'npm run dev:web',
    cwd: __dirname,
    url: webURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
