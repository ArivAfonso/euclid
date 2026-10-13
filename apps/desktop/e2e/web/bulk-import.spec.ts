import { expect, test } from '@playwright/test'
import { goToProjects, readStoredProjects, seedAppState, waitForEditor } from './helpers'

const makeTemplateJson = (name: string, width = 1080, height = 1080) =>
  JSON.stringify({
    version: '6.7.1',
    id: `template-${name}`,
    name,
    background: 'rgba(255,255,255,0)',
    objects: [
      {
        id: 'WorkSpaceDrawType',
        type: 'Rect',
        name: 'rect',
        left: 0,
        top: 0,
        width,
        height,
        fill: '#ffffff',
        selectable: false,
        evented: false,
      },
    ],
    workSpace: { fillType: 0, left: 0, top: 0, angle: 0, scaleX: 1, scaleY: 1, fill: '#ffffff' },
    zoom: 1,
    width,
    height,
  })

const jsonFile = (name: string, content: string) => ({
  name,
  mimeType: 'application/json',
  buffer: Buffer.from(content),
})

test.describe('projects bulk import', () => {
  test('imports multiple JSON files as new projects', async ({ page }) => {
    await seedAppState(page)
    await goToProjects(page)

    await page.getByRole('button', { name: 'Import', exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('input[type="file"]').setInputFiles([
      jsonFile('poster-a.json', makeTemplateJson('Poster A')),
      jsonFile('poster-b.json', makeTemplateJson('Poster B', 1920, 1080)),
    ])

    await expect(dialog).toContainText('Poster A')
    await expect(dialog).toContainText('Poster B')

    await dialog.getByRole('button', { name: 'Import 2 Projects' }).click()

    await expect(dialog).toBeHidden()
    const toast = page.getByRole('alert').filter({ hasText: 'Import complete' })
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('2 projects created')

    await expect(page.locator('.project-card-name')).toHaveCount(2)
    await expect(page.locator('.project-card-name', { hasText: 'Poster A' })).toBeVisible()
    await expect(page.locator('.project-card-name', { hasText: 'Poster B' })).toBeVisible()

    // Thumbnails are rendered in the background — no need to open each project
    await expect(page.locator('img[alt="Poster A"]')).toHaveAttribute('src', /^data:image\/jpeg/)
    await expect(page.locator('img[alt="Poster B"]')).toHaveAttribute('src', /^data:image\/jpeg/)

    const stored = await readStoredProjects(page)
    expect(stored.map((p) => p.name).sort()).toEqual(['Poster A', 'Poster B'])
    expect(stored.every((p) => p.canvasData.length === 1)).toBe(true)
    expect(stored[0].folderId).toBeNull()
    // Listed dimensions are the real artboard size
    expect(stored.find((p) => p.name === 'Poster B')).toMatchObject({ width: 1920, height: 1080 })

    // An imported project opens in the editor
    await page.locator('.project-card-name', { hasText: 'Poster A' }).click()
    await waitForEditor(page)
    await expect(page).toHaveURL(/\/editor\?project=/)
  })

  test('skips invalid files while importing valid ones', async ({ page }) => {
    await seedAppState(page)
    await goToProjects(page)

    await page.getByRole('button', { name: 'Import', exact: true }).click()

    const dialog = page.getByRole('dialog')
    await dialog.locator('input[type="file"]').setInputFiles([
      jsonFile('good.json', makeTemplateJson('Good One')),
      jsonFile('broken.json', '{not json'),
      jsonFile('wrong-shape.json', '{"width": 100, "height": 100}'),
    ])

    await expect(dialog).toContainText('Good One')
    await expect(dialog).toContainText('File is not valid JSON')
    await expect(dialog).toContainText('not an Euclid template')
    await expect(dialog).toContainText('1 ready · 2 skipped (invalid)')

    await dialog.getByRole('button', { name: 'Import 1 Project' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.locator('.project-card-name')).toHaveCount(1)
    await expect(page.locator('.project-card-name')).toHaveText('Good One')
    const toast = page.getByRole('alert').filter({ hasText: 'Import complete' })
    await expect(toast).toContainText('2 files skipped')

    const stored = await readStoredProjects(page)
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Good One')
  })

  test('imports into the folder that is currently open', async ({ page }) => {
    await seedAppState(page)
    await goToProjects(page)

    // Create a folder from the toolbar and open it
    await page.getByRole('button', { name: 'Folder', exact: true }).click()
    const folderDialog = page.getByRole('dialog')
    await folderDialog.getByPlaceholder('Enter folder name').fill('Imports')
    await folderDialog.getByRole('button', { name: 'Create' }).click()

    await page.locator('h3', { hasText: 'Imports' }).click()
    await expect(page.getByText('This folder is empty')).toBeVisible()

    // Bulk import while inside the folder
    await page.getByRole('button', { name: 'Import', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('input[type="file"]').setInputFiles([
      jsonFile('in-folder.json', makeTemplateJson('Inside Folder')),
    ])
    await dialog.getByRole('button', { name: 'Import 1 Project' }).click()

    await expect(page.locator('.project-card-name')).toHaveText('Inside Folder')

    const folders = await page.evaluate(
      () => JSON.parse(localStorage.getItem('NEXT_PROJECT_FOLDERS') || '[]') as Array<{ id: string; name: string }>,
    )
    expect(folders).toHaveLength(1)
    expect(folders[0].name).toBe('Imports')

    const stored = await readStoredProjects(page)
    expect(stored).toHaveLength(1)
    expect(stored[0].folderId).toBe(folders[0].id)

    // The project does not leak into the root view
    await page.getByRole('button', { name: 'Root', exact: true }).click()
    await expect(page.locator('.project-card-name')).toHaveCount(0)
    await expect(page.locator('h3', { hasText: 'Imports' })).toBeVisible()
  })
})
