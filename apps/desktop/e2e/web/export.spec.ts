import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { buildProject, openSeededProject } from './helpers'

test.describe('export', () => {
  test('exports the document as JSON with the expected filename', async ({ page }) => {
    await openSeededProject(page, buildProject())

    await page.getByRole('button', { name: 'Download' }).click()
    // The right sidebar hosts several selects (unit, fill, format, DPI) —
    // target the export format selector by its current value.
    await page.getByRole('combobox').filter({ hasText: 'Image' }).click()
    await page.getByRole('option', { name: 'JSON' }).click()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export JSON' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^euclid-\d+\.json$/)

    const filePath = await download.path()
    const raw = fs.readFileSync(filePath!, 'utf8')
    const parsed = JSON.parse(raw)
    expect(parsed).toBeTruthy()
  })

  test('exports the current page as a PNG image', async ({ page }) => {
    await openSeededProject(page, buildProject())

    await page.getByRole('button', { name: 'Download' }).click()
    await page.getByRole('button', { name: 'PNG', exact: true }).click()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export Image' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^euclid-\d+\.png$/)

    const filePath = await download.path()
    expect(fs.statSync(filePath!).size).toBeGreaterThan(0)
  })
})
