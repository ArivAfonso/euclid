import { expect, test } from '@playwright/test'
import {
  buildProject,
  createProjectViaUI,
  readStoredProjects,
  seedAppState,
  waitForEditor,
} from './helpers'

test.describe('projects dashboard', () => {
  test('shows the empty state with creation actions', async ({ page }) => {
    await seedAppState(page)
    await page.goto('/projects')

    await expect(page.getByText('No projects found')).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Folder' })).toBeVisible()
  })

  test('creates a project through the dialog and opens the editor', async ({ page }) => {
    await createProjectViaUI(page, 'UI Created Project')

    await expect(page).toHaveURL(/\/editor/)
    const projects = await readStoredProjects(page)
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('UI Created Project')
    expect(projects[0].width).toBeGreaterThan(0)
    expect(projects[0].canvasData.length).toBeGreaterThan(0)
  })

  test('lists seeded projects and filters via search', async ({ page }) => {
    await seedAppState(page, {
      projects: [
        buildProject({ id: 'p1', name: 'Alpha Design' }),
        buildProject({ id: 'p2', name: 'Beta Design' }),
      ],
    })
    await page.goto('/projects')

    await expect(page.locator('.project-card-name')).toHaveCount(2)

    await page.getByPlaceholder('Search...').fill('Alpha')

    await expect(page.locator('.project-card-name')).toHaveCount(1)
    await expect(page.locator('.project-card-name')).toHaveText('Alpha Design')
  })

  test('renames a project from the card context menu', async ({ page }) => {
    await seedAppState(page, { projects: [buildProject({ name: 'Rename Me' })] })
    await page.goto('/projects')

    await page.locator('.project-card-name').click({ button: 'right' })
    await page.getByText('Rename', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input').first().fill('Renamed Project')
    await dialog.getByRole('button', { name: 'Rename' }).click()

    await expect(page.locator('.project-card-name')).toHaveText('Renamed Project')
  })

  test('deletes a project with confirmation', async ({ page }) => {
    await seedAppState(page, { projects: [buildProject({ name: 'Delete Me' })] })
    await page.goto('/projects')

    await page.locator('.project-card-name').click({ button: 'right' })
    await page.getByText('Delete', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(/Are you sure you want to delete/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('.project-card-name')).toHaveCount(0)
    await expect(page.getByText('No projects found')).toBeVisible()
    expect(await readStoredProjects(page)).toHaveLength(0)
  })

  test('creates a folder from the empty state', async ({ page }) => {
    await seedAppState(page)
    await page.goto('/projects')

    await page.getByRole('button', { name: 'New Folder' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('Enter folder name').fill('Designs')
    await dialog.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Designs').first()).toBeVisible()
  })

  test('opens a seeded project in the editor by clicking its card', async ({ page }) => {
    const project = buildProject({ name: 'Open Me' })
    await seedAppState(page, { projects: [project] })
    await page.goto('/projects')

    await page.locator('.project-card-name').click()

    await waitForEditor(page)
    await expect(page).toHaveURL(new RegExp(`project=${project.id}`))
  })
})
