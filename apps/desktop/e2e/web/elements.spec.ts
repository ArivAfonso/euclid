import { expect, test } from '@playwright/test'
import {
  addBarcode,
  addLine,
  addLogoImage,
  addMathFormula,
  addQrCode,
  addShape,
  addTextElement,
  buildProject,
  clearCanvasSelection,
  expectObjectCount,
  openLeftPanel,
  openSeededProject,
  rightPanel,
} from './helpers'

/**
 * Element system coverage: creating every creatable element type through the
 * real UI, and verifying the matching style panel appears on the right.
 */
test.describe('element creation & customization', () => {
  test.beforeEach(async ({ page }) => {
    await openSeededProject(page, buildProject())
  })

  test('adds a title text element and exposes the typography panel', async ({ page }) => {
    await expectObjectCount(page, 0)
    await addTextElement(page, 'Title')
    await expectObjectCount(page, 1)

    const panel = page.locator('.text-style-panel')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('Font', { exact: true })).toBeVisible()

    // Customize: change the font size through the combobox input
    const size = panel.getByPlaceholder('Size')
    await size.fill('48')
    await size.blur()
    await expect(size).toHaveValue('48')
  })

  test('adds a shape from the material panel with the shape style panel', async ({ page }) => {
    await addShape(page, 'Rectangle', 0)
    await expectObjectCount(page, 1)

    const panel = page.locator('.shape-style-panel')
    await expect(panel).toBeVisible()
    await expect(page.locator('.line-style-panel')).toHaveCount(0)

    for (const heading of ['Position', 'Fill', 'Opacity']) {
      await expect(panel.getByText(heading, { exact: true }).first()).toBeVisible()
    }
  })

  test('adds a line and switches it to dashed with an arrow endpoint', async ({ page }) => {
    await addLine(page, 'Straight', 0)
    await expectObjectCount(page, 1)

    const panel = page.locator('.line-style-panel')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('Line Style', { exact: true })).toBeVisible()

    // Style select: Solid Line -> Dashed Line
    await panel.getByRole('combobox').nth(0).click()
    await page.getByRole('option', { name: 'Dashed Line', exact: true }).click()
    await expect(panel.getByText('Dashed Line', { exact: true })).toBeVisible()

    // Endpoint select: End -> Arrow
    await panel.getByRole('combobox').nth(2).click()
    await page.getByRole('option', { name: 'Arrow', exact: true }).click()
  })

  test('adds a QR code through the dialog and edits its content', async ({ page }) => {
    await addQrCode(page, 'https://euclid.test')
    await expectObjectCount(page, 1)

    const panel = rightPanel(page)
    await expect(panel.getByText('QR Code Style', { exact: true })).toBeVisible()

    const content = panel.getByPlaceholder('Enter QR code content')
    await content.fill('https://updated.test')
    await expect(content).toHaveValue('https://updated.test')
  })

  test('adds a LaTeX math formula through the dialog', async ({ page }) => {
    await addMathFormula(page, 'a^2 + b^2 = c^2')
    await expectObjectCount(page, 1)

    const panel = rightPanel(page)
    await expect(panel.getByText('Math Formula', { exact: true })).toBeVisible()

    // The formula is echoed back into the read-only expression field
    await expect(panel.locator('input[placeholder="No expression"]')).toHaveValue(/a\^2 \+ b\^2 = c\^2/)

    // The edit dialog re-opens with the existing expression
    await panel.getByRole('button', { name: 'Edit', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('e.g., E = mc^2')).toHaveValue('a^2 + b^2 = c^2')
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(dialog).toBeHidden()
  })

  test('adds a barcode component', async ({ page }) => {
    await addBarcode(page)
    await expectObjectCount(page, 1)
  })

  test('adds a logo image from the bundled logo gallery to the canvas', async ({ page }) => {
    await addLogoImage(page)

    // The logo renders as a selected 200x200 group on the canvas
    // NOTE: the selected-object size is rendered without a space ("200×200px")
    // while the canvas size uses one ("1920×1080 px").
    await expect(page.locator('[data-onboarding="bottom-bar"]')).toContainText('group')
    await expect(page.locator('[data-onboarding="bottom-bar"]')).toContainText(/200×200/)
  })

  test('KNOWN ISSUE — logo elements are tracked in the template object model', async ({ page }) => {
    // LogoGallery.createLogo() adds the group straight to the fabric canvas
    // (canvas.add) without calling templatesStore.addElement, so object
    // counting, the layers panel, page switching and undo history do not see it.
    // When the app is fixed, this test starts passing and Playwright flags the
    // stale marker — remove it then.
    test.fail(true, 'LogoGallery bypasses the template object model')

    await addLogoImage(page)
    await expectObjectCount(page, 1)
  })

  test('lists every created element in the layers panel', async ({ page }) => {
    await addTextElement(page, 'Title')
    await addShape(page, 'Rectangle', 0)
    await addLine(page, 'Straight', 1)

    await openLeftPanel(page, 'layer')

    // The panel lists the non-selectable workspace rect row plus the objects
    await expect(page.locator('.layer-item')).toHaveCount(4)
    await expect(page.locator('.layer-type-badge').filter({ hasText: 'RECT' })).toHaveCount(1)

    for (const badge of ['TEXTBOX', 'PATH', 'POLYLINE']) {
      await expect(page.locator('.layer-type-badge').filter({ hasText: badge })).toHaveCount(1)
    }

    // The workspace rect does not count as an object
    await expectObjectCount(page, 3)
  })

  test('deletes the selected element from the right-panel quick actions', async ({ page }) => {
    await addTextElement(page, 'Title')
    await expectObjectCount(page, 1)

    await page.locator('[data-onboarding="right-panel"] button:has(svg.lucide-trash-2)').click()

    await expectObjectCount(page, 0)
  })

  test('changes the canvas measurement unit from the canvas style panel', async ({ page }) => {
    await clearCanvasSelection(page)

    const panel = page.locator('.canvas-design-panel')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('Canvas Size', { exact: true })).toBeVisible()
    await expect(panel.getByText('Background', { exact: true })).toBeVisible()

    await panel.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'inch', exact: true }).click()

    await expect(page.locator('[data-onboarding="bottom-bar"]')).toContainText('inch')
  })
})
