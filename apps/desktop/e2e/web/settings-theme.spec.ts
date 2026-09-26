import { expect, test } from '@playwright/test'
import { buildProject, openSeededProject, waitForEditor } from './helpers'

const openSettings = async (page: import('@playwright/test').Page) => {
  // The gear button is the last button in the left rail
  await page.locator('[data-onboarding="left-sidebar"] button').last().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe('settings & theme', () => {
  test('toggles dark mode from the editor settings modal', async ({ page }) => {
    await openSeededProject(page, buildProject())
    const dialog = await openSettings(page)

    await dialog.getByRole('switch').first().click()

    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
  })

  test('persists the theme across a reload', async ({ page }) => {
    await openSeededProject(page, buildProject())
    const dialog = await openSettings(page)

    await dialog.getByRole('switch').first().click()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()

    await page.reload()
    await waitForEditor(page)

    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true)
  })

  test('exposes canvas preferences in the settings modal', async ({ page }) => {
    await openSeededProject(page, buildProject())
    const dialog = await openSettings(page)

    await dialog.getByRole('tab', { name: 'Canvas' }).click()

    await expect(dialog.getByText('Measurement Unit')).toBeVisible()
    await expect(dialog.getByText('Show Grid')).toBeVisible()
    await expect(dialog.getByText('Snap to Grid')).toBeVisible()
  })

  test('exposes the auto-save preference', async ({ page }) => {
    await openSeededProject(page, buildProject())
    const dialog = await openSettings(page)

    await expect(dialog.getByText('Auto Save')).toBeVisible()
    // Dark Mode + Auto Save at minimum
    await expect(dialog.getByRole('switch')).toHaveCount(2)
  })
})
