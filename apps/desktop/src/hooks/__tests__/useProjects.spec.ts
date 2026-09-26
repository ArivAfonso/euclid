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
    zoom: 0.5,
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
  zoom: 0.5,
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
      expect(validated[0].zoom).toBe(0.5)

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
