import { expect, test } from '@playwright/test'
import {
  addBarcode,
  addLine,
  addLogoImage,
  addShape,
  addTextElement,
  buildProject,
  clearCanvasSelection,
  expectObjectCount,
  openLeftPanel,
  openSeededProject,
  readObjectCount,
  seedAppState,
  waitForEditor,
} from './helpers'
import { createStageCapture } from './screenshots'

/**
 * Visual walkthrough — every test here captures numbered screenshots of the
 * app's "main stages" into `e2e/screenshots/<test>/` and attaches them to the
 * Playwright HTML report. Run `npm run test:e2e:visual` to produce just these.
 */
test.describe('visual tour', () => {
  test('main stages: dashboard, editor chrome & panels', async ({ page }, testInfo) => {
    const capture = createStageCapture(page, testInfo)

    // ── Projects dashboard ──────────────────────────────────────
    await seedAppState(page)
    await page.goto('/projects')
    await expect(page.getByText('No projects found')).toBeVisible()
    await capture('projects — empty state')

    await page.locator('[data-onboarding="new-project-btn"]:visible').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await capture('projects — new project dialog')
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()

    // ── Editor with a seeded project ────────────────────────────
    const project = buildProject({ name: 'Visual Tour' })
    await openSeededProject(page, project)
    await capture('editor — default view')

    const panels = [
      ['editor', 'editor tools (text & components)'],
      ['layer', 'layers'],
      ['pages', 'pages'],
      ['template', 'template gallery'],
      ['material', 'shapes & lines'],
      ['text', 'text styles'],
      ['image', 'images & logos'],
      ['uploads', 'uploads'],
    ] as const

    for (const [key, label] of panels) {
      await openLeftPanel(page, key)
      await capture(`sidebar — ${label}`)
    }

    // ── Right side: canvas style, export, settings ──────────────
    await clearCanvasSelection(page)
    await capture('right panel — canvas size & background')

    await page.getByRole('button', { name: 'Download', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Export Image' })).toBeVisible()
    await capture('right panel — export popover')
    await clearCanvasSelection(page)

    await page.locator('[data-onboarding="left-sidebar"] button').last().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await capture('settings modal — general')

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('tab', { name: 'Canvas' }).click()
    await capture('settings modal — canvas preferences')

    // ── Dark mode ──────────────────────────────────────────────
    await dialog.getByRole('tab', { name: 'General' }).click()
    await dialog.getByRole('switch').first().click()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
    await capture('editor — dark mode')
  })

  test('main stages: creating every element type', async ({ page }, testInfo) => {
    // Start from a NEW project created through the UI (not a seeded one):
    // seedAppState's addInitScript re-runs on every navigation, which would
    // overwrite a saved project on reload and break the persistence stage below.
    await seedAppState(page)
    await page.goto('/editor?name=Element%20Tour')
    await waitForEditor(page)

    const capture = createStageCapture(page, testInfo)

    await capture('empty canvas')

    // ── Text ────────────────────────────────────────────────────
    await addTextElement(page, 'Title')
    await expectObjectCount(page, 1)
    await capture('text — title element & typography panel')

    // ── Shape ───────────────────────────────────────────────────
    await addShape(page, 'Rectangle', 0)
    await expectObjectCount(page, 2)
    await capture('shape — square & fill/border/effects panel')

    // ── Line ────────────────────────────────────────────────────
    await addLine(page, 'Straight', 2)
    await expectObjectCount(page, 3)
    await capture('line — arrow line & line style panel')

    // ── QR code ─────────────────────────────────────────────────
    await openLeftPanel(page, 'editor')
    await page.getByRole('button', { name: 'QR Code', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await capture('qr code — generator dialog')
    await page.getByRole('dialog').getByPlaceholder('Enter URL or text').fill('https://euclid.app')
    await page.getByRole('dialog').getByRole('button', { name: 'Generate' }).click()
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 30_000 })
    await expectObjectCount(page, 4)
    await capture('qr code — element & style panel')

    // ── Math (KaTeX) ────────────────────────────────────────────
    await openLeftPanel(page, 'editor')
    await page.getByRole('button', { name: 'Math', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await capture('math — latex editor dialog')
    await page
      .getByRole('dialog')
      .getByPlaceholder('E = mc^2', { exact: true })
      .fill('\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}')
    await page.getByRole('dialog').getByRole('button', { name: 'Insert Formula' }).click()
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 45_000 })
    await expectObjectCount(page, 5)
    await capture('math — rendered formula & panel')

    // ── Barcode ─────────────────────────────────────────────────
    await addBarcode(page)
    await expectObjectCount(page, 6)
    await capture('barcode — element & panel')

    // ── Image (offline logo gallery) ────────────────────────────
    // NOTE: logos are added straight to the fabric canvas, so the template
    // object counter stays at 6 (see the KNOWN ISSUE test in elements.spec.ts).
    await addLogoImage(page)
    await expectObjectCount(page, 6)
    await capture('image — logo element & effects panel')

    // ── Overviews ───────────────────────────────────────────────
    await openLeftPanel(page, 'layer')
    await capture('layers — every element type')

    // Close the sidebar, then deselect using the BOTTOM-LEFT corner: sonner
    // toasts persist over the bottom-right corner and swallow the click.
    await page.locator('#left-tabs-layer').click()
    await clearCanvasSelection(page, 'bottom-left')
    await capture('canvas — all element types together')

    // ── Persistence ─────────────────────────────────────────────
    await page.evaluate(() => (window as any).__euclidSave?.())

    // The project is restored asynchronously (fonts + render), so poll for it
    await page.reload()
    await waitForEditor(page)
    await expect
      .poll(() => readObjectCount(page), {
        message: 'elements should be restored after reload',
        timeout: 30_000,
      })
      .toBeGreaterThanOrEqual(6)

    await capture('canvas — elements restored after reload')
  })
})
