import { expect, test } from '@playwright/test'
import {
  addTextElement,
  buildProject,
  expectObjectCount,
  openLeftPanel,
  openSeededProject,
  readObjectCount,
} from './helpers'

/**
 * Template gallery coverage. The editor sidebar ships a curated set of local
 * templates (public/euclid-templates/*.json + .jpeg previews) — unlike the
 * Home gallery, this path is fully offline and functional.
 */
test.describe('templates', () => {
  test.beforeEach(async ({ page }) => {
    await openSeededProject(page, buildProject())
    await openLeftPanel(page, 'template')
  })

  test('lists local templates grouped by orientation', async ({ page }) => {
    await expect(page.getByPlaceholder('Search templates')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Landscape', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Square', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Portrait', exact: true })).toBeVisible()

    // Each item renders a preview thumbnail
    expect(await page.locator('button:has(img)').count()).toBeGreaterThan(20)
  })

  test('filters templates by search term', async ({ page }) => {
    await page.getByPlaceholder('Search templates').fill('pizza')

    await expect(page.locator('button:has(img)')).toHaveCount(1)
    await expect(page.locator('img[alt="Pizza"]')).toBeVisible()
  })

  test('switches the canvas to the Pizza template after confirmation', async ({ page }) => {
    await page.getByPlaceholder('Search templates').fill('pizza')
    await page.locator('img[alt="Pizza"]').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Switch Template')).toBeVisible()
    await expect(dialog).toContainText('cannot be undone')

    await dialog.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(dialog).toBeHidden({ timeout: 45_000 })

    // pizza.json defines a 1080x1080 artboard — the status bar must reflect it
    await expect(page.locator('[data-onboarding="bottom-bar"]')).toContainText('1080×1080 px', {
      timeout: 45_000,
    })
  })

  test('cancelling the switch keeps the current canvas', async ({ page }) => {
    await page.getByPlaceholder('Search templates').fill('pizza')
    await page.locator('img[alt="Pizza"]').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(dialog).toBeHidden()

    await expect(page.locator('[data-onboarding="bottom-bar"]')).toContainText('1920×1080 px')
  })

  test('the editor stays editable after switching templates', async ({ page }) => {
    await page.getByPlaceholder('Search templates').fill('architecture')
    await page.locator('img[alt="Architecture"]').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 45_000 })

    // architecture.json defines a 940x788 artboard
    await expect(page.locator('[data-onboarding="bottom-bar"]')).toContainText('940×788 px', {
      timeout: 45_000,
    })

    // Templates ship with their own objects — assert the delta, not an absolute count
    const before = await readObjectCount(page)
    expect(before).toBeGreaterThan(0)

    await addTextElement(page, 'Body')
    await expectObjectCount(page, before + 1)
  })
})
