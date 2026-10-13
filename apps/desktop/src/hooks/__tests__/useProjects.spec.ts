import { beforeEach, describe, expect, it, vi } from 'vitest'
import useProjects from '@/hooks/useProjects'
import { useTemplatesStore } from '@/store'
import type { SavedProject, ProjectFolder } from '@/hooks/useProjects'

// ─────────────────────────────────────────────────────────────
// Hoisted mutable fixtures shared with the module mocks
// ─────────────────────────────────────────────────────────────
const h = vi.hoisted(() => ({
  canvas: null as unknown,
  center: { left: 0, top: 0, width: 1920, height: 1080 },
}))

vi.mock('@/views/Canvas/useCanvas', () => ({
  default: () => [h.canvas],
}))

vi.mock('@/views/Canvas/useCenter', () => ({
  default: () => h.center,
}))

// Offscreen thumbnail rendering needs a real 2D canvas; the hook only cares
// that it is handed a template and gets a data URL back.
const renderTemplateThumbnail = vi.hoisted(() => vi.fn())
vi.mock('@/utils/templateThumbnail', () => ({ renderTemplateThumbnail }))

// The real store barrel pulls in fabric.js and the full editor runtime — the
// projects layer only ever needs templates/currentTemplate + a font hook.
vi.mock('@/store', async () => {
  const { computed, reactive, ref } = await import('vue')

  const template = {
    version: '6.7.1',
    id: 'blank_template',
    background: 'rgba(255,255,255,0)',
    objects: [
      {
        id: 'WorkSpaceDrawType',
        type: 'Rect',
        name: 'rect',
        width: 1920,
        height: 1080,
        fill: '#ffffff',
      },
    ],
    workSpace: { fillType: 0, left: 0, top: 0, angle: 0, scaleX: 1, scaleY: 1, fill: '#ffffff' },
    zoom: 1,
    width: 1920,
    height: 1080,
  }

  const templates = ref([template])
  const templateIndex = ref(0)

  const templatesStore = reactive({
    templates,
    templateIndex,
    currentTemplate: computed(() => templates.value[templateIndex.value] ?? null),
    replaceProjectTemplates: vi.fn((data: unknown[]) => {
      templates.value = data as never
      templateIndex.value = 0
    }),
    renderTemplate: vi.fn(async () => {}),
  })

  const mainStore = reactive({
    ensureFontLoaded: vi.fn(),
  })

  return {
    useTemplatesStore: () => templatesStore,
    useMainStore: () => mainStore,
  }
})

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const PROJECTS_KEY = 'NEXT_SAVED_PROJECTS'
const FOLDERS_KEY = 'NEXT_PROJECT_FOLDERS'

const makeCanvasMock = () => ({
  toObject: vi.fn(() => ({
    version: '6.7.1',
    objects: [{ id: 'WorkSpaceDrawType', type: 'Rect', name: 'rect' }],
    background: 'rgba(255,255,255,0)',
  })),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,MOCKTHUMB'),
  getZoom: vi.fn(() => 0.5),
  viewportTransform: [1, 0, 0, 1, 0, 0],
  backgroundColor: 'rgba(255,255,255,0)',
  renderAll: vi.fn(),
  discardActiveObject: vi.fn(),
  clear: vi.fn(),
})

const makeTemplatePayload = (overrides: Record<string, unknown> = {}) => ({
  version: '6.7.1',
  id: 'template-1',
  background: 'rgba(255,255,255,0)',
  objects: [],
  workSpace: { fillType: 0, left: 0, top: 0, angle: 0, scaleX: 1, scaleY: 1, fill: '#ffffff' },
  zoom: 1,
  width: 1920,
  height: 1080,
  ...overrides,
})

const makeSavedProject = (overrides: Partial<SavedProject> = {}): SavedProject => ({
  id: 'project-1',
  name: 'Project 1',
  description: '',
  width: 1920,
  height: 1080,
  thumbnail: '',
  canvasData: [makeTemplatePayload()] as never,
  created: 1000,
  modified: 1000,
  folderId: null,
  ...overrides,
})

