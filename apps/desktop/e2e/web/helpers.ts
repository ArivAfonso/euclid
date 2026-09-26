import { expect, type Page } from '@playwright/test'

export const ONBOARDING_KEY = 'euclid_onboarding_completed'
export const PROJECTS_KEY = 'NEXT_SAVED_PROJECTS'

export interface SeedProjectOptions {
  id?: string
  name?: string
  description?: string
  folderId?: string | null
  pages?: number
}

export interface SeededProject {
  id: string
  name: string
  description: string
  width: number
  height: number
  thumbnail: string
  canvasData: unknown[]
  created: number
  modified: number
  folderId: string | null
}

const makeTemplate = (index: number) => ({
  version: '6.7.1',
  id: `template-${index}`,
  background: 'rgba(255,255,255,0)',
  objects: [
    {
      id: 'WorkSpaceDrawType',
      name: 'rect',
      type: 'Rect',
      left: 0,
      top: 0,
      width: 1920,
      height: 1080,
      fill: '#ffffff',
      selectable: false,
      evented: false,
    },
  ],
  workSpace: {
    fillType: 0,
    left: 0,
    top: 0,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    fill: '#ffffff',
  },
  zoom: 0.5,
  width: 1920,
  height: 1080,
})

/** Builds a SavedProject shaped exactly like useProjects() writes them. */
export const buildProject = ({
  id = 'e2e-project-1',
  name = 'E2E Project',
  description = '',
  folderId = null,
  pages = 1,
}: SeedProjectOptions = {}): SeededProject => ({
  id,
  name,
  description,
  width: 1920,
  height: 1080,
  thumbnail: '',
  canvasData: Array.from({ length: pages }, (_, i) => makeTemplate(i)),
  created: Date.now(),
  modified: Date.now(),
  folderId,
})

/**
 * Seeds localStorage before every navigation:
 *  - marks the onboarding tour as completed (it would otherwise block clicks)
 *  - optionally pre-creates projects
 */
export const seedAppState = async (
  page: Page,
  { projects = [], onboarding = true }: { projects?: SeededProject[]; onboarding?: boolean } = {},
) => {
  await page.addInitScript(
    (payload: {
      projects: SeededProject[]
      onboarding: boolean
      onboardingKey: string
      projectsKey: string
    }) => {
      try {
        if (payload.onboarding) localStorage.setItem(payload.onboardingKey, 'true')
        // Pin the measurement unit to px so status-bar assertions are stable
        // (the app defaults to mm).
        localStorage.setItem('unitMode', '1')
        if (payload.projects.length) {
          localStorage.setItem(payload.projectsKey, JSON.stringify(payload.projects))
        }
      } catch {
        // localStorage may be unavailable on about:blank — ignore
      }
    },
    { projects, onboarding, onboardingKey: ONBOARDING_KEY, projectsKey: PROJECTS_KEY },
  )
}

export const goToProjects = async (page: Page) => {
  await page.goto('/projects')
  await expect(page.locator('body')).toContainText('Projects', { timeout: 30_000 })
}

/** Waits until the editor canvas is live and the loading overlay is gone. */
export const waitForEditor = async (page: Page) => {
  await expect(page.locator('[data-onboarding="canvas-header"]')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('[data-onboarding="canvas-area"] canvas.upper-canvas')).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.locator('.canvas-loading-overlay')).toBeHidden({ timeout: 30_000 })
}

/** Opens the editor for a pre-seeded project. */
export const openSeededProject = async (page: Page, project: SeededProject) => {
  await seedAppState(page, { projects: [project] })
  await page.goto(`/editor?project=${project.id}`)
  await waitForEditor(page)
}
/** Runs the full "New Project" dialog flow and waits for the editor. */
export const createProjectViaUI = async (page: Page, name: string) => {
  // Seed a fresh profile first so the first-run onboarding tour cannot
  // overlay (and intercept clicks on) the projects page.
  await seedAppState(page)
  await goToProjects(page)
  await page.locator('[data-onboarding="new-project-btn"]:visible').first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder('My Project').fill(name)
  await dialog.getByRole('button', { name: 'Create' }).click()

  await waitForEditor(page)
}

export type LeftPanelKey =
  | 'editor'
  | 'layer'
  | 'pages'
  | 'template'
  | 'material'
  | 'text'
  | 'image'
  | 'uploads'

/**
 * Detects whether the given left panel is already open.
 * The rail marks the active tab with a gradient background, and the panel
 * itself slides between left:-251px (closed) and left:50px (open).
 */
const isLeftPanelOpenFor = (page: Page, key: LeftPanelKey) =>
  page.evaluate((panelKey: string) => {
    const tab = document.getElementById(`left-tabs-${panelKey}`)
    if (!tab) return false
    const active = tab.parentElement?.className.includes('bg-gradient-to-br') ?? false
    if (!active) return false
    const panel = document.querySelector('div[class*="w-[300px]"]') as HTMLElement | null
    return !!panel && panel.getBoundingClientRect().x > -10
  }, key)

/**
 * Opens a left sidebar panel.
 * NOTE: clicking the ACTIVE rail tab toggles the panel closed, so only click
 * when the requested panel is not already showing.
 */
