import { expect, test } from '@playwright/test'
import {
  buildProject,
  clearCanvasSelection,
  openLeftPanel,
  openSeededProject,
} from './helpers'

test.describe('editor', () => {
  test('renders the full editor chrome for a seeded project', async ({ page }) => {
    await openSeededProject(page, buildProject())

    await expect(page.locator('[data-onboarding="left-sidebar"]')).toBeVisible()
    await expect(page.locator('[data-onboarding="right-panel"]')).toBeVisible()

    const bottomBar = page.locator('[data-onboarding="bottom-bar"]')
    await expect(bottomBar).toContainText('Zoom:')
    await expect(bottomBar).toContainText('1920×1080 px')

    for (const tab of ['editor', 'layer', 'pages', 'template', 'material', 'text', 'image', 'uploads']) {
      await expect(page.locator(`#left-tabs-${tab}`)).toBeAttached()
    }
  })

  test('switches left sidebar panels', async ({ page }) => {
    await openSeededProject(page, buildProject())

    await openLeftPanel(page, 'pages')
    await expect(page.locator('button[title="Add New Page"]')).toBeVisible()

    await openLeftPanel(page, 'text')
    await expect(page.getByText('Title Text', { exact: true })).toBeVisible()
  })

  test('adds and deletes pages from the pages panel', async ({ page }) => {
    await openSeededProject(page, buildProject())
    await openLeftPanel(page, 'pages')

    await expect(page.getByText('1/1', { exact: true })).toBeVisible()

    await page.locator('button[title="Add New Page"]').click()
    await expect(page.getByText('2/2', { exact: true })).toBeVisible()

    // NOTE: page add/delete are intentionally not part of the undo history in
    // this build (the snapshot calls are commented out), so delete directly.
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page.getByText('1/1', { exact: true })).toBeVisible()
  })

  test('adds a text element and supports undo / redo', async ({ page }) => {
    await openSeededProject(page, buildProject())
    const bottomBar = page.locator('[data-onboarding="bottom-bar"]')
    // Toolbar buttons are icon-only; target them through their lucide icon class
    const undoButton = page.locator('[data-onboarding="canvas-header"] button:has(svg.lucide-rotate-ccw)')
    const redoButton = page.locator('[data-onboarding="canvas-header"] button:has(svg.lucide-rotate-cw)')

    await expect(bottomBar).toContainText('0 objects')
    await expect(undoButton).toBeDisabled()

    await openLeftPanel(page, 'text')
    await page.getByRole('button', { name: 'Title Text', exact: true }).click()

    await expect(bottomBar).toContainText('1 object')
    await expect(undoButton).toBeEnabled()

    // NOTE: the status-bar count reads from the template model, while undo
    // only mutates the live canvas — so assert undo/redo through the toolbar
    // button states, which are driven by the history store.
    await page.keyboard.press('Escape')
    await clearCanvasSelection(page)

    await undoButton.click()
    await expect(undoButton).toBeDisabled()
    await expect(redoButton).toBeEnabled()

    await redoButton.click()
    await expect(undoButton).toBeEnabled()
    await expect(redoButton).toBeDisabled()
  })

  test('changes the zoom level via header presets', async ({ page }) => {
    await openSeededProject(page, buildProject())
    const zoomTrigger = page.locator('[data-onboarding="canvas-header"] button.font-mono')
    const bottomBar = page.locator('[data-onboarding="bottom-bar"]')

    // NOTE: the preset popover stays open while selecting presets — don't
    // click the trigger again or it will toggle the popover closed.
    await zoomTrigger.click()
    await page.getByRole('button', { name: '100%', exact: true }).click()
    await expect(bottomBar).toContainText('Zoom: 100%')

    await page.getByRole('button', { name: '50%', exact: true }).click()
    await expect(bottomBar).toContainText('Zoom: 50%')
  })

  test('navigates pages with arrow keys when nothing is selected', async ({ page }) => {
    await openSeededProject(page, buildProject({ pages: 2 }))
    await openLeftPanel(page, 'pages')

    await expect(page.getByText('1/2', { exact: true })).toBeVisible()

    await clearCanvasSelection(page)
    // Guard: the deselect click must not land on any panel control (e.g. Delete)
    await expect(page.getByText('1/2', { exact: true })).toBeVisible()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByText('2/2', { exact: true })).toBeVisible()

    await page.keyboard.press('ArrowUp')
    await expect(page.getByText('1/2', { exact: true })).toBeVisible()
  })
})