describe('hooks/useProjects', () => {
  let canvasMock: ReturnType<typeof makeCanvasMock>
  let api: ReturnType<typeof useProjects>
  const templatesStore = useTemplatesStore() as unknown as {
    templates: Array<{ width: number; height: number; zoom: number }>
    replaceProjectTemplates: ReturnType<typeof vi.fn>
    renderTemplate: ReturnType<typeof vi.fn>
  }

  const readStoredProjects = (): SavedProject[] => JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]')
  const readStoredFolders = (): ProjectFolder[] => JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]')

  const seedProjects = (projects: SavedProject[]) => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
    api.invalidateProjectsCache()
  }

  const seedFolders = (folders: ProjectFolder[]) => {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
  }

  beforeEach(() => {
    canvasMock = makeCanvasMock()
    h.canvas = canvasMock
    api = useProjects()
    api.invalidateProjectsCache()
    templatesStore.replaceProjectTemplates.mockClear()
    templatesStore.renderTemplate.mockClear()
  })

  // ═════════════════════════ Project storage ═════════════════════════

  describe('getSavedProjects', () => {
    it('returns an empty list when nothing is stored', () => {
      expect(api.getSavedProjects()).toEqual([])
    })

    it('recovers from corrupted JSON', () => {
      localStorage.setItem(PROJECTS_KEY, '{not valid json')
      api.invalidateProjectsCache()
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(api.getSavedProjects()).toEqual([])

      consoleError.mockRestore()
    })
  })

  describe('stored dimensions', () => {
    it('repairs projects saved with the zoomed template size', () => {
      // Listed as 540×1220 although the artboard is 1080×2440
      const template = makeTemplatePayload({
        width: 540,
        height: 1220,
        zoom: 0.5,
        objects: [{ id: 'WorkSpaceDrawType', type: 'Rect', width: 1080, height: 2440 }],
      })
      seedProjects([
        makeSavedProject({ id: 'zoomed', width: 540, height: 1220, canvasData: [template] as never }),
        makeSavedProject({ id: 'fine', width: 1920, height: 1080 }),
      ])

      const projects = api.getSavedProjects()

      expect(projects.find((p) => p.id === 'zoomed')).toMatchObject({ width: 1080, height: 2440 })
      expect(projects.find((p) => p.id === 'fine')).toMatchObject({ width: 1920, height: 1080 })
    })
  })

  describe('saveProject', () => {
    it('serializes the current template and persists the project synchronously', async () => {
      const project = await api.saveProject('My Design', 'A description')

      expect(project).not.toBeNull()
      expect(project!.name).toBe('My Design')
      expect(project!.description).toBe('A description')
      expect(project!.id).toBeTruthy()
      expect(project!.created).toBe(project!.modified)
      expect(project!.width).toBe(1920)
      expect(project!.height).toBe(1080)
      expect(project!.thumbnail).toBe('data:image/jpeg;base64,MOCKTHUMB')
      expect(project!.canvasData).toHaveLength(1)
      expect(project!.canvasData[0].objects).toHaveLength(1)

      // Live canvas data was used for the current template
      expect(canvasMock.toObject).toHaveBeenCalledTimes(1)

      // Written through immediately (critical save)
      const stored = readStoredProjects()
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe(project!.id)
    })

    it('unshifts new projects to the front of the list', async () => {
      await api.saveProject('First')
      await api.saveProject('Second')

      expect(api.getSavedProjects().map((p) => p.name)).toEqual(['Second', 'First'])
    })

    it('returns null when the canvas is not initialized', async () => {
      h.canvas = null
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const project = await api.saveProject('No Canvas')

      expect(project).toBeNull()
      expect(api.getSavedProjects()).toEqual([])
      consoleError.mockRestore()
    })
  })

  describe('importProjectsFromTemplates', () => {
    const draft = (overrides: Record<string, unknown> = {}) => ({
      name: 'Imported',
      description: '',
      width: 1080,
      height: 1080,
      template: makeTemplatePayload(),
      ...overrides,
    })

    it('creates one project per draft and persists them synchronously', () => {
      const created = api.importProjectsFromTemplates([
        draft({ name: 'Poster A', description: 'First' }),
        draft({ name: 'Poster B', template: makeTemplatePayload({ id: 'template-2' }) }),
      ] as never)

      expect(created).toHaveLength(2)
      expect(created[0].id).toBeTruthy()
      expect(created[1].id).not.toBe(created[0].id)
      expect(created[0].name).toBe('Poster A')
      expect(created[0].description).toBe('First')
      expect(created[0].width).toBe(1080)
      expect(created[0].thumbnail).toBe('')
      expect(created[0].canvasData).toHaveLength(1)
      expect(created[0].folderId).toBeNull()

      // Written through immediately, batch keeps its order
      const stored = readStoredProjects()
      expect(stored.map((p) => p.name)).toEqual(['Poster A', 'Poster B'])
    })

    it('places imported projects in the given folder, in front of existing ones', () => {
      seedProjects([makeSavedProject({ id: 'existing', name: 'Existing' })])

      const created = api.importProjectsFromTemplates([draft({ name: 'New' })] as never, 'folder-1')

      expect(created[0].folderId).toBe('folder-1')
      expect(api.getSavedProjects().map((p) => p.name)).toEqual(['New', 'Existing'])
    })

    it('returns an empty list for empty input', () => {
      expect(api.importProjectsFromTemplates([])).toEqual([])
    })
  })

  describe('updateProject', () => {
    it('returns false for an unknown project id', async () => {
      expect(await api.updateProject('missing', { name: 'X' })).toBe(false)
    })

    it('merges updates, refreshes canvasData and bumps modified', async () => {
      const saved = makeSavedProject({ modified: 1 })
      seedProjects([saved])

      const ok = await api.updateProject(saved.id, { name: 'Renamed' })

      expect(ok).toBe(true)
      const stored = readStoredProjects()[0]
      expect(stored.name).toBe('Renamed')
      expect(stored.modified).toBeGreaterThanOrEqual(saved.modified)
      // canvasData was re-serialized because none was provided
      expect(canvasMock.toObject).toHaveBeenCalled()
    })

    it('syncs the listed dimensions with the resized canvas', async () => {
      const saved = makeSavedProject({ width: 1920, height: 1080 })
      seedProjects([saved])
      const template = templatesStore.templates[0]
      const original = { width: template.width, height: template.height, zoom: template.zoom }

      try {
        // The user resized the artboard to 1080×2440 in the canvas panel while
        // zoomed to 50%: the template stores the zoomed size (540×1220).
        template.width = 540
        template.height = 1220
        template.zoom = 0.5
        canvasMock.toObject.mockReturnValue({
          version: '6.7.1',
          objects: [{ id: 'WorkSpaceDrawType', type: 'Rect', width: 1080, height: 2440 }],
          background: 'rgba(255,255,255,0)',
        })

        expect(await api.updateProject(saved.id, { name: 'Resized' })).toBe(true)

        const stored = readStoredProjects()[0]
        expect(stored.width).toBe(1080)
        expect(stored.height).toBe(2440)
        expect(api.getProject(saved.id)!.width).toBe(1080)
      } finally {
        Object.assign(template, original)
      }
    })

    it('derives the size from the zoom when the canvas has no workspace rect', async () => {
      const saved = makeSavedProject()
      seedProjects([saved])
      const template = templatesStore.templates[0]
      const original = { width: template.width, height: template.height, zoom: template.zoom }

      try {
        template.width = 540
        template.height = 1220
        template.zoom = 0.5

        await api.updateProject(saved.id, { name: 'Resized' })

        const stored = readStoredProjects()[0]
        expect(stored.width).toBeCloseTo(1080)
        expect(stored.height).toBeCloseTo(2440)
      } finally {
        Object.assign(template, original)
      }
    })

    it('lets explicit dimensions in the updates win over the template', async () => {
      const saved = makeSavedProject()
      seedProjects([saved])

      await api.updateProject(saved.id, { width: 500, height: 400 })

      const stored = readStoredProjects()[0]
      expect(stored.width).toBe(500)
      expect(stored.height).toBe(400)
    })

    it('keeps updates working when the canvas is unavailable', async () => {
      const saved = makeSavedProject({ description: 'old' })
      seedProjects([saved])
      h.canvas = null

      const ok = await api.updateProject(saved.id, { description: 'new' })

      expect(ok).toBe(true)
      const stored = readStoredProjects()[0]
      expect(stored.description).toBe('new')
      expect(stored.canvasData).toEqual(saved.canvasData)
    })
  })

  describe('renameProject / deleteProject / getProject', () => {
    it('renames an existing project', () => {
      seedProjects([makeSavedProject({ name: 'Old' })])

      expect(api.renameProject('project-1', 'New')).toBe(true)
      expect(api.getProject('project-1')!.name).toBe('New')
    })

    it('refuses to rename an unknown project', () => {
      expect(api.renameProject('nope', 'New')).toBe(false)
    })

    it('deletes a project without touching the others', () => {
      seedProjects([
        makeSavedProject({ id: 'a', name: 'A' }),
        makeSavedProject({ id: 'b', name: 'B' }),
      ])

      expect(api.deleteProject('a')).toBe(true)
      expect(api.getSavedProjects().map((p) => p.id)).toEqual(['b'])
    })

    it('returns the requested project or null', () => {
      seedProjects([makeSavedProject({ id: 'a' })])

      expect(api.getProject('a')!.id).toBe('a')
      expect(api.getProject('missing')).toBeNull()
    })
  })

  describe('project folders', () => {
    it('moves projects into folders and filters by folder', () => {
      seedProjects([makeSavedProject({ id: 'a' }), makeSavedProject({ id: 'b' })])

      expect(api.moveProjectToFolder('a', 'folder-1')).toBe(true)

      expect(api.getProjectsInFolder('folder-1').map((p) => p.id)).toEqual(['a'])
      expect(api.getProjectsInFolder(null).map((p) => p.id)).toEqual(['b'])
    })

    it('refuses to move an unknown project', () => {
      expect(api.moveProjectToFolder('nope', 'folder-1')).toBe(false)
    })
  })

  // ═════════════════════════ Folder storage ═════════════════════════

  describe('folder CRUD', () => {
    it('creates a root folder with timestamps', () => {
      const folder = api.createFolder('Designs')

      expect(folder).not.toBeNull()
      expect(folder!.id).toBeTruthy()
      expect(folder!.parentId).toBeNull()
      expect(folder!.created).toBe(folder!.modified)
      expect(readStoredFolders()).toHaveLength(1)
    })

    it('creates nested folders with a color', () => {
      const parent = api.createFolder('Parent')!
      const child = api.createFolder('Child', parent.id, '#ff0000')!

      expect(child.parentId).toBe(parent.id)
      expect(child.color).toBe('#ff0000')
      expect(readStoredFolders()).toHaveLength(2)
    })

    it('renames folders', () => {
      const folder = api.createFolder('Old')!

      expect(api.renameFolder(folder.id, 'New')).toBe(true)
      expect(api.getFolder(folder.id)!.name).toBe('New')
      expect(api.renameFolder('missing', 'X')).toBe(false)
    })

    it('updates folder colors', () => {
      const folder = api.createFolder('Folder')!

      expect(api.updateFolderColor(folder.id, '#00ff00')).toBe(true)
      expect(api.getFolder(folder.id)!.color).toBe('#00ff00')
      expect(api.updateFolderColor('missing', '#000')).toBe(false)
    })

    it('lists subfolders of a parent', () => {
      const parent = api.createFolder('Parent')!
      const childA = api.createFolder('A', parent.id)!
      api.createFolder('B', parent.id)

      expect(api.getSubfolders(parent.id).map((f) => f.name).sort()).toEqual(['A', 'B'])
      expect(api.getSubfolders(null).map((f) => f.id)).toContain(parent.id)
      expect(childA.parentId).toBe(parent.id)
    })

    it('builds a breadcrumb path for nested folders', () => {
      const a = api.createFolder('A')!
      const b = api.createFolder('B', a.id)!
      const c = api.createFolder('C', b.id)!

      expect(api.getFolderPath(c.id).map((f) => f.name)).toEqual(['A', 'B', 'C'])
      expect(api.getFolderPath(null)).toEqual([])
    })

    it('moves folders but refuses to move one into its own descendant', () => {
      const a = api.createFolder('A')!
      const b = api.createFolder('B', a.id)!
      const c = api.createFolder('C', b.id)!

      expect(api.moveFolder(a.id, null)).toBe(true)
      expect(api.moveFolder(a.id, c.id)).toBe(false)
      expect(api.moveFolder(a.id, a.id)).toBe(false)
    })

    it('deletes a folder tree and moves its projects to the root by default', () => {
      const a = api.createFolder('A')!
      const b = api.createFolder('B', a.id)!
      seedProjects([
        makeSavedProject({ id: 'in-b', folderId: b.id }),
        makeSavedProject({ id: 'at-root', folderId: null }),
      ])

      expect(api.deleteFolder(a.id)).toBe(true)

      expect(api.getFolders()).toHaveLength(0)
      const projects = api.getSavedProjects()
      expect(projects.find((p) => p.id === 'in-b')!.folderId).toBeNull()
      expect(projects.find((p) => p.id === 'at-root')).toBeTruthy()
    })

    it('deletes folder contents when requested', () => {
      const a = api.createFolder('A')!
      seedProjects([makeSavedProject({ id: 'inside', folderId: a.id })])

      expect(api.deleteFolder(a.id, true)).toBe(true)

      expect(api.getFolders()).toHaveLength(0)
      expect(api.getSavedProjects()).toHaveLength(0)
    })
  })

  // ═════════════════════════ Project loading ═════════════════════════

  describe('loadProject', () => {
    it('returns false for an unknown project', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(await api.loadProject('missing')).toBe(false)
      consoleError.mockRestore()
    })

    it('returns false when the project has no canvas data', async () => {
      seedProjects([makeSavedProject({ canvasData: [] as never })])
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(await api.loadProject('project-1')).toBe(false)
      consoleError.mockRestore()
    })

    it('validates, replaces store templates and renders', async () => {
      seedProjects([makeSavedProject()])

      const ok = await api.loadProject('project-1')

      expect(ok).toBe(true)
      expect(templatesStore.replaceProjectTemplates).toHaveBeenCalledTimes(1)
      expect(templatesStore.renderTemplate).toHaveBeenCalledTimes(1)

      const [validated] = templatesStore.replaceProjectTemplates.mock.calls[0]
      expect(validated).toHaveLength(1)
      expect(validated[0].version).toBe('6.7.1')
      expect(validated[0].zoom).toBe(1)

      expect(canvasMock.discardActiveObject).toHaveBeenCalled()
      expect(canvasMock.clear).toHaveBeenCalled()
      expect(canvasMock.renderAll).toHaveBeenCalled()
    })

    it('injects a workspace rect when the template lost it', async () => {
      const template = makeTemplatePayload({ objects: [] })
      seedProjects([makeSavedProject({ canvasData: [template] as never })])

      await api.loadProject('project-1')

      const [validated] = templatesStore.replaceProjectTemplates.mock.calls[0]
      const workspace = validated[0].objects.find((o: any) => o.id === 'WorkSpaceDrawType')
      expect(workspace).toBeTruthy()
      expect(workspace.width).toBe(1920)
      expect(workspace.height).toBe(1080)
    })

    it('applies fallbacks for missing template fields', async () => {
      const sparse = { width: undefined, height: undefined, workSpace: undefined, zoom: undefined }
      seedProjects([
        makeSavedProject({
          canvasData: [{ id: 'sparse', objects: [], ...sparse }] as never,
        }),
      ])

      await api.loadProject('project-1')

      const [validated] = templatesStore.replaceProjectTemplates.mock.calls[0]
      expect(validated[0].zoom).toBe(1)
      expect(validated[0].width).toBe(1920)
      expect(validated[0].height).toBe(1080)
      expect(validated[0].background).toBe('rgba(255,255,255,0)')
    })

    it('still succeeds when the canvas is unavailable', async () => {
      seedProjects([makeSavedProject()])
      h.canvas = null

      expect(await api.loadProject('project-1')).toBe(true)
      expect(templatesStore.renderTemplate).toHaveBeenCalled()
    })
  })

  describe('generateMissingThumbnails', () => {
    // The worker remembers which projects it already tried, so every test
    // uses fresh ids.
    let seq = 0
    const uid = (label: string) => `${label}-${++seq}`

    // Thumbnail writes are deferred to an idle callback (setTimeout in jsdom)
    const flushStorageWrites = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

    beforeEach(() => {
      renderTemplateThumbnail.mockReset()
      renderTemplateThumbnail.mockResolvedValue('data:image/jpeg;base64,RENDERED')
    })

    it('renders and stores thumbnails for projects that have none', async () => {
      const blank = uid('blank')
      const done = uid('done')
      seedProjects([
        makeSavedProject({ id: blank, thumbnail: '' }),
        makeSavedProject({ id: done, thumbnail: 'data:image/jpeg;base64,EXISTING' }),
      ])
      const onUpdate = vi.fn()

      await api.generateMissingThumbnails(onUpdate)

      expect(renderTemplateThumbnail).toHaveBeenCalledTimes(1)
      expect(onUpdate).toHaveBeenCalledTimes(1)
      await flushStorageWrites()
      const stored = readStoredProjects()
      expect(stored.find((p) => p.id === blank)!.thumbnail).toBe('data:image/jpeg;base64,RENDERED')
      expect(stored.find((p) => p.id === done)!.thumbnail).toBe('data:image/jpeg;base64,EXISTING')
    })

    it('renders from the saved template and keeps modified untouched', async () => {
      const id = uid('blank')
      seedProjects([
        makeSavedProject({
          id,
          modified: 1234,
          canvasData: [makeTemplatePayload({ objects: [], width: 640, height: 480 })] as never,
        }),
      ])

      await api.generateMissingThumbnails()

      // The renderer receives the saved template and normalizes it itself
      const [template] = renderTemplateThumbnail.mock.calls[0]
      expect(template.objects).toEqual([])
      expect(template.width).toBe(640)
      await flushStorageWrites()
      expect(readStoredProjects().find((p) => p.id === id)!.modified).toBe(1234)
    })

    it('hands the page a new array so the grid re-renders', async () => {
      seedProjects([makeSavedProject({ id: uid('blank'), thumbnail: '' })])
      const before = api.getSavedProjects()

      await api.generateMissingThumbnails()

      expect(api.getSavedProjects()).not.toBe(before)
    })

    it('leaves a project blank when rendering yields nothing, and does not retry it', async () => {
      const id = uid('broken')
      seedProjects([makeSavedProject({ id, thumbnail: '' })])
      renderTemplateThumbnail.mockResolvedValue('')
      const onUpdate = vi.fn()

      await api.generateMissingThumbnails(onUpdate)
      await api.generateMissingThumbnails(onUpdate)

      expect(renderTemplateThumbnail).toHaveBeenCalledTimes(1)
      expect(onUpdate).not.toHaveBeenCalled()
      await flushStorageWrites()
      expect(readStoredProjects().find((p) => p.id === id)!.thumbnail).toBe('')
    })

    it('keeps going after one project throws', async () => {
      const bad = uid('bad')
      const good = uid('good')
      seedProjects([
        makeSavedProject({ id: bad, thumbnail: '' }),
        makeSavedProject({ id: good, thumbnail: '' }),
      ])
      renderTemplateThumbnail
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce('data:image/jpeg;base64,GOOD')
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      await api.generateMissingThumbnails()

      await flushStorageWrites()
      const stored = readStoredProjects()
      expect(stored.find((p) => p.id === bad)!.thumbnail).toBe('')
      expect(stored.find((p) => p.id === good)!.thumbnail).toBe('data:image/jpeg;base64,GOOD')
      consoleError.mockRestore()
    })

    it('skips projects deleted while their thumbnail was rendering', async () => {
      const id = uid('gone')
      seedProjects([makeSavedProject({ id, thumbnail: '' })])
      renderTemplateThumbnail.mockImplementation(async () => {
        api.deleteProject(id)
        return 'data:image/jpeg;base64,RENDERED'
      })

      await api.generateMissingThumbnails()

      expect(api.getSavedProjects().find((p) => p.id === id)).toBeUndefined()
    })

    it('shares one worker between concurrent callers', async () => {
      seedProjects([
        makeSavedProject({ id: uid('a'), thumbnail: '' }),
        makeSavedProject({ id: uid('b'), thumbnail: '' }),
      ])
      const first = vi.fn()
      const second = vi.fn()

      await Promise.all([
        api.generateMissingThumbnails(first),
        api.generateMissingThumbnails(second),
      ])

      expect(renderTemplateThumbnail).toHaveBeenCalledTimes(2)
      expect(first).toHaveBeenCalledTimes(2)
      expect(second).toHaveBeenCalledTimes(2)
    })

    it('picks up projects imported while the worker is running', async () => {
      seedProjects([makeSavedProject({ id: uid('first'), thumbnail: '' })])
      // A bulk import lands while the first thumbnail is still rendering
      renderTemplateThumbnail.mockImplementationOnce(async () => {
        api.importProjectsFromTemplates([
          { name: 'Late', description: '', width: 100, height: 100, template: makeTemplatePayload() },
        ] as never)
        return 'data:image/jpeg;base64,RENDERED'
      })

      await api.generateMissingThumbnails()

      expect(renderTemplateThumbnail).toHaveBeenCalledTimes(2)
      await flushStorageWrites()
      const stored = readStoredProjects()
      expect(stored).toHaveLength(2)
      expect(stored.every((p) => p.thumbnail)).toBe(true)
    })
  })

  describe('generateAndSaveThumbnail', () => {
    it('returns false for an unknown project', async () => {
      expect(await api.generateAndSaveThumbnail('missing')).toBe(false)
    })

    it('stores a fresh thumbnail for an existing project', async () => {
      seedProjects([makeSavedProject({ thumbnail: '', modified: 1 })])

      const ok = await api.generateAndSaveThumbnail('project-1')

      expect(ok).toBe(true)
      const stored = readStoredProjects()[0]
      expect(stored.thumbnail).toBe('data:image/jpeg;base64,MOCKTHUMB')
      expect(stored.modified).toBeGreaterThanOrEqual(1)
    })
  })
})
