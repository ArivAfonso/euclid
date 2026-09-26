import fs from 'node:fs'
import path from 'node:path'
import { _electron as electron, expect, test, type ElectronApplication } from '@playwright/test'

const appRoot = path.resolve(__dirname, '../..')
const mainEntry = path.join(appRoot, 'out/main/main.js')

const launchApp = (): Promise<ElectronApplication> =>
  electron.launch({
    args: [mainEntry, ...(process.platform === 'linux' ? ['--no-sandbox'] : [])],
    cwd: appRoot,
    env: {
      ...process.env,
      // Renderer dev server managed by the Playwright webServer config
      ELECTRON_RENDERER_URL: 'http://localhost:5174',
    },
  })

test.describe('electron shell', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(mainEntry)) {
      throw new Error(
        `Missing Electron build output at ${mainEntry}. Run "npm run test:e2e:electron" (which builds first).`,
      )
    }
  })

  test('launches a single window with the preload bridge wired up', async () => {
    const app = await launchApp()
    try {
      const page = await app.firstWindow()
      await page.waitForLoadState('domcontentloaded')

      await expect(page.locator('#app')).toBeVisible()

      // Electron uses hash routing because of the file:// protocol
      await expect.poll(() => page.url()).toContain('#/projects')

      const windowCount = await app.evaluate(
        ({ BrowserWindow }) => BrowserWindow.getAllWindows().length,
      )
      expect(windowCount).toBe(1)

      const bridge = await page.evaluate(() => {
        const electronApi = (window as any).electron
        return {
          type: typeof electronApi,
          platform: electronApi?.platform,
          hasWindowApi: typeof electronApi?.window?.minimize === 'function',
          hasMaximizeApi: typeof electronApi?.window?.maximize === 'function',
          hasFsApi: typeof electronApi?.fs?.saveJsonFileDialog === 'function',
          hasUpdaterApi: typeof electronApi?.updater?.getStatus === 'function',
          hasLogApi: typeof electronApi?.log?.info === 'function',
        }
      })

      expect(bridge.type).toBe('object')
      expect(bridge.platform).toBe(process.platform)
      expect(bridge.hasWindowApi).toBe(true)
      expect(bridge.hasMaximizeApi).toBe(true)
      expect(bridge.hasFsApi).toBe(true)
      expect(bridge.hasUpdaterApi).toBe(true)
      expect(bridge.hasLogApi).toBe(true)
    } finally {
      await app.close()
    }
  })

  test('window controls round-trip through IPC', async () => {
    const app = await launchApp()
    try {
      const page = await app.firstWindow()
      await page.waitForLoadState('domcontentloaded')

      await page.evaluate(() => (window as any).electron.window.maximize())

      await expect
        .poll(() =>
          app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isMaximized()),
        )
        .toBe(true)
    } finally {
      await app.close()
    }
  })

  test('reports updater status through the IPC channel', async () => {
    const app = await launchApp()
    try {
      const page = await app.firstWindow()
      await page.waitForLoadState('domcontentloaded')

      const status = await page.evaluate(() => (window as any).electron.updater.getStatus())

      expect(status).toBeDefined()
    } finally {
      await app.close()
    }
  })
})
