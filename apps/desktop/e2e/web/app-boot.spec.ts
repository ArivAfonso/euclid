import { expect, test } from '@playwright/test'
import { seedAppState } from './helpers'

test.describe('app boot', () => {
  test('redirects / to the projects dashboard', async ({ page }) => {
    await seedAppState(page)

    await page.goto('/')

    // First paint can be slow while Vite compiles the app on a cold server
    await expect(page).toHaveURL(/\/projects$/, { timeout: 30_000 })
    await expect(page.getByText('No projects found')).toBeVisible()
  })

  test('boots without console errors or unhandled exceptions', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await seedAppState(page)
    await page.goto('/')
    await expect(page.getByText('No projects found')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('renders the 404 page', async ({ page }) => {
    await seedAppState(page)

    await page.goto('/404')

    await expect(page.getByText("This artboard doesn't exist")).toBeVisible()
    await expect(page.getByText('404 × 404 px')).toBeVisible()
    await expect(page.getByText('HTTP 404 · Not Found')).toBeVisible()
  })
})
