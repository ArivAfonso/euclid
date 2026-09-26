import fs from 'node:fs'
import path from 'node:path'
import type { Page, TestInfo } from '@playwright/test'

const SCREENSHOT_ROOT = path.resolve(__dirname, '..', 'screenshots')

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'stage'

/**
 * Visual stage-capture system.
 *
 * Every call writes a numbered PNG to `apps/desktop/e2e/screenshots/<test-title>/`
 * and attaches it to the Playwright HTML report — so running the E2E suite
 * doubles as a browsable visual walkthrough of the app's main stages.
 *
 * Usage inside a test:
 *   const capture = createStageCapture(page, testInfo)
 *   await capture('editor loaded')
 */
export const createStageCapture = (page: Page, testInfo: TestInfo) => {
  const directory = path.join(SCREENSHOT_ROOT, slug(testInfo.title))
  fs.mkdirSync(directory, { recursive: true })

  const captured: string[] = []
  let counter = 0

  const capture = async (name: string) => {
    counter += 1
    const fileName = `${String(counter).padStart(2, '0')}-${slug(name)}.png`

    // Let CSS transitions (sidebar slides for 500ms) and canvas renders settle
    // before taking the shot; `animations: 'disabled'` freezes any leftovers.
    await page.waitForTimeout(600)
    const buffer = await page.screenshot({ animations: 'disabled' })

    fs.writeFileSync(path.join(directory, fileName), buffer)
    captured.push(fileName)
    fs.writeFileSync(
      path.join(directory, 'index.md'),
      [`# ${testInfo.title}`, '', ...captured.map((file) => `- ![${file}](${file})`)].join('\n'),
    )

    await testInfo.attach(name, { body: buffer, contentType: 'image/png' })
    return path.join(directory, fileName)
  }

  return capture
}
