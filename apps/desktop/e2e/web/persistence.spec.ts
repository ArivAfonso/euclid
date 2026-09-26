import { expect, test } from '@playwright/test'
import {
  createProjectViaUI,
  openLeftPanel,
  readStoredProjects,
  waitForEditor,
} from './helpers'

test.describe('persistence', () => {
  test('saves a new project and restores its pages after reopening', async ({ page }) => {
    await createProjectViaUI(page, 'Persisted Project')

    // Add a second page so there is a change worth persisting
    await openLeftPanel(page, 'pages')
    await page.locator('button[title="Add New Page"]').click()
    await expect(page.getByText('2/2', { exact: true })).toBeVisible()

    // Explicitly flush the save and wait until storage reflects both pages
    await page.evaluate(() => (window as any).__euclidSave?.())
    await expect
      .poll(async () => (await readStoredProjects(page))[0]?.canvasData?.length)
      .toBe(2)

    // Leave the editor through the sidebar Home button
    await page.locator('[data-onboarding="left-sidebar"] button').first().click()
    await expect(page).toHaveURL(/\/projects/)
    await expect(page.locator('.project-card-name')).toHaveText('Persisted Project')

    // Reopen and verify the second page survived the round trip
    await page.locator('.project-card-name').click()
    await waitForEditor(page)
    await openLeftPanel(page, 'pages')
    await expect(page.getByText('1/2', { exact: true })).toBeVisible()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByText('2/2', { exact: true })).toBeVisible()
  })

  test('keeps a UI-created project across a browser reload', async ({ page }) => {
    await createProjectViaUI(page, 'Reload Me')

    await page.locator('[data-onboarding="left-sidebar"] button').first().click()
    await expect(page.locator('.project-card-name')).toHaveText('Reload Me')

    await page.reload()

    await expect(page.locator('.project-card-name')).toHaveText('Reload Me')
  })

  test('does not persist page changes until an explicit save', async ({ page }) => {
    await createProjectViaUI(page, 'Unsaved Project')

    const before = (await readStoredProjects(page))[0]
    expect(before.canvasData).toHaveLength(1)

    await openLeftPanel(page, 'pages')
    await page.locator('button[title="Add New Page"]').click()
    await expect(page.getByText('2/2', { exact: true })).toBeVisible()

    // Saving is manual: the stored snapshot still holds a single page
    const during = (await readStoredProjects(page))[0]
    expect(during.id).toBe(before.id)
    expect(during.canvasData).toHaveLength(1)

    // After an explicit save the new page is persisted
    await page.evaluate(() => (window as any).__euclidSave?.())
    await expect
      .poll(async () => (await readStoredProjects(page))[0]?.canvasData?.length)
      .toBe(2)
  })
})