export const openLeftPanel = async (page: Page, key: LeftPanelKey) => {
  if (await isLeftPanelOpenFor(page, key)) return
  await page.locator(`#left-tabs-${key}`).click()
}

export const readStoredProjects = async (page: Page): Promise<SeededProject[]> =>
  page.evaluate((key: string) => JSON.parse(localStorage.getItem(key) || '[]'), PROJECTS_KEY)

/**
 * Clicks an empty spot on the fabric canvas so no object keeps the selection.
 *
 * NOTE: the click must avoid every overlay in the canvas region:
 *  - the left tool panel slides in with a transition over the canvas' left
 *    edge (its footer holds real buttons like Delete / Present),
 *  - CanvasAffix and the image-loading pill float near the bottom, and
 *  - sonner toasts occupy the bottom-right corner.
 * Bottom-right is the default (safe while the sidebar is open); use
 * 'bottom-left' when the sidebar is closed.
 */
export const clearCanvasSelection = async (
  page: Page,
  corner: 'bottom-right' | 'bottom-left' = 'bottom-right',
) => {
  const canvasArea = page.locator('[data-onboarding="canvas-area"]')
  const box = await canvasArea.boundingBox()
  if (!box) return
  const x = corner === 'bottom-right' ? box.x + box.width - 80 : box.x + 24
  await page.mouse.click(x, box.y + box.height - 24)
}

// ─────────────────────────────────────────────────────────────
// Element helpers — creation & inspection
// ─────────────────────────────────────────────────────────────

/**
 * Reads the object count from the status bar.
 * NOTE: the status bar concatenates spans without separators, e.g. the raw
 * text reads " 3 objectsX: 0 Y: 0 px Zoom: 100% ...".
 */
export const readObjectCount = async (page: Page): Promise<number> => {
  const text = await page.locator('[data-onboarding="bottom-bar"]').innerText()
  const match = text.match(/(\d+)\s+objects?/)
  return match ? Number(match[1]) : 0
}

/** Asserts the status-bar object counter (handles singular/plural). */
export const expectObjectCount = async (page: Page, expected: number) => {
  // No trailing \b: the next status-bar span is glued on ("3 objectsX: ...")
  const pattern = expected === 1 ? /\b1 object/ : new RegExp(`\\b${expected} objects`)
  await expect(page.locator('[data-onboarding="bottom-bar"]')).toContainText(pattern)
}

export type TextPreset = 'Title' | 'Subtitle' | 'Body' | 'Vertical' | 'Hollow' | 'Arc'

/** Adds a text element from the default sidebar 'editor' panel. */
export const addTextElement = async (page: Page, preset: TextPreset) => {
  await openLeftPanel(page, 'editor')
  await page.getByRole('button', { name: preset, exact: true }).click()
}

/**
 * Material panel: clicks the nth item of a shape category.
 * Categories: 'Rectangle' | 'Common Shapes' | 'Arrows' | 'Other Shapes' | 'Linear'.
 * Shape items are icon-only buttons grouped under each category heading.
 */
export const addShape = async (page: Page, category: string, index = 0) => {
  await openLeftPanel(page, 'material')
  const grid = page
    .getByRole('heading', { name: category, exact: true })
    .locator('xpath=following-sibling::div[1]')
  await grid.getByRole('button').nth(index).click()
}

/**
 * Material panel: clicks the nth line of a line group.
 * Groups: 'Straight' (5 items) | 'Polyline & Curve' (3 items).
 */
export const addLine = async (page: Page, group: string, index = 0) => {
  await openLeftPanel(page, 'material')
  const grid = page
    .getByRole('heading', { name: group, exact: true })
    .locator('xpath=following-sibling::div[1]')
  await grid.getByRole('button').nth(index).click()
}

/** Adds a QR code through the "Generate QR Code" dialog. */
export const addQrCode = async (page: Page, content: string) => {
  await openLeftPanel(page, 'editor')
  await page.getByRole('button', { name: 'QR Code', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder('Enter URL or text').fill(content)
  await dialog.getByRole('button', { name: 'Generate' }).click()
  await expect(dialog).toBeHidden({ timeout: 30_000 })
}

/** Adds a KaTeX math element through the "Math" dialog (rasterized via html2canvas). */
export const addMathFormula = async (page: Page, expression: string) => {
  await openLeftPanel(page, 'editor')
  await page.getByRole('button', { name: 'Math', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder('E = mc^2', { exact: true }).fill(expression)
  await dialog.getByRole('button', { name: 'Insert Formula' }).click()
  await expect(dialog).toBeHidden({ timeout: 45_000 })
}

/** Adds a barcode component from the sidebar 'editor' panel. */
export const addBarcode = async (page: Page) => {
  await openLeftPanel(page, 'editor')
  await page.getByRole('button', { name: 'Barcode', exact: true }).click()
}

/**
 * Adds an image from the fully-offline logo gallery (bundled simple-icons),
 * avoiding any network dependency on the stock-image worker.
 */
export const addLogoImage = async (page: Page, index = 0) => {
  await openLeftPanel(page, 'image')
  await page.getByRole('button', { name: 'Logos', exact: true }).click()
  await page.locator('.logo-item').nth(index).click()
}

/** Right-panel (element style) container. */
export const rightPanel = (page: Page) => page.locator('[data-onboarding="right-panel"]')
